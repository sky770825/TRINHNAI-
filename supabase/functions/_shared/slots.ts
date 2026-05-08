/** 時段衝突邏輯 — 所有 Edge Function 共用 */

export const TIME_SLOTS = [
  '10:00','11:00','12:00','13:00','14:00',
  '15:00','16:00','17:00','18:00','19:00','20:00',
];

export const DEFAULT_DURATIONS: Record<string, number> = {
  nail: 90, lash: 120, tattoo: 120, wax: 60, waxing: 60,
};

const DURATION_CACHE_TTL_MS = 5 * 60 * 1000;
let durationCache: { expiresAt: number; value: Record<string, number> } | null = null;

export function normalizeServiceKey(service?: string | null): string {
  if (!service) return '';
  return service === 'waxing' ? 'wax' : service;
}

async function loadDurations(supabase: any): Promise<Record<string, number>> {
  const now = Date.now();
  if (durationCache && durationCache.expiresAt > now) {
    return durationCache.value;
  }

  const { data: rules, error } = await supabase
    .from('slot_rules')
    .select('service, duration_minutes');
  const durations: Record<string, number> = { ...DEFAULT_DURATIONS };
  if (!error) {
    for (const r of rules ?? []) {
      const key = normalizeServiceKey(r.service);
      durations[key] = r.duration_minutes;
      if (key === 'wax') durations.waxing = r.duration_minutes;
    }
  }
  durationCache = { expiresAt: now + DURATION_CACHE_TTL_MS, value: durations };
  return durations;
}

function occupySlots(
  occupied: Set<string>,
  durations: Record<string, number>,
  bookingTime?: string | null,
  service?: string | null,
) {
  if (!bookingTime) return;
  const mins  = durations[normalizeServiceKey(service)] ?? 60;
  const slots = Math.ceil(mins / 60);
  const idx   = TIME_SLOTS.indexOf(bookingTime);
  if (idx === -1) return;
  for (let i = 0; i < slots; i++) {
    if (TIME_SLOTS[idx + i]) occupied.add(TIME_SLOTS[idx + i]);
  }
}

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
  const durations = await loadDurations(supabase);

  let lineQuery = supabase
    .from('line_bookings')
    .select('booking_time, service')
    .eq('store', store)
    .eq('booking_date', date)
    .not('status', 'eq', 'cancelled');
  if (excludeBookingId) lineQuery = lineQuery.neq('id', excludeBookingId);

  let websiteQuery = supabase
    .from('bookings')
    .select('booking_time, service')
    .eq('store', store)
    .eq('booking_date', date)
    .not('status', 'eq', 'cancelled');
  if (excludeBookingId) websiteQuery = websiteQuery.neq('id', excludeBookingId);

  const [{ data: lineBookings }, { data: websiteBookings }, { data: blocks }] = await Promise.all([
    lineQuery,
    websiteQuery,
    supabase
      .from('booking_blocks')
      .select('block_time')
      .eq('store_id', store)
      .eq('block_date', date),
  ]);

  const occupied = new Set<string>();
  for (const b of lineBookings ?? []) {
    occupySlots(occupied, durations, b.booking_time, b.service);
  }
  for (const b of websiteBookings ?? []) {
    occupySlots(occupied, durations, b.booking_time, b.service);
  }
  for (const block of blocks ?? []) {
    if (TIME_SLOTS.includes(block.block_time)) {
      occupied.add(block.block_time);
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
  const durations = await loadDurations(supabase);
  const occupied  = await getOccupiedSlots(supabase, store, date);
  const needed    = Math.ceil((durations[normalizeServiceKey(service)] ?? 60) / 60);

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
  const durations = await loadDurations(supabase);
  const occupied  = await getOccupiedSlots(supabase, store, date, excludeBookingId);
  const needed    = Math.ceil((durations[normalizeServiceKey(service)] ?? 60) / 60);
  const idx      = TIME_SLOTS.indexOf(time);
  if (idx === -1) return false;
  for (let i = 0; i < needed; i++) {
    if (!TIME_SLOTS[idx + i] || occupied.has(TIME_SLOTS[idx + i])) return false;
  }
  return true;
}
