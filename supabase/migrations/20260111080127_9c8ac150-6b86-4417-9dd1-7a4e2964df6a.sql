-- Create LINE Bot users table for CRM
CREATE TABLE public.line_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id text UNIQUE NOT NULL,
  display_name text,
  picture_url text,
  status_message text,
  follow_status text DEFAULT 'following',
  tags text[] DEFAULT '{}',
  notes text,
  last_interaction_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.line_users ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage users (for webhook/edge functions)
CREATE POLICY "Service role can manage line users"
ON public.line_users
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_line_users_line_user_id ON public.line_users(line_user_id);
CREATE INDEX idx_line_users_follow_status ON public.line_users(follow_status);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_line_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_line_users_updated_at
BEFORE UPDATE ON public.line_users
FOR EACH ROW
EXECUTE FUNCTION public.update_line_users_updated_at();