import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RemarketingMessage {
  id: string;
  hours_after_interest: number;
  message_content: string;
  is_active: boolean;
}

interface LineUser {
  id: string;
  line_user_id: string;
  display_name: string | null;
  interested_at: string;
  payment_status: string;
  follow_status: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Remarketing cron job started at:", new Date().toISOString());

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active remarketing messages
    const { data: messages, error: messagesError } = await supabase
      .from('remarketing_messages')
      .select('*')
      .eq('is_active', true)
      .order('hours_after_interest', { ascending: true });

    if (messagesError) {
      console.error("Error fetching remarketing messages:", messagesError);
      return new Response(
        JSON.stringify({ error: "取得再行銷訊息失敗" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!messages || messages.length === 0) {
      console.log("No active remarketing messages configured");
      return new Response(
        JSON.stringify({ success: true, message: "No active messages", sentCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${messages.length} active remarketing messages`);

    // Get all users who:
    // 1. Have shown interest (interested_at is not null)
    // 2. Haven't paid yet (payment_status is 'unpaid' or 'pending')
    // 3. Are still following
    const { data: eligibleUsers, error: usersError } = await supabase
      .from('line_users')
      .select('id, line_user_id, display_name, interested_at, payment_status, follow_status')
      .not('interested_at', 'is', null)
      .in('payment_status', ['unpaid', 'pending'])
      .eq('follow_status', 'following');

    if (usersError) {
      console.error("Error fetching eligible users:", usersError);
      return new Response(
        JSON.stringify({ error: "取得用戶資料失敗" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!eligibleUsers || eligibleUsers.length === 0) {
      console.log("No eligible users for remarketing");
      return new Response(
        JSON.stringify({ success: true, message: "No eligible users", sentCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${eligibleUsers.length} eligible users for remarketing`);

    // Get already sent messages to avoid duplicates
    const { data: sentLogs, error: sentLogsError } = await supabase
      .from('remarketing_sent_log')
      .select('line_user_id, message_id');

    if (sentLogsError) {
      console.error("Error fetching sent logs:", sentLogsError);
    }

    // Create a set for quick lookup
    const sentSet = new Set(
      (sentLogs || []).map(log => `${log.line_user_id}-${log.message_id}`)
    );

    const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    if (!accessToken) {
      console.error("LINE_CHANNEL_ACCESS_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "LINE 設定錯誤" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    let totalSent = 0;
    const results: { userId: string; messageId: string; success: boolean; error?: string }[] = [];

    // Process each user
    for (const user of eligibleUsers as LineUser[]) {
      const interestedAt = new Date(user.interested_at);
      const hoursSinceInterest = (now.getTime() - interestedAt.getTime()) / (1000 * 60 * 60);

      // Find matching messages based on hours elapsed
      for (const message of messages as RemarketingMessage[]) {
        // Check if this message should be sent (hours elapsed >= message hours)
        // And not already sent
        const logKey = `${user.id}-${message.id}`;
        
        if (hoursSinceInterest >= message.hours_after_interest && !sentSet.has(logKey)) {
          console.log(`Sending message ${message.id} to user ${user.display_name || user.line_user_id} (${hoursSinceInterest.toFixed(1)}h since interest)`);
          
          try {
            // Send LINE message
            const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify({
                to: user.line_user_id,
                messages: [{
                  type: 'text',
                  text: message.message_content,
                }],
              }),
            });

            if (lineResponse.ok) {
              // Log the sent message
              const { error: logError } = await supabase
                .from('remarketing_sent_log')
                .insert({
                  line_user_id: user.id,
                  message_id: message.id,
                });

              if (logError) {
                console.error(`Error logging sent message:`, logError);
              } else {
                sentSet.add(logKey); // Add to set to prevent duplicate in same run
                totalSent++;
                results.push({ userId: user.id, messageId: message.id, success: true });
              }
            } else {
              const errorText = await lineResponse.text();
              console.error(`Failed to send to ${user.line_user_id}:`, errorText);
              results.push({ userId: user.id, messageId: message.id, success: false, error: errorText });
            }
          } catch (err) {
            console.error(`Error sending to ${user.line_user_id}:`, err);
            results.push({ userId: user.id, messageId: message.id, success: false, error: String(err) });
          }
        }
      }
    }

    console.log(`Remarketing cron completed. Total sent: ${totalSent}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sentCount: totalSent,
        eligibleUsers: eligibleUsers.length,
        activeMessages: messages.length,
        results: results.length > 0 ? results : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in remarketing cron:", error);
    return new Response(
      JSON.stringify({ error: "伺服器錯誤" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
