-- Create bookings table for storing booking records
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  line_id TEXT,
  store TEXT NOT NULL,
  service TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous booking submissions
CREATE POLICY "Allow anonymous booking submissions"
ON public.bookings
FOR INSERT
WITH CHECK (true);

-- Create policy for service role only viewing
CREATE POLICY "Bookings are viewable by service role only"
ON public.bookings
FOR SELECT
USING (false);