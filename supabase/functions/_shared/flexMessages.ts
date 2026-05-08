/** LINE Flex Message 模板 — Salon Template
 *
 * 環境變數（在 Supabase Edge Function Secrets 設定）：
 *   LIFF_URL     — LIFF 預約頁面 URL
 *   BOOKING_URL  — 網站預約表單 URL
 *   BRAND_COLOR  — 品牌色（6 位 hex，預設 #C9748B）
 */
import { BRAND_COLOR, SALON_NAME } from './salonConfig.ts';

const BRAND = Deno.env.get('BRAND_COLOR') ?? BRAND_COLOR;
const WHITE = '#ffffff';
const LIFF_URL    = Deno.env.get('LIFF_URL')    ?? 'https://liff.line.me/';
const BOOKING_URL = (Deno.env.get('BOOKING_URL') ?? 'https://trinhnai-342f2e80.vercel.app').replace(/\/$/, '');
const NAIL_STYLE_IMAGE = `${BOOKING_URL}/line/nail-style.jpg`;
const LASH_STYLE_IMAGE = `${BOOKING_URL}/line/lash-style.jpg`;

// ── 歡迎選單 ──────────────────────────────────────────────────
export function welcomeBubble() {
  return {
    type: 'flex',
    altText: `歡迎光臨 ${SALON_NAME} 💅 請選擇服務`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: BRAND, paddingAll: '20px',
        contents: [
          { type: 'text', text: `${SALON_NAME}`, weight: 'bold', size: 'xl', color: WHITE },
          { type: 'text', text: '美甲 • 美睫 • 霧唇霧眉 • 熱蠟除毛', size: 'sm', color: '#ffffffcc', margin: 'sm' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '20px',
        contents: [
          { type: 'text', text: '您好！歡迎光臨 Trinh Nail 💅', weight: 'bold', size: 'md', color: '#333333' },
          { type: 'text', text: '請問需要什麼服務呢？', size: 'sm', color: '#888888', margin: 'sm' },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px',
        contents: [
          { type: 'button', style: 'primary', color: BRAND, height: 'sm',
            action: { type: 'uri', label: '📅 線上預約', uri: `${BOOKING_URL}/?booking=liff` } },
          { type: 'button', style: 'secondary', height: 'sm',
            action: { type: 'message', label: '📍 店家資訊', text: '店家資訊' } },
        ],
      },
    },
  };
}

// ── 服務選擇（銀行風格單張卡片）─────────────────────────────────
const SERVICES = [
  { emoji: '💅', label: '美甲',   desc: '凝膠 / 水晶 / 光療', key: 'nail',   bg: '#FDE8F0', dot: '#E8799B' },
  { emoji: '👁️', label: '美睫',   desc: '嫁接 / 霧感 / 經典', key: 'lash',   bg: '#E8EEFF', dot: '#6B8CFF' },
  { emoji: '💄', label: '霧唇霧眉', desc: '霧眉 / 霧唇 / 飄眉', key: 'tattoo', bg: '#FDEAEA', dot: '#E87A7A' },
  { emoji: '🪵', label: '熱蠟除毛', desc: '臉部 / 腋下 / 腿部', key: 'wax',    bg: '#FEF2E4', dot: '#E89B50' },
];

export function serviceCarousel() {
  const rows: object[] = [];
  SERVICES.forEach((s, i) => {
    if (i > 0) {
      rows.push({ type: 'separator', color: '#f5eaee' });
    }
    rows.push({
      type: 'box', layout: 'horizontal',
      paddingTop: '14px', paddingBottom: '14px',
      paddingStart: '20px', paddingEnd: '16px',
      spacing: 'lg', alignItems: 'center',
      action: { type: 'message', label: s.label, text: s.key },
      contents: [
        // 圓角 icon 框
        {
          type: 'box', layout: 'vertical',
          width: '46px', height: '46px', cornerRadius: '14px',
          backgroundColor: s.bg, justifyContent: 'center', alignItems: 'center', flex: 0,
          contents: [{ type: 'text', text: s.emoji, size: 'lg', align: 'center', gravity: 'center' }],
        },
        // 文字區
        {
          type: 'box', layout: 'vertical', flex: 1,
          contents: [
            { type: 'text', text: s.label, weight: 'bold', size: 'sm', color: '#1a1a1a' },
            { type: 'text', text: s.desc, size: 'xs', color: '#aaaaaa', margin: 'xs' },
          ],
        },
        // 右箭頭
        { type: 'text', text: '›', size: 'xl', color: '#d4b8c4', flex: 0, gravity: 'center' },
      ],
    });
  });

  return {
    type: 'flex', altText: '請選擇服務項目 💅',
    contents: {
      type: 'bubble', size: 'mega',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: BRAND,
        paddingTop: '20px', paddingBottom: '18px', paddingStart: '20px', paddingEnd: '20px',
        contents: [
          { type: 'text', text: `${SALON_NAME}`, size: 'xs', color: '#f5c9d8' },
          { type: 'text', text: '選擇服務項目', weight: 'bold', size: 'xl', color: WHITE, margin: 'sm' },
          { type: 'text', text: '點選以下項目開始預約 ✨', size: 'xs', color: '#ffffff88', margin: 'xs' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '0px',
        backgroundColor: WHITE,
        contents: rows,
      },
      footer: {
        type: 'box', layout: 'vertical',
        paddingTop: '12px', paddingBottom: '16px', paddingStart: '20px', paddingEnd: '20px',
        backgroundColor: '#fdf6f8',
        contents: [{
          type: 'button', style: 'link', height: 'sm',
          action: { type: 'uri', label: '或 開啟線上預約表單 →', uri: `${BOOKING_URL}/?booking=liff` },
        }],
      },
    },
  };
}

type StyleCard = {
  title: string;
  subtitle: string;
  points: string[];
  imageUrl: string;
  accent: string;
};

function styleCardBubble(card: StyleCard, reserveText: string) {
  return {
    type: 'bubble',
    size: 'kilo',
    hero: {
      type: 'image',
      url: card.imageUrl,
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      paddingAll: '16px',
      contents: [
        { type: 'text', text: card.title, weight: 'bold', size: 'md', color: '#2f2428', wrap: true },
        { type: 'text', text: card.subtitle, size: 'xs', color: card.accent, wrap: true },
        { type: 'separator', margin: 'md', color: '#f3dde5' },
        ...card.points.map((point) => ({
          type: 'text',
          text: `・${point}`,
          size: 'xs',
          color: '#7a6870',
          wrap: true,
          margin: 'sm',
        })),
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      paddingAll: '14px',
      contents: [
        {
          type: 'button',
          style: 'primary',
          color: BRAND,
          height: 'sm',
          action: { type: 'message', label: '立即預約', text: reserveText },
        },
      ],
    },
  };
}

export function nailStyleGalleryFlex() {
  const cards: StyleCard[] = [
    {
      title: '奶茶裸粉光療',
      subtitle: '乾淨氣質｜上班日常',
      points: ['自然修飾手型', '低調耐看，不挑穿搭', '適合第一次做光療的客人'],
      imageUrl: NAIL_STYLE_IMAGE,
      accent: '#C9748B',
    },
    {
      title: '法式微鑽設計',
      subtitle: '約會聚會｜精緻亮點',
      points: ['法式線條拉長指尖', '微鑽點綴不浮誇', '適合想要有細節但不太高調'],
      imageUrl: NAIL_STYLE_IMAGE,
      accent: '#B86C84',
    },
    {
      title: '手繪主題款',
      subtitle: '客製設計｜節慶造型',
      points: ['可依照片或色系溝通', '適合婚禮、旅行、生日', '建議提前預約預留設計時間'],
      imageUrl: NAIL_STYLE_IMAGE,
      accent: '#A85F78',
    },
  ];

  return {
    type: 'flex',
    altText: 'Trinh Nail 美甲作品款式',
    contents: {
      type: 'carousel',
      contents: cards.map((card) => styleCardBubble(card, '立即預約')),
    },
  };
}

export function lashStyleGalleryFlex() {
  const cards: StyleCard[] = [
    {
      title: '自然經典款',
      subtitle: '日常裸妝｜清透眼神',
      points: ['放大眼神但保留自然感', '適合上班、學生與淡妝客', '維持度依原生睫毛狀況調整'],
      imageUrl: LASH_STYLE_IMAGE,
      accent: '#6B7AA8',
    },
    {
      title: '微濃感層次款',
      subtitle: '拍照聚會｜柔霧妝感',
      points: ['比自然款更有存在感', '適合想省眼妝時間的客人', '可依眼型調整長度與捲度'],
      imageUrl: LASH_STYLE_IMAGE,
      accent: '#5E6E9C',
    },
    {
      title: '泰式設計款',
      subtitle: '束感分明｜精緻混血感',
      points: ['線條感更明顯', '適合喜歡立體妝感', '施作前會評估原生睫毛承重'],
      imageUrl: LASH_STYLE_IMAGE,
      accent: '#52618F',
    },
  ];

  return {
    type: 'flex',
    altText: 'Trinh Nail 美睫作品款式',
    contents: {
      type: 'carousel',
      contents: cards.map((card) => styleCardBubble(card, '立即預約')),
    },
  };
}

// ── 門市選擇 ──────────────────────────────────────────────────
export function storeSelectionFlex(serviceName: string) {
  return {
    type: 'flex', altText: `${serviceName}，請選擇門市`,
    contents: {
      type: 'bubble', size: 'mega',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: BRAND, paddingAll: '20px',
        contents: [
          { type: 'text', text: `已選：${serviceName}`, size: 'sm', color: '#ffffffcc' },
          { type: 'text', text: '請選擇門市', weight: 'bold', size: 'xl', color: WHITE },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
        contents: [
          {
            type: 'box', layout: 'vertical', spacing: 'sm',
            contents: [
              { type: 'button', style: 'primary', color: BRAND, height: 'md',
                action: { type: 'message', label: '🏠 元化店｜中壢區元化路 40 號', text: 'yuanhua' } },
              { type: 'button', style: 'secondary', height: 'md',
                action: { type: 'message', label: '🏠 忠福店｜中壢區福州一街 262 號', text: 'zhongfu' } },
            ],
          },
        ],
      },
    },
  };
}

// ── 日期選擇（快速選單）────────────────────────────────────────
export function dateSelectionMsg(storeName: string) {
  const DAYS = ['日', '一', '二', '三', '四', '五', '六'];
  const today = new Date();
  const items = Array.from({ length: 13 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const wd = DAYS[d.getDay()];
    const label = `${m}/${day}(${wd})`;
    const value = `${d.getFullYear()}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { type: 'action', action: { type: 'message', label, text: value } };
  });
  return {
    type: 'text',
    text: `📍 門市：${storeName}\n\n📅 請選擇預約日期：`,
    quickReply: { items },
  };
}

// ── 時段選擇（快速選單）────────────────────────────────────────
const TIME_SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

export function timeSelectionMsg(dateStr: string) {
  return {
    type: 'text',
    text: `📅 日期：${dateStr}\n\n⏰ 請選擇時段：`,
    quickReply: {
      items: TIME_SLOTS.map(t => ({
        type: 'action',
        action: { type: 'message', label: t, text: t },
      })),
    },
  };
}

// ── 日期選擇（5週輪播，左右滑動）────────────────────────────────
export function dateSelectionFlex(serviceName: string, storeName: string) {
  const DAYS = ['日', '一', '二', '三', '四', '五', '六'];
  const today = new Date();

  // 生成未來 35 天（5週）
  const allDates = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    return {
      label:   `${m}/${day}`,
      weekday: `(${DAYS[d.getDay()]})`,
      value:   `${d.getFullYear()}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      isWeekend,
    };
  });

  // 每 7 天一組（一週一張卡片）
  const bubbles: object[] = [];
  for (let w = 0; w < 5; w++) {
    const week = allDates.slice(w * 7, w * 7 + 7);
    if (!week.length) continue;

    const rows: object[] = [];
    for (let i = 0; i < week.length; i += 4) {
      const group = week.slice(i, i + 4);
      const cells: object[] = group.map(d => ({
        type: 'box', layout: 'vertical', flex: 1,
        backgroundColor: d.isWeekend ? '#F0E8FD' : '#FDE8F0',
        cornerRadius: '10px',
        paddingTop: '10px', paddingBottom: '10px',
        action: { type: 'message', label: d.label + d.weekday, text: d.value },
        contents: [
          { type: 'text', text: d.label,   weight: 'bold', size: 'xs', align: 'center', color: '#333333' },
          { type: 'text', text: d.weekday, size: 'xs', align: 'center',
            color: d.isWeekend ? '#8B6BB1' : '#C9748B' },
        ],
      }));
      while (cells.length < 4) cells.push({ type: 'box', layout: 'vertical', flex: 1, contents: [] });
      rows.push({
        type: 'box', layout: 'horizontal', spacing: 'xs',
        ...(i > 0 ? { margin: 'sm' } : {}),
        contents: cells,
      });
    }

    const range = `${week[0].label} – ${week[week.length - 1].label}`;
    bubbles.push({
      type: 'bubble', size: 'mega',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: BRAND,
        paddingTop: '14px', paddingBottom: '10px', paddingStart: '16px', paddingEnd: '16px',
        contents: [
          { type: 'text', text: `📅 第${w + 1}週　${range}`, weight: 'bold', size: 'sm', color: WHITE },
          { type: 'text', text: `${serviceName}・${storeName}　← 滑動 →`, size: 'xs', color: '#f5c9d8', margin: 'xs' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical',
        paddingTop: '12px', paddingBottom: '12px', paddingStart: '10px', paddingEnd: '10px',
        contents: rows,
      },
    });
  }

  return {
    type: 'flex',
    altText: '📅 請選擇預約日期（共5週，左右滑動）',
    contents: { type: 'carousel', contents: bubbles },
  };
}

// ── 時段選擇（卡片格狀，顯示可用／已滿狀態）────────────────────
const ALL_TIME_SLOTS = ['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];

export function timeSelectionFlex(
  dateStr: string, serviceName: string, storeName: string,
  availableSlots?: string[],   // 未傳入表示全部可選
) {
  const rows: object[] = [];
  for (let i = 0; i < ALL_TIME_SLOTS.length; i += 4) {
    const group = ALL_TIME_SLOTS.slice(i, i + 4);
    const cells: object[] = group.map(t => {
      const avail = !availableSlots || availableSlots.includes(t);
      const cell: Record<string, unknown> = {
        type: 'box', layout: 'vertical', flex: 1,
        backgroundColor: avail ? '#EEF2FF' : '#f3f4f6',
        cornerRadius: '10px',
        paddingTop: '10px', paddingBottom: '10px',
        contents: [
          {
            type: 'text', text: t, weight: 'bold', size: 'xs', align: 'center',
            color: avail ? '#333333' : '#cccccc',
            ...(avail ? {} : { decoration: 'line-through' }),
          },
          ...(!avail ? [{ type: 'text', text: '已滿', size: 'xs', align: 'center', color: '#cccccc' }] : []),
        ],
      };
      if (avail) cell.action = { type: 'message', label: t, text: t };
      return cell;
    });
    while (cells.length < 4) cells.push({ type: 'box', layout: 'vertical', flex: 1, contents: [] });
    rows.push({
      type: 'box', layout: 'horizontal', spacing: 'xs',
      ...(i > 0 ? { margin: 'sm' } : {}),
      contents: cells,
    });
  }

  const allFull = availableSlots?.length === 0;

  return {
    type: 'flex', altText: '⏰ 請選擇時段',
    contents: {
      type: 'bubble', size: 'mega',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: BRAND, paddingAll: '16px',
        contents: [
          { type: 'text', text: '⏰ 選擇時段', weight: 'bold', size: 'lg', color: WHITE },
          { type: 'text', text: `${dateStr}｜${serviceName}｜${storeName}`, size: 'xs', color: '#f5c9d8', margin: 'xs', wrap: true },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '12px', spacing: 'none',
        contents: allFull
          ? [{ type: 'text', text: '😢 此日期所有時段已額滿，請返回選擇其他日期', size: 'sm', color: '#888888', wrap: true, align: 'center' }]
          : rows,
      },
      ...(allFull ? {
        footer: {
          type: 'box', layout: 'vertical', paddingAll: '12px',
          contents: [{
            type: 'button', style: 'secondary', height: 'sm',
            action: { type: 'message', label: '← 重新選擇日期', text: '重新選擇日期' },
          }],
        },
      } : {}),
    },
  };
}

// ── 填寫資料跳轉（最後一步 LIFF 卡片）────────────────────────────
export function bookingFormLiffFlex(service: string, store: string, date: string, time: string) {
  const svcNames: Record<string, string> = {
    nail: '💅 美甲', lash: '👁️ 美睫', tattoo: '💄 霧唇霧眉', wax: '🪵 熱蠟除毛',
  };
  const storeNames: Record<string, string> = {
    yuanhua: '元化店', zhongfu: '忠福店',
  };
  const qs = new URLSearchParams({ service, store, date, time }).toString();
  const liffUri = `${LIFF_URL}?${qs}`;
  const row = (label: string, value: string) => ({
    type: 'box', layout: 'horizontal', spacing: 'sm',
    contents: [
      { type: 'text', text: label, size: 'xs', color: '#999999', flex: 2 },
      { type: 'text', text: value, size: 'xs', weight: 'bold', color: '#333333', flex: 5 },
    ],
  });
  return {
    type: 'flex', altText: '最後一步：填寫姓名與電話',
    contents: {
      type: 'bubble', size: 'mega',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: BRAND, paddingAll: '16px',
        contents: [
          { type: 'text', text: '最後一步 ✨', weight: 'bold', size: 'lg', color: WHITE },
          { type: 'text', text: '填寫姓名與電話，完成預約', size: 'xs', color: '#ffffffcc', margin: 'xs' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '16px', spacing: 'sm',
        contents: [
          row('💆 服務', svcNames[service] ?? service),
          row('🏠 門市', storeNames[store] ?? store),
          row('📅 日期', date),
          row('⏰ 時段', time),
          { type: 'separator', margin: 'md' },
          { type: 'text', text: '點下方按鈕，填入姓名與電話即可完成 😊', size: 'xs', color: '#888888', margin: 'md', wrap: true },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', paddingAll: '12px',
        contents: [{
          type: 'button', style: 'primary', color: BRAND, height: 'sm',
          action: { type: 'uri', label: '📝 填寫資料，完成預約 →', uri: liffUri },
        }],
      },
    },
  };
}

// ── 姓名 & 電話輸入提示 ────────────────────────────────────────
export function askName(timeStr: string) {
  return { type: 'text', text: `⏰ 時段：${timeStr}\n\n請輸入您的 姓名：` };
}

export function askPhone(name: string) {
  return { type: 'text', text: `👤 姓名：${name}\n\n請輸入您的 手機號碼：` };
}

// ── 預約確認卡片 ──────────────────────────────────────────────
const SERVICE_NAMES: Record<string, string> = {
  nail: '💅 美甲', lash: '👁️ 美睫', tattoo: '💄 霧唇霧眉', wax: '🪵 熱蠟除毛',
};
const STORE_NAMES: Record<string, string> = {
  yuanhua: '元化店', zhongfu: '忠福店',
};

export function confirmBookingFlex(data: {
  service: string; store: string; date: string; time: string; name: string; phone: string;
}) {
  const rows = [
    ['服務', SERVICE_NAMES[data.service] ?? data.service],
    ['門市', STORE_NAMES[data.store] ?? data.store],
    ['日期', data.date],
    ['時段', data.time],
    ['姓名', data.name],
    ['電話', data.phone],
  ];
  return {
    type: 'flex', altText: '請確認您的預約資訊',
    contents: {
      type: 'bubble', size: 'mega',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: BRAND, paddingAll: '20px',
        contents: [{ type: 'text', text: '📋 預約確認', weight: 'bold', size: 'xl', color: WHITE }],
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '20px',
        contents: [
          { type: 'text', text: '請確認以下預約資訊是否正確：', size: 'sm', color: '#888888', margin: 'none' },
          { type: 'separator', margin: 'md' },
          ...rows.map(([label, value]) => ({
            type: 'box', layout: 'horizontal', margin: 'md',
            contents: [
              { type: 'text', text: label, size: 'sm', color: '#888888', flex: 2 },
              { type: 'text', text: value, size: 'sm', weight: 'bold', color: '#333333', flex: 5, wrap: true },
            ],
          })),
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px',
        contents: [
          { type: 'button', style: 'primary', color: BRAND, height: 'sm',
            action: { type: 'message', label: '✅ 確認預約', text: '確認預約' } },
          { type: 'button', style: 'secondary', height: 'sm',
            action: { type: 'message', label: '❌ 取消', text: '取消預約' } },
        ],
      },
    },
  };
}

// ── 預約成功 ──────────────────────────────────────────────────
const STORE_INFO: Record<string, { label: string; address: string; mapsUri: string }> = {
  yuanhua: {
    label:    '元化店',
    address:  '桃園市中壢區元化路 40 號',
    mapsUri:  'https://www.google.com/maps/search/?api=1&query=%E6%A1%83%E5%9C%92%E5%B8%82%E4%B8%AD%E5%A3%A2%E5%8D%80%E5%85%83%E5%8C%96%E8%B7%AF40%E8%99%9F',
  },
  zhongfu: {
    label:    '忠福店',
    address:  '桃園市中壢區福州一街 262 號',
    mapsUri:  'https://www.google.com/maps/search/?api=1&query=%E6%A1%83%E5%9C%92%E5%B8%82%E4%B8%AD%E5%A3%A2%E5%8D%80%E7%A6%8F%E5%B7%9E%E4%B8%80%E8%A1%97262%E8%99%9F',
  },
};

export function bookingSuccessFlex(
  name: string, date: string, time: string,
  ref?: string, store?: string, service?: string,
) {
  const storeInfo = store ? STORE_INFO[store] : undefined;
  const SERVICE_DISPLAY: Record<string, string> = {
    nail: '💅 美甲', lash: '👁️ 美睫', tattoo: '💄 霧唇霧眉', wax: '🪵 熱蠟除毛',
  };
  const infoRow = (label: string, value: string) => ({
    type: 'box', layout: 'horizontal', spacing: 'sm',
    contents: [
      { type: 'text', text: label, size: 'sm', color: '#999999', flex: 3 },
      { type: 'text', text: value, size: 'sm', weight: 'bold', color: '#333333', flex: 7, wrap: true },
    ],
  });
  return {
    type: 'flex', altText: '預約成功！💕',
    contents: {
      type: 'bubble', size: 'mega',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: '#4CAF82', paddingAll: '20px',
        contents: [
          { type: 'text', text: '✅ 預約成功！', weight: 'bold', size: 'xl', color: WHITE },
          { type: 'text', text: `${name} 您好 💕`, size: 'sm', color: '#d4f5e6', margin: 'xs' },
        ],
      },
      body: {
        type: 'box', layout: 'vertical', paddingAll: '20px', spacing: 'sm',
        contents: [
          { type: 'separator', margin: 'none' },
          ...(service ? [infoRow('服務', SERVICE_DISPLAY[service] ?? service)] : []),
          infoRow('門市', storeInfo?.label ?? store ?? ''),
          infoRow('日期', date),
          infoRow('時段', time),
          infoRow('姓名', name),
          ...(ref ? [infoRow('預約編號', ref)] : []),
          { type: 'separator', margin: 'md' },
          { type: 'text', text: '我們將盡快與您確認時段 😊\n如需更改請來電 0909-318-666', size: 'xs', color: '#888888', wrap: true, margin: 'md' },
          ...(storeInfo ? [{
            type: 'box', layout: 'horizontal', margin: 'md', spacing: 'sm',
            action: { type: 'uri', uri: storeInfo.mapsUri },
            contents: [
              { type: 'text', text: '📍', size: 'xs', flex: 0 },
              { type: 'text', text: storeInfo.address, size: 'xs', color: '#4CAF82', decoration: 'underline', wrap: true, flex: 1, margin: 'sm' },
            ],
          }] : []),
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px',
        contents: [
          ...(storeInfo ? [{
            type: 'button', style: 'secondary', height: 'sm',
            action: { type: 'uri', label: '🗺 導航到店家', uri: storeInfo.mapsUri },
          }] : []),
          {
            type: 'button', style: 'primary', color: '#4CAF82', height: 'sm',
            action: { type: 'uri', label: '📞 聯絡店家 0909-318-666', uri: 'tel:0909318666' },
          },
        ],
      },
    },
  };
}

// ── 新預約通知（給老闆）─────────────────────────────────────────
export function adminBookingFlex(data: {
  service: string; store: string; date: string; time: string; name: string; phone: string; source?: string; ref?: string;
}) {
  const SERVICE_NAMES: Record<string, string> = {
    nail: '💅 美甲', lash: '👁️ 美睫', tattoo: '💄 霧唇霧眉', wax: '🪵 熱蠟除毛',
  };
  const STORE_NAMES: Record<string, string> = {
    yuanhua: '元化店', zhongfu: '忠福店',
  };
  const infoRows = [
    ['服務', SERVICE_NAMES[data.service] ?? data.service],
    ['門市', STORE_NAMES[data.store]    ?? data.store],
    ['日期', data.date],
    ['時段', data.time],
    ['姓名', data.name],
  ];
  const label = (data.source === 'liff' ? '🔔 新預約（網頁表單）' : '🔔 新預約（LINE 對話）') +
    (data.ref ? `  ${data.ref}` : '');
  return {
    type: 'flex', altText: `🔔 新預約：${data.name} ${data.date} ${data.time}`,
    contents: {
      type: 'bubble', size: 'mega',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: '#E67E22', paddingAll: '20px',
        contents: [{ type: 'text', text: label, weight: 'bold', size: 'lg', color: WHITE }],
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '20px',
        contents: [
          { type: 'separator', margin: 'none' },
          ...infoRows.map(([l, v]) => ({
            type: 'box', layout: 'horizontal', margin: 'md',
            contents: [
              { type: 'text', text: l, size: 'sm', color: '#888888', flex: 2 },
              { type: 'text', text: v, size: 'sm', weight: 'bold', color: '#333333', flex: 5, wrap: true },
            ],
          })),
          // 電話號碼：可直接點擊撥號
          {
            type: 'box', layout: 'horizontal', margin: 'md',
            action: { type: 'uri', uri: `tel:${data.phone}` },
            contents: [
              { type: 'text', text: '電話', size: 'sm', color: '#888888', flex: 2 },
              { type: 'text', text: `📞 ${data.phone}`, size: 'sm', weight: 'bold', color: '#E67E22', flex: 5, decoration: 'underline' },
            ],
          },
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px',
        contents: [
          { type: 'button', style: 'primary', color: '#E67E22', height: 'sm',
            action: { type: 'uri', label: '🗺 導航到店家', uri: STORE_INFO[data.store]?.mapsUri ?? 'https://www.google.com/maps/search/?api=1&query=Trinh+Nail' } },
          { type: 'button', style: 'secondary', height: 'sm',
            action: { type: 'uri', label: '📞 聯絡店家 0909-318-666', uri: 'tel:0909318666' } },
        ],
      },
    },
  };
}

// ── 店家資訊 ──────────────────────────────────────────────────
export function storeInfoBubble() {
  return {
    type: 'flex', altText: '📍 Trinh Nail 店家資訊',
    contents: {
      type: 'bubble', size: 'mega',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: BRAND, paddingAll: '20px',
        contents: [{ type: 'text', text: '📍 店家資訊', weight: 'bold', size: 'xl', color: WHITE }],
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
        contents: [
          { type: 'box', layout: 'baseline', spacing: 'sm', contents: [
            { type: 'text', text: '🕐', size: 'sm', flex: 0 },
            { type: 'box', layout: 'vertical', flex: 1, margin: 'sm', contents: [
              { type: 'text', text: '10:00 – 20:00（線上預約時段）', size: 'sm', color: '#333333' },
              { type: 'text', text: '20:00 後及其他時段請來電預約', size: 'xs', color: BRAND, wrap: true },
            ]},
          ]},
          { type: 'box', layout: 'baseline', spacing: 'sm', contents: [
            { type: 'text', text: '📞', size: 'sm', flex: 0 },
            { type: 'text', text: '0909-318-666', size: 'sm', color: '#333333', margin: 'sm' },
          ]},
          { type: 'box', layout: 'baseline', spacing: 'sm', contents: [
            { type: 'text', text: '💬', size: 'sm', flex: 0 },
            { type: 'text', text: 'LINE ID：trinh270391', size: 'sm', color: '#333333', margin: 'sm' },
          ]},
          { type: 'separator', margin: 'md' },
          { type: 'box', layout: 'horizontal', margin: 'md', contents: [
            { type: 'text', text: '元化店', size: 'sm', weight: 'bold', flex: 2, color: '#333333' },
            { type: 'text', text: '中壢區元化路 40 號', size: 'sm', color: '#666666', flex: 5, wrap: true },
          ]},
          { type: 'box', layout: 'horizontal', contents: [
            { type: 'text', text: '忠福店', size: 'sm', weight: 'bold', flex: 2, color: '#333333' },
            { type: 'text', text: '中壢區福州一街 262 號', size: 'sm', color: '#666666', flex: 5, wrap: true },
          ]},
        ],
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '16px',
        contents: [
          { type: 'button', style: 'primary', color: BRAND, height: 'sm',
            action: { type: 'uri', label: '🗺 元化店地圖', uri: 'https://www.google.com/maps/search/?api=1&query=%E6%A1%83%E5%9C%92%E5%B8%82%E4%B8%AD%E5%A3%A2%E5%8D%80%E5%85%83%E5%8C%96%E8%B7%AF40%E8%99%9F' } },
          { type: 'button', style: 'secondary', height: 'sm',
            action: { type: 'uri', label: '🗺 忠福店地圖', uri: 'https://www.google.com/maps/search/?api=1&query=%E6%A1%83%E5%9C%92%E5%B8%82%E4%B8%AD%E5%A3%A2%E5%8D%80%E7%A6%8F%E5%B7%9E%E4%B8%80%E8%A1%97262%E8%99%9F' } },
        ],
      },
    },
  };
}
