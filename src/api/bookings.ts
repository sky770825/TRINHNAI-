import { supabase } from "@/integrations/supabase/client";
import type { Booking } from "./types";

export async function fetchBookings(): Promise<{ data: Booking[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return { data: null, error: error as Error };
  return { data: data ?? [], error: null };
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: string
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("bookings")
    .update({ status: newStatus })
    .eq("id", bookingId);
  return { error: error ? (error as Error) : null };
}

export async function deleteBooking(bookingId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
  return { error: error ? (error as Error) : null };
}
