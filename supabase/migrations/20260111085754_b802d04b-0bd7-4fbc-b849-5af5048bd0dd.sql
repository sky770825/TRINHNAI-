-- Allow service role to delete bookings
CREATE POLICY "Bookings can be deleted by service role only"
ON public.bookings
FOR DELETE
USING (false);

-- Allow service role to delete leads
CREATE POLICY "Leads can be deleted by service role only"
ON public.leads
FOR DELETE
USING (false);