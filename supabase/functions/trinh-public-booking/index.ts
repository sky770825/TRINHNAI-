/**
 * trinh-public-booking — 官網公開預約入口
 *
 * 這支 Function 使用 service role 檢查跨來源時段：
 * - 官網 bookings
 * - LINE OA line_bookings
 * - booking_blocks 封鎖時段
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkSlotAvailable, getAvailableSlots } from '../_shared/slots.ts';
import { SERVICE_NAMES, STORE_NAMES } from '../_shared/salonConfig.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_STORES = new Set(['yuanhua', 'zhongfu']);
const VALID_SERVICES = new Set(['nail', 'lash', 'tattoo', 'wax', 'waxing']);
const TIME_RE = /^\d{2}:\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+886|0)?[0-9\-\s]{8,15}$/;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

type PublicBookingPayload = {
  action?: 'availableSlots' | 'createBooking' | 'lookupBookings';
  name?: string;
  email?: string;
  phone?: string;
  lineId?: string;
  store?: string;
  service?: string;
  date?: string;
  time?: string;
  notes?: string;
};

type LookupBooking = {
  id: string;
  source: 'website' | 'line';
  name: string;
  phone: string;
  store: string;
  storeLabel: string;
  service: string;
  serviceLabel: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
  createdAt: string;
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function taipeiToday(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function validateBase(payload: PublicBookingPayload): string | null {
  if (!payload.store || !VALID_STORES.has(payload.store)) return '請選擇有效門市';
  if (!payload.service || !VALID_SERVICES.has(payload.service)) return '請選擇有效服務';
  if (!payload.date || !DATE_RE.test(payload.date)) return '請選擇有效日期';
  if (payload.date < taipeiToday()) return '不可預約過去日期';
  return null;
}

function validateCreate(payload: PublicBookingPayload): string | null {
  const baseError = validateBase(payload);
  if (baseError) return baseError;
  if (!payload.time || !TIME_RE.test(payload.time)) return '請選擇有效時段';
  if (!payload.name || payload.name.trim().length < 1 || payload.name.trim().length > 100) return '請填寫姓名';
  if (!payload.email || !EMAIL_RE.test(payload.email) || payload.email.length > 255) return '請填寫有效 Email';
  if (!payload.phone || !PHONE_RE.test(payload.phone) || payload.phone.length > 20) return '請填寫有效電話';
  if (payload.lineId && payload.lineId.length > 50) return 'LINE ID 過長';
  if (payload.notes && payload.notes.length > 500) return '備註過長';
  return null;
}

function normalizePhone(phone?: string | null): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.startsWith('886') && digits.length >= 11) return `0${digits.slice(3)}`;
  if (digits.startsWith('9') && digits.length === 9) return `0${digits}`;
  return digits;
}

function validateLookup(payload: PublicBookingPayload): string | null {
  const normalizedPhone = normalizePhone(payload.phone);
  if (normalizedPhone.length < 8 || normalizedPhone.length > 15) {
    return '請輸入有效手機或電話號碼';
  }
  return null;
}

function serviceLabel(service: string): string {
  if (service === 'waxing') return SERVICE_NAMES.wax ?? '熱蠟除毛';
  return SERVICE_NAMES[service] ?? service;
}

function toLookupBooking(row: Record<string, unknown>, source: 'website' | 'line'): LookupBooking {
  return {
    id: String(row.id),
    source,
    name: String(source === 'line' ? row.user_name || 'LINE 用戶' : row.name || '會員'),
    phone: String(row.phone ?? ''),
    store: String(row.store ?? ''),
    storeLabel: STORE_NAMES[String(row.store ?? '')] ?? String(row.store ?? ''),
    service: String(row.service ?? ''),
    serviceLabel: serviceLabel(String(row.service ?? '')),
    bookingDate: String(row.booking_date ?? ''),
    bookingTime: String(row.booking_time ?? ''),
    status: String(row.status ?? 'pending'),
    createdAt: String(row.created_at ?? ''),
  };
}

async function lookupBookings(
  supabase: any,
  phone: string,
): Promise<LookupBooking[]> {
  const normalizedPhone = normalizePhone(phone);
  const phoneNeedle = normalizedPhone.slice(-4);

  const websiteQuery = supabase
    .from('bookings')
    .select('id, name, phone, store, service, booking_date, booking_time, status, created_at')
    .ilike('phone', `%${phoneNeedle}%`)
    .order('booking_date', { ascending: false })
    .limit(50);

  const lineQuery = supabase
    .from('line_bookings')
    .select('id, user_name, phone, store, service, booking_date, booking_time, status, created_at')
    .ilike('phone', `%${phoneNeedle}%`)
    .order('booking_date', { ascending: false })
    .limit(50);

  const [{ data: websiteRows, error: websiteError }, { data: lineRows, error: lineError }] = await Promise.all([
    websiteQuery,
    lineQuery,
  ]);

  if (websiteError && lineError) {
    console.error('lookup bookings error:', { websiteError, lineError });
    throw new Error('查詢失敗，請稍後再試');
  }

  const phoneMatches = (value?: string | null) => normalizePhone(value) === normalizedPhone;
  const rows = [
    ...((websiteRows ?? []).filter((row: Record<string, unknown>) => phoneMatches(row.phone as string | null)).map((row: Record<string, unknown>) => toLookupBooking(row, 'website'))),
    ...((lineRows ?? []).filter((row: Record<string, unknown>) => phoneMatches(row.phone as string | null)).map((row: Record<string, unknown>) => toLookupBooking(row, 'line'))),
  ];

  return rows
    .sort((a, b) => {
      const aKey = `${a.bookingDate}T${a.bookingTime || '00:00'}`;
      const bKey = `${b.bookingDate}T${b.bookingTime || '00:00'}`;
      return bKey.localeCompare(aKey);
    })
    .slice(0, 20);
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405);

  let payload: PublicBookingPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ success: false, error: '無效的請求格式' });
  }

  const action = payload.action ?? 'createBooking';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  if (action === 'lookupBookings') {
    const clientIP =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    if (!checkRateLimit(clientIP)) {
      return json({ success: false, error: '查詢次數過多，請稍後再試' }, 429);
    }

    const validationError = validateLookup(payload);
    if (validationError) return json({ success: false, error: validationError, bookings: [] });

    try {
      const bookings = await lookupBookings(supabase, payload.phone!);
      return json({ success: true, bookings });
    } catch (error) {
      console.error('lookup bookings exception:', error);
      return json({ success: false, error: '查詢失敗，請稍後再試', bookings: [] }, 500);
    }
  }

  if (action === 'availableSlots') {
    const baseError = validateBase(payload);
    if (baseError) return json({ success: false, error: baseError, availableSlots: [] });

    const availableSlots = await getAvailableSlots(
      supabase,
      payload.store!,
      payload.date!,
      payload.service!,
    );

    return json({ success: true, availableSlots });
  }

  if (action !== 'createBooking') {
    return json({ success: false, error: '無效的操作' });
  }

  const clientIP =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
  if (!checkRateLimit(clientIP)) {
    return json({ success: false, error: '送出次數過多，請稍後再試' }, 429);
  }

  const validationError = validateCreate(payload);
  if (validationError) return json({ success: false, error: validationError });

  const available = await checkSlotAvailable(
    supabase,
    payload.store!,
    payload.date!,
    payload.time!,
    payload.service!,
  );

  if (!available) {
    return json({
      success: false,
      code: 'slot_unavailable',
      error: '此時段剛剛已被預約，請重新選擇其他時間',
    });
  }

  const { data: inserted, error } = await supabase
    .from('bookings')
    .insert({
      name: payload.name!.trim(),
      email: payload.email!.trim(),
      phone: payload.phone!.trim(),
      line_id: payload.lineId?.trim() || null,
      store: payload.store!,
      service: payload.service!,
      booking_date: payload.date!,
      booking_time: payload.time!,
      notes: payload.notes?.trim() || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('create public booking error:', error);
    return json({ success: false, error: '預約建立失敗，請稍後再試或直接聯繫門市' }, 500);
  }

  return json({ success: true, bookingId: inserted?.id });
});
