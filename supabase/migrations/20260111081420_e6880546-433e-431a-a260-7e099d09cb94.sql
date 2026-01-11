-- Add payment status and conversation state to line_users
ALTER TABLE public.line_users 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS payment_last_5_digits text,
ADD COLUMN IF NOT EXISTS conversation_state text DEFAULT null;

-- Add index for payment status
CREATE INDEX IF NOT EXISTS idx_line_users_payment_status ON public.line_users(payment_status);

-- Add comment for payment_status values
COMMENT ON COLUMN public.line_users.payment_status IS 'unpaid: 未購買, pending: 已匯款待確認, confirmed: 確認已付費';