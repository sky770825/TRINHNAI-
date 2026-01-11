-- Create leads table for lead capture form
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  service_interest TEXT NOT NULL,
  booking_timeframe TEXT,
  consent_promotions BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for lead capture (public form)
CREATE POLICY "Allow anonymous lead submissions"
ON public.leads
FOR INSERT
WITH CHECK (true);

-- Only allow authenticated admin users to view leads (for now, no admin yet)
-- This keeps leads private until admin functionality is added
CREATE POLICY "Leads are viewable by service role only"
ON public.leads
FOR SELECT
USING (false);