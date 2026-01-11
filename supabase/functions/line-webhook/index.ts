import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";
import { encode as encodeBase64 } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-line-signature',
};

// LINE Messaging API endpoints
const LINE_API_BASE = "https://api.line.me/v2/bot";

// Registration info configuration
const REGISTRATION_INFO = {
  eventName: "美甲課程報名",
  price: "NT$ 3,000",
  bankName: "國泰世華銀行",
  bankCode: "013",
  accountNumber: "123-456-789-012",
  accountName: "Trinh Nai 美甲工作室",
};

// Verify LINE signature
async function verifySignature(body: string, signature: string, channelSecret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(channelSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expectedSignature = encodeBase64(signatureBuffer);
  return signature === expectedSignature;
}

// Send LINE message
async function sendLineMessage(replyToken: string, messages: unknown[], accessToken: string) {
  const response = await fetch(`${LINE_API_BASE}/message/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      replyToken,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("LINE API error:", errorText);
    throw new Error(`LINE API error: ${response.status}`);
  }

  return response.json();
}

// Push LINE message (for sending without reply token)
async function pushLineMessage(userId: string, messages: unknown[], accessToken: string) {
  const response = await fetch(`${LINE_API_BASE}/message/push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to: userId,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("LINE Push API error:", errorText);
    throw new Error(`LINE Push API error: ${response.status}`);
  }

  return response.json();
}

// Get LINE user profile
async function getLineProfile(userId: string, accessToken: string) {
  const response = await fetch(`${LINE_API_BASE}/profile/${userId}`, {
    headers: {
      "Authorization": `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.error("Failed to get LINE profile");
    return null;
  }

  return response.json();
}

// Validate last 5 digits format
function isValidLast5Digits(input: string): boolean {
  return /^\d{5}$/.test(input.trim());
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
  const channelSecret = Deno.env.get('LINE_CHANNEL_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!accessToken || !channelSecret) {
    console.error("Missing LINE credentials");
    return new Response(
      JSON.stringify({ error: "Missing LINE credentials" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-line-signature');

    // Verify signature
    if (signature) {
      const isValid = await verifySignature(bodyText, signature, channelSecret);
      if (!isValid) {
        console.error("Invalid signature");
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const body = JSON.parse(bodyText);
    console.log("Received webhook:", JSON.stringify(body));

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Process each event
    for (const event of body.events || []) {
      const userId = event.source?.userId;
      const replyToken = event.replyToken;

      if (!userId) continue;

      // Get or create user record
      let { data: user } = await supabase
        .from('line_users')
        .select('*')
        .eq('line_user_id', userId)
        .single();

      if (!user) {
        // Get profile and create user
        const profile = await getLineProfile(userId, accessToken);
        
        const { data: newUser, error: insertError } = await supabase
          .from('line_users')
          .insert({
            line_user_id: userId,
            display_name: profile?.displayName || null,
            picture_url: profile?.pictureUrl || null,
            status_message: profile?.statusMessage || null,
            follow_status: 'following',
            payment_status: 'unpaid',
          })
          .select()
          .single();

        if (insertError) {
          console.error("Error creating user:", insertError);
          continue;
        }
        user = newUser;
      }

      // Update last interaction
      await supabase
        .from('line_users')
        .update({ last_interaction_at: new Date().toISOString() })
        .eq('id', user.id);

      // Handle follow event
      if (event.type === 'follow') {
        await supabase
          .from('line_users')
          .update({ follow_status: 'following' })
          .eq('id', user.id);

        await sendLineMessage(replyToken, [{
          type: "text",
          text: `歡迎加入 ${REGISTRATION_INFO.accountName}！🎉\n\n輸入「報名」即可開始報名流程。`,
        }], accessToken);
        continue;
      }

      // Handle unfollow event
      if (event.type === 'unfollow') {
        await supabase
          .from('line_users')
          .update({ follow_status: 'unfollowed' })
          .eq('id', user.id);
        continue;
      }

      // Handle message event
      if (event.type === 'message' && event.message?.type === 'text') {
        const messageText = event.message.text.trim();
        const conversationState = user.conversation_state;

        // Check for "報名" keyword
        if (messageText === '報名') {
          // Show registration info with copy button
          // Mark user as interested (for remarketing) if not already interested
          const updateData: Record<string, unknown> = { conversation_state: 'registration_started' };
          if (!user.interested_at) {
            updateData.interested_at = new Date().toISOString();
          }
          await supabase
            .from('line_users')
            .update(updateData)
            .eq('id', user.id);

          await sendLineMessage(replyToken, [
            {
              type: "text",
              text: `📋 ${REGISTRATION_INFO.eventName}\n\n💰 費用：${REGISTRATION_INFO.price}\n\n🏦 匯款資訊：\n銀行：${REGISTRATION_INFO.bankName}\n銀行代碼：${REGISTRATION_INFO.bankCode}\n帳號：${REGISTRATION_INFO.accountNumber}\n戶名：${REGISTRATION_INFO.accountName}`,
            },
            {
              type: "template",
              altText: "報名操作選單",
              template: {
                type: "buttons",
                text: "請點擊下方按鈕複製匯款資訊",
                actions: [
                  {
                    type: "message",
                    label: "📋 複製匯款資訊",
                    text: "複製匯款資訊",
                  },
                ],
              },
            },
          ], accessToken);
          continue;
        }

        // Handle "複製匯款資訊" - send plain text for easy copying
        if (messageText === '複製匯款資訊' || conversationState === 'registration_started') {
          if (messageText === '複製匯款資訊') {
            await supabase
              .from('line_users')
              .update({ conversation_state: 'awaiting_payment' })
              .eq('id', user.id);

            await sendLineMessage(replyToken, [
              {
                type: "text",
                text: `${REGISTRATION_INFO.bankName}\n銀行代碼：${REGISTRATION_INFO.bankCode}\n帳號：${REGISTRATION_INFO.accountNumber}\n戶名：${REGISTRATION_INFO.accountName}\n金額：${REGISTRATION_INFO.price}`,
              },
              {
                type: "template",
                altText: "已完成匯款確認",
                template: {
                  type: "buttons",
                  text: "完成匯款後請點擊下方按鈕",
                  actions: [
                    {
                      type: "message",
                      label: "✅ 已完成匯款",
                      text: "已完成匯款",
                    },
                  ],
                },
              },
            ], accessToken);
            continue;
          }
        }

        // Handle "已完成匯款"
        if (messageText === '已完成匯款' && (conversationState === 'awaiting_payment' || conversationState === 'registration_started')) {
          await supabase
            .from('line_users')
            .update({ conversation_state: 'awaiting_last_5_digits' })
            .eq('id', user.id);

          await sendLineMessage(replyToken, [{
            type: "text",
            text: "請輸入您匯款帳號的「後五碼」以便我們核對：\n\n（例如：12345）",
          }], accessToken);
          continue;
        }

        // Handle last 5 digits input
        if (conversationState === 'awaiting_last_5_digits') {
          if (isValidLast5Digits(messageText)) {
            // Valid format - save and update status
            await supabase
              .from('line_users')
              .update({
                payment_status: 'pending',
                payment_last_5_digits: messageText.trim(),
                conversation_state: null,
              })
              .eq('id', user.id);

            await sendLineMessage(replyToken, [{
              type: "text",
              text: `✅ 已收到您的匯款資訊！\n\n帳號後五碼：${messageText.trim()}\n\n我們會盡快確認您的匯款，確認後會發送通知給您。\n\n感謝您的報名！🎉`,
            }], accessToken);
          } else {
            // Invalid format
            await sendLineMessage(replyToken, [{
              type: "text",
              text: "❌ 格式錯誤！\n\n請輸入正確的 5 位數字（例如：12345）",
            }], accessToken);
          }
          continue;
        }

        // Default echo response (學我說話)
        await sendLineMessage(replyToken, [{
          type: "text",
          text: messageText,
        }], accessToken);
      }

      // Handle postback event
      if (event.type === 'postback') {
        console.log("Postback data:", event.postback?.data);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
