/**
 * trinh-line-webhook — 完整對話式預約流程
 * 環境變數：
 *   LINE_CHANNEL_ACCESS_TOKEN  LINE channel access token
 *   LINE_CHANNEL_SECRET        LINE channel secret
 *   LINE_ADMIN_USER_ID         老闆的 LINE user ID
 *   SUPABASE_URL               Supabase URL（自動注入）
 *   SUPABASE_SERVICE_ROLE_KEY  Supabase service role key（自動注入）
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verifySignature, pushMessage, replyMessage, getUserProfile, textMsg } from '../_shared/line.ts';
import {
  welcomeBubble, serviceCarousel, storeSelectionFlex,
  dateSelectionFlex, timeSelectionFlex,
  confirmBookingFlex, bookingSuccessFlex, storeInfoBubble, adminBookingFlex,
} from '../_shared/flexMessages.ts';
import { checkSlotAvailable, getAvailableSlots } from '../_shared/slots.ts';

const SERVICE_NAMES: Record<string, string> = {
  nail: '💅 美甲', lash: '👁️ 美睫', tattoo: '💄 霧唇霧眉', wax: '🪵 熱蠟除毛',
};
const STORE_NAMES: Record<string, string> = {
  yuanhua: '元化店', zhongfu: '忠福店',
};
const SERVICE_KEYS = Object.keys(SERVICE_NAMES);
const STORE_KEYS   = Object.keys(STORE_NAMES);
const DATE_RE      = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE      = /^\d{2}:\d{2}$/;
const PHONE_RE     = /^0\d{8,9}$/;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  const TOKEN  = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') ?? '';
  const SECRET = Deno.env.get('LINE_CHANNEL_SECRET') ?? '';
  const ADMIN  = Deno.env.get('LINE_ADMIN_USER_ID') ?? '';

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  let rawBody = '';
  try { rawBody = await req.text(); } catch { return new Response('ok'); }

  // ── Signature 驗證 ────────────────────────────────────────
  if (SECRET) {
    const sig   = req.headers.get('x-line-signature') ?? '';
    const valid = await verifySignature(rawBody, sig, SECRET).catch(() => false);
    if (!valid) return new Response('Forbidden', { status: 403 });
  }

  let payload: any;
  try { payload = JSON.parse(rawBody); } catch { return new Response('ok'); }

  for (const event of payload?.events ?? []) {
    const userId     = event.source?.userId as string | undefined;
    const replyToken = event.replyToken   as string | undefined;

    // ── 加入好友 ─────────────────────────────────────────────
    if (event.type === 'follow' && userId) {
      // 取得 LINE 個人資料（暱稱、大頭貼）
      const profile = TOKEN ? await getUserProfile(TOKEN, userId).catch(() => null) : null;
      // 寫入 / 更新 line_users，設定 follow_status = 'following'
      await supabase.from('line_users').upsert(
        {
          line_user_id:         userId,
          follow_status:        'following',
          display_name:         profile?.displayName  ?? null,
          picture_url:          profile?.pictureUrl   ?? null,
          last_interaction_at:  new Date().toISOString(),
        },
        { onConflict: 'line_user_id' },
      ).catch(e => console.error('follow upsert error:', e));
      // 發送歡迎訊息
      if (TOKEN) await pushMessage(TOKEN, userId, [welcomeBubble()]).catch(() => {});
      continue;
    }

    // ── 封鎖 / 取消追蹤 ──────────────────────────────────────
    if (event.type === 'unfollow' && userId) {
      await supabase.from('line_users')
        .update({ follow_status: 'blocked' })
        .eq('line_user_id', userId)
        .catch(e => console.error('unfollow update error:', e));
      continue;
    }

    if (event.type !== 'message' || event.message?.type !== 'text') continue;
    if (!userId || !replyToken || !TOKEN) continue;

    const text = String(event.message.text ?? '').trim();

    // ── 讀取對話狀態 ─────────────────────────────────────────
    const { data: userRow } = await supabase
      .from('line_users')
      .select('conversation_state')
      .eq('line_user_id', userId)
      .maybeSingle();

    const raw = userRow?.conversation_state;
    const state: Record<string, string> =
      raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {};
    const step = state.step ?? '';

    // ── 任何步驟都優先處理的取消指令 ──────────────────────────
    if (['取消', '取消預約', 'cancel', '重來', '結束'].includes(text)) {
      await clearState(supabase, userId);

      // 如果使用者不在預約流程中 → 嘗試取消最近一筆 pending/confirmed 預約
      if (!step || step === '') {
        const { data: latest } = await supabase
          .from('line_bookings')
          .select('id, service, store, booking_date, booking_time, status')
          .eq('line_user_id', userId)
          .in('status', ['pending', 'confirmed'])
          .order('booking_date', { ascending: true })
          .order('booking_time', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (latest) {
          // 存入待取消狀態讓下一則訊息確認
          await setState(supabase, userId, { step: 'cancel_confirm', cancel_booking_id: latest.id });
          const svcName   = SERVICE_NAMES[latest.service]   ?? latest.service;
          const storeName = STORE_NAMES[latest.store]       ?? latest.store;
          const result = await replyMessage(TOKEN, replyToken, [{
            type: 'flex',
            altText: '確認取消預約',
            contents: {
              type: 'bubble', size: 'kilo',
              header: {
                type: 'box', layout: 'vertical', backgroundColor: '#EF4444', paddingAll: '14px',
                contents: [{ type: 'text', text: '❌ 取消預約確認', weight: 'bold', color: '#ffffff', size: 'md' }],
              },
              body: {
                type: 'box', layout: 'vertical', paddingAll: '16px', spacing: 'md',
                contents: [
                  { type: 'text', text: '確認取消以下預約？', weight: 'bold', size: 'sm', color: '#333333' },
                  { type: 'separator' },
                  { type: 'box', layout: 'horizontal', contents: [
                    { type: 'text', text: '服務', size: 'xs', color: '#999999', flex: 2 },
                    { type: 'text', text: svcName, size: 'xs', color: '#333333', flex: 5 },
                  ]},
                  { type: 'box', layout: 'horizontal', contents: [
                    { type: 'text', text: '門市', size: 'xs', color: '#999999', flex: 2 },
                    { type: 'text', text: storeName, size: 'xs', color: '#333333', flex: 5 },
                  ]},
                  { type: 'box', layout: 'horizontal', contents: [
                    { type: 'text', text: '日期', size: 'xs', color: '#999999', flex: 2 },
                    { type: 'text', text: latest.booking_date, size: 'xs', color: '#333333', flex: 5 },
                  ]},
                  { type: 'box', layout: 'horizontal', contents: [
                    { type: 'text', text: '時間', size: 'xs', color: '#999999', flex: 2 },
                    { type: 'text', text: latest.booking_time, size: 'xs', color: '#333333', flex: 5 },
                  ]},
                ],
              },
              footer: {
                type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '12px',
                contents: [
                  { type: 'button', style: 'primary', color: '#EF4444', height: 'sm',
                    action: { type: 'message', label: '確認取消', text: '確認取消' } },
                  { type: 'button', style: 'secondary', height: 'sm',
                    action: { type: 'message', label: '不取消', text: '不取消' } },
                ],
              },
            },
          }]);
          if (!result.ok && ADMIN) await notify(TOKEN, ADMIN, `⚠️ reply 失敗\n${result.error}`);
          continue;
        }
      }

      // 沒有可取消的預約 → 直接顯示歡迎選單
      const result = await replyMessage(TOKEN, replyToken, [welcomeBubble()]);
      if (!result.ok && ADMIN) await notify(TOKEN, ADMIN, `⚠️ reply 失敗\n${result.error}`);
      continue;
    }

    // ── 取消確認步驟 ────────────────────────────────────────────
    if (step === 'cancel_confirm') {
      if (text === '確認取消') {
        const bookingId = state.cancel_booking_id;
        if (bookingId) {
          await supabase.from('line_bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId)
            .eq('line_user_id', userId); // 安全：只能取消自己的預約
        }
        await clearState(supabase, userId);
        const result = await replyMessage(TOKEN, replyToken, [
          textMsg(`您的預約已成功取消。\n\n如需重新預約，歡迎再次使用線上預約服務 💕\n如有任何問題請來電 📞 0909-318-666`),
        ]);
        if (!result.ok && ADMIN) await notify(TOKEN, ADMIN, `⚠️ reply 失敗\n${result.error}`);
      } else {
        // 不取消 → 回到歡迎
        await clearState(supabase, userId);
        const result = await replyMessage(TOKEN, replyToken, [
          textMsg('好的，已保留您的預約 ✅'),
          welcomeBubble(),
        ]);
        if (!result.ok && ADMIN) await notify(TOKEN, ADMIN, `⚠️ reply 失敗\n${result.error}`);
      }
      continue;
    }

    // ── 全域快捷鍵（填寫姓名/電話期間不觸發，避免誤攔截）──────
    const inFreeText = ['enter_name', 'enter_phone'].includes(step);
    if (!inFreeText) {
      const keywordReply = getKeywordReply(text);
      if (keywordReply) {
        await replyMessage(TOKEN, replyToken, keywordReply);
        continue;
      }

      if (['店家資訊', '資訊', '地址', '門市', 'info'].some(k => text.includes(k))) {
        await replyMessage(TOKEN, replyToken, [storeInfoBubble()]);
        continue;
      }
      if (['服務價目', '價目', '價格', '費用', '多少錢', 'price'].some(k => text.includes(k))) {
        await replyMessage(TOKEN, replyToken, [{
          type: 'text',
          text: '💅 服務價目表\n\n美甲（凝膠/水晶/光療）\n美睫（嫁接/霧感/經典）\n霧唇霧眉（霧眉/霧唇/飄眉）\n熱蠟除毛（臉部/腋下/腿部）\n\n詳細報價請私訊或來電詢問 😊\n📞 0909-318-666',
        }]);
        continue;
      }
    }

    // ── 狀態機 ───────────────────────────────────────────────
    let reply: object | null = null;

    if (step === 'select_service') {
      if (SERVICE_KEYS.includes(text)) {
        await setState(supabase, userId, { ...state, step: 'select_store', service: text });
        reply = storeSelectionFlex(SERVICE_NAMES[text]);
      } else {
        reply = serviceCarousel();
      }

    } else if (step === 'select_store') {
      if (STORE_KEYS.includes(text)) {
        await setState(supabase, userId, { ...state, step: 'enter_date', store: text });
        reply = dateSelectionFlex(SERVICE_NAMES[state.service] ?? '', STORE_NAMES[text] ?? '');
      } else {
        reply = storeSelectionFlex(SERVICE_NAMES[state.service] ?? '');
      }

    } else if (step === 'enter_date') {
      const today = new Date().toISOString().split('T')[0];
      if (DATE_RE.test(text) && text > today) {
        // 查詢當天可用時段，讓時段卡正確顯示已滿格子
        const available = await getAvailableSlots(supabase, state.store, text, state.service)
          .catch(() => undefined); // 查詢失敗時退化為顯示全部（不擋客人）
        await setState(supabase, userId, { ...state, step: 'enter_time', date: text });
        reply = timeSelectionFlex(text, SERVICE_NAMES[state.service] ?? '', STORE_NAMES[state.store] ?? '', available);
      } else {
        reply = dateSelectionFlex(SERVICE_NAMES[state.service] ?? '', STORE_NAMES[state.store] ?? '');
      }

    } else if (step === 'enter_time') {
      if (text === '重新選擇日期') {
        // 全天額滿時點按鈕退回選日期
        await setState(supabase, userId, { ...state, step: 'enter_date', date: '', time: '' });
        reply = dateSelectionFlex(SERVICE_NAMES[state.service] ?? '', STORE_NAMES[state.store] ?? '');
      } else if (TIME_RE.test(text)) {
        await setState(supabase, userId, { ...state, step: 'enter_name', time: text });
        reply = {
          type: 'text',
          text: `✅ 已選：${SERVICE_NAMES[state.service] ?? state.service}｜${STORE_NAMES[state.store] ?? state.store}｜${state.date} ${text}\n\n✨ 最後一步～\n請輸入您的 姓名：`,
        };
      } else {
        reply = timeSelectionFlex(state.date ?? '', SERVICE_NAMES[state.service] ?? '', STORE_NAMES[state.store] ?? '');
      }

    } else if (step === 'enter_name') {
      if (text.length >= 2) {
        await setState(supabase, userId, { ...state, step: 'enter_phone', name: text });
        reply = {
          type: 'text',
          text: `👤 姓名：${text}\n\n📞 請輸入您的 手機號碼：\n（格式：09xxxxxxxx）`,
        };
      } else {
        reply = { type: 'text', text: '姓名至少需要 2 個字，請重新輸入：' };
      }

    } else if (step === 'enter_phone') {
      const cleaned = text.replace(/[-\s]/g, '');
      if (PHONE_RE.test(cleaned)) {
        await setState(supabase, userId, { ...state, step: 'confirm', phone: cleaned });
        reply = confirmBookingFlex({
          service: state.service, store:  state.store,
          date:    state.date,    time:   state.time,
          name:    state.name,    phone:  cleaned,
        });
      } else {
        reply = { type: 'text', text: '⚠️ 手機格式不正確，請重新輸入（格式：09xxxxxxxx）：' };
      }

    } else if (step === 'confirm') {
      if (text === '確認預約') {
        // ── 再次確認時段是否仍可用 ──────────────────────────────
        const available = await checkSlotAvailable(
          supabase, state.store, state.date, state.time, state.service,
        );
        if (!available) {
          await setState(supabase, userId, { ...state, step: 'enter_time', time: '' });
          const r = await replyMessage(TOKEN, replyToken, [
            { type: 'text', text: `⚠️ ${state.date} ${state.time} 剛剛已被預約，請重新選擇時段 😢` },
            timeSelectionFlex(state.date, SERVICE_NAMES[state.service] ?? '', STORE_NAMES[state.store] ?? ''),
          ]);
          if (!r.ok && ADMIN) await notify(TOKEN, ADMIN, `⚠️ reply 失敗\n${r.error}`);
          continue;
        }

        // ── 寫入預約 ────────────────────────────────────────────
        await supabase.from('line_users').upsert(
          { line_user_id: userId, last_interaction_at: new Date().toISOString() },
          { onConflict: 'line_user_id' },
        );
        const { data: inserted, error: insertError } = await supabase
          .from('line_bookings')
          .insert({
            line_user_id: userId,
            service:      state.service,
            store:        state.store,
            booking_date: state.date,
            booking_time: state.time,
            user_name:    state.name,
            phone:        state.phone,
            status:       'pending',
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('insert error:', insertError);
          reply = { type: 'text', text: '❌ 預約寫入失敗，請稍後再試或來電 0909-318-666' };
        } else {
          const ref = `BK-${(inserted?.id ?? '').slice(0, 6).toUpperCase()}`;
          await clearState(supabase, userId);
          reply = bookingSuccessFlex(state.name, state.date, state.time, ref, state.store, state.service);
          // 推播通知老闆（預約者與老闆為同一人時不重複推播）
          if (ADMIN && TOKEN && ADMIN !== userId) {
            await pushMessage(TOKEN, ADMIN, [
              adminBookingFlex({
                service: state.service, store: state.store,
                date: state.date,       time:  state.time,
                name: state.name,       phone: state.phone,
                source: 'line',         ref,
              }),
            ]).catch(() => {});
          }
        }

      } else {
        // 重新顯示確認卡
        reply = confirmBookingFlex({
          service: state.service, store:  state.store,
          date:    state.date,    time:   state.time,
          name:    state.name,    phone:  state.phone,
        });
      }

    } else {
      // ── 無對話狀態 → 全域關鍵字 ─────────────────────────────
      if (['預約', '訂', 'booking', 'book', '約'].some(k => text.includes(k))) {
        await setState(supabase, userId, { step: 'select_service' });
        reply = serviceCarousel();
      } else if (['店家資訊', '資訊', '地址', '電話', 'info', '門市'].some(k => text.includes(k))) {
        reply = storeInfoBubble();
      } else if (['服務價目', '價目', '價格', '費用', '多少錢', 'price'].some(k => text.includes(k))) {
        reply = {
          type: 'text',
          text: '💅 服務價目表\n\n美甲（凝膠/水晶/光療）\n美睫（嫁接/霧感/經典）\n霧唇霧眉（霧眉/霧唇/飄眉）\n熱蠟除毛（臉部/腋下/腿部）\n\n詳細報價請私訊或來電詢問 😊\n📞 0909-318-666',
        };
      } else {
        reply = welcomeBubble();
      }
    }

    if (reply) {
      const result = await replyMessage(TOKEN, replyToken, [reply]);
      if (!result.ok && ADMIN) await notify(TOKEN, ADMIN, `⚠️ reply 失敗\n${result.error}`);
    }
  }

  return new Response('ok');
});

// ── 工具函式 ─────────────────────────────────────────────────
async function setState(sb: any, userId: string, state: Record<string, string>) {
  await sb.from('line_users').upsert(
    {
      line_user_id:        userId,
      conversation_state:  state,
      last_interaction_at: new Date().toISOString(),
      follow_status:       'following',   // 能互動 = 一定是追蹤中
    },
    { onConflict: 'line_user_id' },
  );
}

async function clearState(sb: any, userId: string) {
  await sb.from('line_users').upsert(
    {
      line_user_id:        userId,
      conversation_state:  null,
      last_interaction_at: new Date().toISOString(),
      follow_status:       'following',
    },
    { onConflict: 'line_user_id' },
  );
}

function getKeywordReply(text: string): object[] | null {
  if (['美甲款式', '指甲款式', '凝膠款式'].some(k => text.includes(k))) {
    return [textMsg(
      '美甲款式可依日常、約會、婚禮與節慶做客製設計。\n\n常見項目：\n・手部素色光療\n・手部設計款\n・凝膠延甲\n・足部光療與深層保養\n\n想直接排時間，請點「立即預約」或輸入「預約」。'
    )];
  }

  if (['美睫款式', '睫毛款式', '美睫'].some(k => text.includes(k))) {
    return [textMsg(
      '美睫款式會依眼型、原生睫毛條件與妝感需求調整。\n\n常見項目：\n・自然經典款\n・3D 層次款\n・泰式設計款\n・微濃感款式\n\n想安排諮詢與施作，請點「立即預約」或輸入「預約」。'
    )];
  }

  if (['最新優惠', '優惠', '活動'].some(k => text.includes(k))) {
    return [textMsg(
      '目前優惠：\n・當月壽星享 85 折\n・留下五星好評享 95 折\n・足部光療 + 深層保養享 9 折\n\n優惠以現場與預約確認為準，歡迎先點「立即預約」保留時段。'
    )];
  }

  if (['會員專區', '會員', 'member'].some(k => text.toLowerCase().includes(k.toLowerCase()))) {
    return [textMsg(
      '會員專區提供預約提醒、優惠通知與保養回訪。\n\n如果想查詢既有預約，請輸入「取消預約」查看最近一筆可處理預約；若要新增預約，請輸入「預約」。'
    )];
  }

  return null;
}

async function notify(token: string, adminId: string, text: string) {
  await pushMessage(token, adminId, [{ type: 'text', text }]).catch(() => {});
}
