-- Create announcements table for site announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view active announcements
CREATE POLICY "Anyone can view active announcements"
ON public.announcements
FOR SELECT
USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

-- Allow authenticated admin users to view all announcements
CREATE POLICY "Admins can view all announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Allow authenticated admin users to manage announcements
CREATE POLICY "Admins can insert announcements"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update announcements"
ON public.announcements
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete announcements"
ON public.announcements
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Create index for faster lookups
CREATE INDEX idx_announcements_is_active ON public.announcements(is_active);
CREATE INDEX idx_announcements_priority ON public.announcements(priority DESC);
CREATE INDEX idx_announcements_dates ON public.announcements(start_date, end_date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_announcements_updated_at();