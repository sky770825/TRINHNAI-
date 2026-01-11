-- Create table for remarketing message templates
CREATE TABLE public.remarketing_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hours_after_interest INTEGER NOT NULL,
  message_content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (hours_after_interest)
);

-- Add comment for documentation
COMMENT ON TABLE public.remarketing_messages IS '再行銷訊息設定：設定用戶表達興趣後多少小時發送對應訊息';
COMMENT ON COLUMN public.remarketing_messages.hours_after_interest IS '用戶表達興趣後經過的小時數';

-- Enable RLS
ALTER TABLE public.remarketing_messages ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Remarketing messages are managed by service role only"
ON public.remarketing_messages
FOR ALL
USING (false)
WITH CHECK (false);

-- Create table to track sent remarketing messages (prevent duplicates)
CREATE TABLE public.remarketing_sent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id UUID NOT NULL REFERENCES public.line_users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES public.remarketing_messages(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (line_user_id, message_id)
);

-- Add comment
COMMENT ON TABLE public.remarketing_sent_log IS '再行銷訊息發送紀錄：追蹤每個用戶收到哪些訊息';

-- Enable RLS
ALTER TABLE public.remarketing_sent_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Remarketing sent log is managed by service role only"
ON public.remarketing_sent_log
FOR ALL
USING (false)
WITH CHECK (false);

-- Create index for faster queries
CREATE INDEX idx_remarketing_sent_log_user ON public.remarketing_sent_log(line_user_id);
CREATE INDEX idx_remarketing_sent_log_message ON public.remarketing_sent_log(message_id);

-- Add interested_at column to line_users to track when user showed interest
ALTER TABLE public.line_users 
ADD COLUMN interested_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN public.line_users.interested_at IS '用戶表達興趣的時間（輸入報名指令）';

-- Create trigger for remarketing_messages updated_at
CREATE TRIGGER update_remarketing_messages_updated_at
BEFORE UPDATE ON public.remarketing_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_line_users_updated_at();

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;