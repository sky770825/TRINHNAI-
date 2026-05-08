/**
 * ╔══════════════════════════════════════════════════════╗
 * ║       Edge Function — Salon Configuration            ║
 * ║  請與 src/salonConfig.ts 保持同步                     ║
 * ╚══════════════════════════════════════════════════════╝
 */

export const SALON_NAME  = '小貞美甲美睫';
export const SALON_PHONE = '0909-318-666';

// ── 服務名稱 ──────────────────────────────────────────────────
export const SERVICE_NAMES: Record<string, string> = {
  nail:   '💅 美甲',
  lash:   '👁️ 美睫',
  tattoo: '💄 霧唇霧眉',
  wax:    '🪵 熱蠟除毛',
};

// ── 門市名稱 & 資訊 ───────────────────────────────────────────
export const STORE_NAMES: Record<string, string> = {
  yuanhua: '中壢元化店（前站）',
  zhongfu: '中壢忠福店（黃昏市場對面）',
};

export const STORE_INFO: Record<string, { label: string; address: string; mapsUri: string }> = {
  yuanhua: {
    label:   '中壢元化店（前站）',
    address: '中壢區元化路（前站）',
    mapsUri: 'https://www.google.com/maps/search/?api=1&query=Trinh+Nail+%E4%B8%AD%E5%A3%A2%E5%85%83%E5%8C%96%E5%BA%97+%E4%B8%AD%E5%A3%A2%E5%8D%80%E5%85%83%E5%8C%96%E8%B7%AF',
  },
  zhongfu: {
    label:   '中壢忠福店（黃昏市場對面）',
    address: '中壢區忠福路（黃昏市場對面）',
    mapsUri: 'https://www.google.com/maps/search/?api=1&query=Trinh+Nail+%E4%B8%AD%E5%A3%A2%E5%BF%A0%E7%A6%8F%E5%BA%97+%E4%B8%AD%E5%A3%A2%E5%8D%80%E5%BF%A0%E7%A6%8F%E8%B7%AF',
  },
};

// ── 可預約時段 ────────────────────────────────────────────────
export const TIME_SLOTS: string[] = [
  '10:00','11:00','12:00','13:00','14:00',
  '15:00','16:00','17:00','18:00','19:00','20:00',
];

// ── 品牌色 ────────────────────────────────────────────────────
export const BRAND_COLOR = '#C9748B';
