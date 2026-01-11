-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage line users" ON public.line_users;

-- Create restrictive RLS policies - only service role can access (for edge functions/webhooks)
CREATE POLICY "Line users are viewable by service role only"
ON public.line_users
FOR SELECT
USING (false);

CREATE POLICY "Line users can be inserted by service role only"
ON public.line_users
FOR INSERT
WITH CHECK (false);

CREATE POLICY "Line users can be updated by service role only"
ON public.line_users
FOR UPDATE
USING (false);

CREATE POLICY "Line users can be deleted by service role only"
ON public.line_users
FOR DELETE
USING (false);