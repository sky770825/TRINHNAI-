import { supabase } from "@/integrations/supabase/client";
import type { BookingSource, LineBooking, UnifiedBooking, Booking } from "./types";

function normalizeWebsiteBooking(booking: Booking): UnifiedBooking {
  return {
    ...booking,
    source: "website",
  };
}

function normalizeLineBooking(booking: LineBooking): UnifiedBooking {
  return {
    id: booking.id,
    name: booking.user_name || "LINE 用戶",
    email: null,
    phone: booking.phone,
    line_id: booking.line_user_id,
    store: booking.store,
    service: booking.service,
    booking_date: booking.booking_date,
    booking_time: booking.booking_time,
    notes: booking.notes,
    status: booking.status,
    created_at: booking.created_at,
    source: "line",
    line_user_id: booking.line_user_id,
  };
}

export async function fetchBookings(): Promise<{ data: UnifiedBooking[] | null; error: Error | null }> {
  const [websiteRes, lineRes] = await Promise.all([
    supabase.from("bookings").select("*").order("created_at", { ascending: false }),
    supabase.from("line_bookings").select("*").order("created_at", { ascending: false }),
  ]);

  if (websiteRes.error && lineRes.error) {
    return { data: null, error: websiteRes.error as Error };
  }

  const data = [
    ...((websiteRes.data ?? []) as Booking[]).map(normalizeWebsiteBooking),
    ...((lineRes.data ?? []) as LineBooking[]).map(normalizeLineBooking),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return { data, error: (websiteRes.error || lineRes.error) ? (websiteRes.error || lineRes.error) as Error : null };
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: string,
  bookingSource: BookingSource = "website",
): Promise<{ error: Error | null }> {
  const table = bookingSource === "line" ? "line_bookings" : "bookings";
  const patch =
    bookingSource === "line" && newStatus === "confirmed"
      ? { status: newStatus, confirmed_at: new Date().toISOString(), confirmed_by: "admin" }
      : { status: newStatus };
  const { error } = await supabase.from(table).update(patch).eq("id", bookingId);
  return { error: error ? (error as Error) : null };
}

export async function deleteBooking(
  bookingId: string,
  bookingSource: BookingSource = "website",
): Promise<{ error: Error | null }> {
  const table = bookingSource === "line" ? "line_bookings" : "bookings";
  const { error } = await supabase.from(table).delete().eq("id", bookingId);
  return { error: error ? (error as Error) : null };
}
