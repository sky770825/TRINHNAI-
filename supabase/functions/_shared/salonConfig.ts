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
  yuanhua: '元化店',
  zhongfu: '忠福店',
};

export const STORE_INFO: Record<string, { label: string; address: string; mapsUri: string }> = {
  yuanhua: {
    label:   '元化店',
    address: '桃園市中壢區元化路 40 號',
    mapsUri: 'https://www.google.com/maps/search/?api=1&query=%E6%A1%83%E5%9C%92%E5%B8%82%E4%B8%AD%E5%A3%A2%E5%8D%80%E5%85%83%E5%8C%96%E8%B7%AF40%E8%99%9F',
  },
  zhongfu: {
    label:   '忠福店',
    address: '桃園市中壢區福州一街 262 號',
    mapsUri: 'https://www.google.com/maps/search/?api=1&query=%E6%A1%83%E5%9C%92%E5%B8%82%E4%B8%AD%E5%A3%A2%E5%8D%80%E7%A6%8F%E5%B7%9E%E4%B8%80%E8%A1%97262%E8%99%9F',
  },
};

// ── 可預約時段 ────────────────────────────────────────────────
export const TIME_SLOTS: string[] = [
  '10:00','11:00','12:00','13:00','14:00',
  '15:00','16:00','17:00','18:00','19:00','20:00',
];

// ── 品牌色 ────────────────────────────────────────────────────
export const BRAND_COLOR = '#C9748B';
