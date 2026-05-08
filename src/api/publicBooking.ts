import { supabase } from "@/integrations/supabase/client";

export const PUBLIC_TIME_SLOTS = [
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

export interface PublicBookingInput {
  name: string;
  email: string;
  phone: string;
  lineId?: string;
  store: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
}

interface PublicBookingResponse {
  success?: boolean;
  error?: string;
  code?: string;
  bookingId?: string;
  availableSlots?: string[];
}

export function getTaipeiDateInputValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export async function fetchAvailableBookingSlots(params: {
  store: string;
  service: string;
  date: string;
}): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke<PublicBookingResponse>(
    "trinh-public-booking",
    {
      body: {
        action: "availableSlots",
        store: params.store,
        service: params.service,
        date: params.date,
      },
    },
  );

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || "無法讀取可預約時段");
  return data.availableSlots ?? [];
}

export async function createPublicBooking(input: PublicBookingInput): Promise<string | undefined> {
  const { data, error } = await supabase.functions.invoke<PublicBookingResponse>(
    "trinh-public-booking",
    {
      body: {
        action: "createBooking",
        ...input,
      },
    },
  );

  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || "預約建立失敗");
  return data.bookingId;
}

export async function sendBookingConfirmationEmail(input: PublicBookingInput) {
  const { error } = await supabase.functions.invoke("send-booking-confirmation", {
    body: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      lineId: input.lineId || null,
      store: input.store,
      service: input.service,
      date: input.date,
      time: input.time,
      notes: input.notes || null,
      admin_email: "sky19880825@gmail.com",
    },
  });

  if (error) throw error;
}
