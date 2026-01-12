import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { bucketName } = await req.json();

    if (!bucketName) {
      return new Response(
        JSON.stringify({ error: 'Bucket name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error("Error listing buckets:", listError);
      return new Response(
        JSON.stringify({ error: 'Failed to list buckets', details: listError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (bucketExists) {
      return new Response(
        JSON.stringify({ success: true, message: 'Bucket already exists', bucketName }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create bucket using SQL (since JS client doesn't support creating buckets)
    const { data: sqlResult, error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
          $1,
          $1,
          true,
          5242880,
          ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        )
        ON CONFLICT (id) DO NOTHING;
      `,
      params: [bucketName]
    });

    // Alternative: Use direct SQL query
    const { error: insertError } = await supabaseAdmin
      .from('storage.buckets')
      .insert({
        id: bucketName,
        name: bucketName,
        public: true,
        file_size_limit: 5242880,
        allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

    if (insertError) {
      // If direct insert fails, try using SQL
      const { error: sqlInsertError } = await supabaseAdmin.rpc('exec_sql', {
        query: `
          INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
          VALUES ($1, $1, true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
          ON CONFLICT (id) DO NOTHING;
        `,
        params: [bucketName]
      });

      if (sqlInsertError) {
        console.error("Error creating bucket:", sqlInsertError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create bucket', 
            details: sqlInsertError.message,
            hint: 'Please create the bucket manually via Supabase Dashboard or SQL Editor'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create RLS policies
    const policies = [
      {
        name: 'Public Access',
        policy: `CREATE POLICY IF NOT EXISTS "Public Access" ON storage.objects FOR SELECT USING (bucket_id = '${bucketName}');`
      },
      {
        name: 'Authenticated users can upload',
        policy: `CREATE POLICY IF NOT EXISTS "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = '${bucketName}');`
      },
      {
        name: 'Authenticated users can update',
        policy: `CREATE POLICY IF NOT EXISTS "Authenticated users can update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = '${bucketName}');`
      },
      {
        name: 'Authenticated users can delete',
        policy: `CREATE POLICY IF NOT EXISTS "Authenticated users can delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = '${bucketName}');`
      }
    ];

    // Note: RLS policies need to be created via SQL, which requires additional setup
    // For now, we'll return success and let the user create policies manually if needed

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Bucket created successfully',
        bucketName,
        note: 'Please ensure RLS policies are set up via SQL Editor if needed'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
