/** LINE Messaging API 共用工具 */

export async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const buf = await crypto.subtle.sign('HMAC', key, enc.encode(body));
  return btoa(String.fromCharCode(...new Uint8Array(buf))) === signature;
}

export async function replyMessage(token: string, replyToken: string, messages: object[]): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ replyToken, messages }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`replyMessage failed ${res.status}:`, body);
    return { ok: false, error: `${res.status} ${body}` };
  }
  return { ok: true };
}

export async function pushMessage(token: string, to: string, messages: object[]): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to, messages }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`pushMessage failed ${res.status}:`, body);
    return { ok: false, error: `${res.status} ${body}` };
  }
  return { ok: true };
}

export async function getUserProfile(token: string, userId: string) {
  const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export function textMsg(text: string) {
  return { type: 'text', text };
}

/**
 * 批次廣播訊息給多位使用者（LINE multicast，每批最多 500 人）
 */
export async function multicastMessage(
  token: string,
  userIds: string[],
  messages: object[],
): Promise<{ ok: boolean; sent: number; error?: string }> {
  const BATCH = 500;
  let sent = 0;
  for (let i = 0; i < userIds.length; i += BATCH) {
    const batch = userIds.slice(i, i + BATCH);
    const res = await fetch('https://api.line.me/v2/bot/message/multicast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to: batch, messages }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`multicast failed ${res.status}:`, body);
      return { ok: false, sent, error: `${res.status} ${body}` };
    }
    sent += batch.length;
  }
  return { ok: true, sent };
}

export function quickReply(text: string, items: { label: string; text: string }[]) {
  return {
    type: 'text',
    text,
    quickReply: {
      items: items.map((i) => ({
        type: 'action',
        action: { type: 'message', label: i.label, text: i.text },
      })),
    },
  };
}
