/** 時段衝突邏輯 — 所有 Edge Function 共用 */

export const TIME_SLOTS = [
  '10:00','11:00','12:00','13:00','14:00',
  '15:00','16:00','17:00','18:00','19:00','20:00',
];

export const DEFAULT_DURATIONS: Record<string, number> = {
  nail: 90, lash: 120, tattoo: 120, wax: 60,
};

/**
 * 取得某門市某日期的佔用時段 Set。
 * excludeBookingId: 計算改期衝突時，排除自身這筆預約。
 */
export async function getOccupiedSlots(
  supabase: any,
  store: string,
  date: string,
  excludeBookingId?: string,
): Promise<Set<string>> {
  const { data: rules } = await supabase
    .from('slot_rules')
    .select('service, duration_minutes');
  const durations: Record<string, number> = { ...DEFAULT_DURATIONS };
  for (const r of rules ?? []) durations[r.service] = r.duration_minutes;

  let query = supabase
    .from('line_bookings')
    .select('booking_time, service')
    .eq('store', store)
    .eq('booking_date', date)
    .not('status', 'eq', 'cancelled');
  if (excludeBookingId) query = query.neq('id', excludeBookingId);

  const { data: bookings } = await query;
  const occupied = new Set<string>();
  for (const b of bookings ?? []) {
    const mins  = durations[b.service] ?? 60;
    const slots = Math.ceil(mins / 60);
    const idx   = TIME_SLOTS.indexOf(b.booking_time);
    if (idx === -1) continue;
    for (let i = 0; i < slots; i++) {
      if (TIME_SLOTS[idx + i]) occupied.add(TIME_SLOTS[idx + i]);
    }
  }
  return occupied;
}

/**
 * 回傳指定服務在該門市日期所有「可預約」的時段列表。
 */
export async function getAvailableSlots(
  supabase: any,
  store: string,
  date: string,
  service: string,
): Promise<string[]> {
  const { data: rules } = await supabase
    .from('slot_rules')
    .select('service, duration_minutes');
  const durations: Record<string, number> = { ...DEFAULT_DURATIONS };
  for (const r of rules ?? []) durations[r.service] = r.duration_minutes;

  const occupied = await getOccupiedSlots(supabase, store, date);
  const needed   = Math.ceil((durations[service] ?? 60) / 60);

  return TIME_SLOTS.filter((_, idx) => {
    for (let i = 0; i < needed; i++) {
      if (!TIME_SLOTS[idx + i] || occupied.has(TIME_SLOTS[idx + i])) return false;
    }
    return true;
  });
}

/**
 * 回傳指定服務在該門市日期是否有足夠的連續空閒時段。
 */
export async function checkSlotAvailable(
  supabase: any,
  store: string,
  date: string,
  time: string,
  service: string,
  excludeBookingId?: string,
): Promise<boolean> {
  const { data: rules } = await supabase
    .from('slot_rules')
    .select('service, duration_minutes');
  const durations: Record<string, number> = { ...DEFAULT_DURATIONS };
  for (const r of rules ?? []) durations[r.service] = r.duration_minutes;

  const occupied = await getOccupiedSlots(supabase, store, date, excludeBookingId);
  const needed   = Math.ceil((durations[service] ?? 60) / 60);
  const idx      = TIME_SLOTS.indexOf(time);
  if (idx === -1) return false;
  for (let i = 0; i < needed; i++) {
    if (!TIME_SLOTS[idx + i] || occupied.has(TIME_SLOTS[idx + i])) return false;
  }
  return true;
}
