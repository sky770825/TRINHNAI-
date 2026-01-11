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

// Get bot settings from database
async function getBotSettings(supabase: ReturnType<typeof createClient>): Promise<Record<string, string>> {
  const { data, error } = await supabase
    .from('bot_settings')
    .select('key, value');
  
  if (error) {
    console.error("Error fetching bot settings:", error);
    // Return defaults if error
    return {
      event_name: "美甲課程報名",
      price: "NT$ 3,000",
      bank_name: "國泰世華銀行",
      bank_code: "013",
      account_number: "123-456-789-012",
      account_name: "Trinh Nai 美甲工作室",
      welcome_message: "歡迎加入！🎉\n\n輸入「報名」即可開始報名流程。",
      success_message: "✅ 已收到您的匯款資訊！\n\n我們會盡快確認，確認後會發送通知給您。\n\n感謝您的報名！🎉",
    };
  }
  
  const settings: Record<string, string> = {};
  for (const row of data || []) {
    settings[row.key] = row.value;
  }
  return settings;
}

// Get bot keywords from database
interface BotKeyword {
  id: string;
  keyword: string;
  response_type: string;
  response_content: string;
  is_active: boolean;
  priority: number;
}

async function getKeywords(supabase: ReturnType<typeof createClient>): Promise<BotKeyword[]> {
  const { data, error } = await supabase
    .from('bot_keywords')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false });
  
  if (error) {
    console.error("Error fetching keywords:", error);
    return [];
  }
  
  return data || [];
}

// Match keyword from message (exact match only)
function matchKeyword(messageText: string, keywords: BotKeyword[]): BotKeyword | null {
  const text = messageText.trim().toLowerCase();
  
  // Only exact match to avoid unwanted triggers during conversation
  for (const kw of keywords) {
    if (kw.keyword.toLowerCase() === text) {
      return kw;
    }
  }
  
  return null;
}

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

// Generate services Flex Message with images
function createServicesFlexMessage() {
  return {
    type: "flex",
    altText: "服務項目選單",
    contents: {
      type: "carousel",
      contents: [
        {
          type: "bubble",
          hero: {
            type: "image",
            url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800",
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover"
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "💅 美甲服務",
                weight: "bold",
                size: "xl",
                color: "#D4AF37"
              },
              {
                type: "text",
                text: "凝膠指甲 | 光療指甲 | 指甲彩繪",
                size: "sm",
                color: "#999999",
                margin: "md"
              },
              {
                type: "text",
                text: "NT$ 150 - 990",
                size: "xxl",
                weight: "bold",
                color: "#000000",
                margin: "lg"
              }
            ]
          },
          footer: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "primary",
                height: "sm",
                action: {
                  type: "message",
                  label: "立即預約",
                  text: "預約美甲"
                },
                color: "#D4AF37"
              }
            ]
          }
        },
        {
          type: "bubble",
          hero: {
            type: "image",
            url: "https://images.unsplash.com/photo-1583001931096-959a1f0c12e8?w=800",
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover"
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "👁️ 美睫服務",
                weight: "bold",
                size: "xl",
                color: "#D4AF37"
              },
              {
                type: "text",
                text: "睫毛嫁接 | 美睫設計 | 睫毛保養",
                size: "sm",
                color: "#999999",
                margin: "md"
              },
              {
                type: "text",
                text: "NT$ 790 - 1,290",
                size: "xxl",
                weight: "bold",
                color: "#000000",
                margin: "lg"
              }
            ]
          },
          footer: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "primary",
                height: "sm",
                action: {
                  type: "message",
                  label: "立即預約",
                  text: "預約美睫"
                },
                color: "#D4AF37"
              }
            ]
          }
        },
        {
          type: "bubble",
          hero: {
            type: "image",
            url: "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=800",
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover"
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "✨ 紋繡服務",
                weight: "bold",
                size: "xl",
                color: "#D4AF37"
              },
              {
                type: "text",
                text: "霧眉 | 飄眉 | 眼線 | 美瞳線",
                size: "sm",
                color: "#999999",
                margin: "md"
              },
              {
                type: "text",
                text: "NT$ 3,990 - 11,990",
                size: "xxl",
                weight: "bold",
                color: "#000000",
                margin: "lg"
              }
            ]
          },
          footer: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "primary",
                height: "sm",
                action: {
                  type: "message",
                  label: "立即預約",
                  text: "預約紋繡"
                },
                color: "#D4AF37"
              }
            ]
          }
        },
        {
          type: "bubble",
          hero: {
            type: "image",
            url: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800",
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover"
          },
          body: {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🪶 熱蠟除毛",
                weight: "bold",
                size: "xl",
                color: "#D4AF37"
              },
              {
                type: "text",
                text: "全身除毛 | 私密除毛 | 專業服務",
                size: "sm",
                color: "#999999",
                margin: "md"
              },
              {
                type: "text",
                text: "NT$ 590 - 2,559",
                size: "xxl",
                weight: "bold",
                color: "#000000",
                margin: "lg"
              }
            ]
          },
          footer: {
            type: "box",
            layout: "vertical",
            spacing: "sm",
            contents: [
              {
                type: "button",
                style: "primary",
                height: "sm",
                action: {
                  type: "message",
                  label: "立即預約",
                  text: "預約除毛"
                },
                color: "#D4AF37"
              }
            ]
          }
        }
      ]
    }
  };
}

// Create store selection Flex Message
function createStoreSelectionMessage() {
  return {
    type: "flex",
    altText: "選擇分店",
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🏪 請選擇分店",
            weight: "bold",
            size: "xl",
            color: "#D4AF37"
          },
          {
            type: "separator",
            margin: "lg"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "md",
            contents: [
              {
                type: "button",
                style: "primary",
                action: {
                  type: "message",
                  label: "📍 中壢元化店（前站）",
                  text: "元化店"
                },
                color: "#D4AF37"
              },
              {
                type: "button",
                style: "primary",
                action: {
                  type: "message",
                  label: "📍 中壢忠福店（黃昏市場對面）",
                  text: "忠福店"
                },
                color: "#D4AF37"
              }
            ]
          }
        ]
      }
    }
  };
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
    
    // Get bot settings and keywords from database
    const settings = await getBotSettings(supabase);
    const keywords = await getKeywords(supabase);

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
          text: settings.welcome_message || `歡迎加入 ${settings.account_name}！🎉\n\n輸入「報名」即可開始報名流程。`,
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

        // Handle conversation states first (they take priority over keywords)
        // Handle "複製匯款資訊" - send plain text for easy copying
        if (messageText === '複製匯款資訊' && (conversationState === 'registration_started' || !conversationState)) {
          await supabase
            .from('line_users')
            .update({ conversation_state: 'awaiting_payment' })
            .eq('id', user.id);

          await sendLineMessage(replyToken, [
            {
              type: "text",
              text: `${settings.bank_name}\n銀行代碼：${settings.bank_code}\n帳號：${settings.account_number}\n戶名：${settings.account_name}\n金額：${settings.price}`,
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
              text: settings.success_message || `✅ 已收到您的匯款資訊！\n\n帳號後五碼：${messageText.trim()}\n\n我們會盡快確認您的匯款，確認後會發送通知給您。\n\n感謝您的報名！🎉`,
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

        // Check for keyword match
        const matchedKeyword = matchKeyword(messageText, keywords);
        
        if (matchedKeyword) {
          // Handle registration type keyword
          if (matchedKeyword.response_type === 'registration') {
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
                text: `📋 ${settings.event_name}\n\n💰 費用：${settings.price}\n\n🏦 匯款資訊：\n銀行：${settings.bank_name}\n銀行代碼：${settings.bank_code}\n帳號：${settings.account_number}\n戶名：${settings.account_name}`,
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
          
          // Handle text type keyword
          if (matchedKeyword.response_type === 'text') {
            await sendLineMessage(replyToken, [{
              type: "text",
              text: matchedKeyword.response_content,
            }], accessToken);
            continue;
          }
          
          // Handle booking type keyword
          if (matchedKeyword.response_type === 'booking') {
            await sendLineMessage(replyToken, [createServicesFlexMessage()], accessToken);
            continue;
          }
        }

        // Handle booking flow - service selection
        if (messageText.startsWith('預約')) {
          const serviceMap: Record<string, string> = {
            '預約美甲': 'nail',
            '預約美睫': 'lash',
            '預約紋繡': 'tattoo',
            '預約除毛': 'waxing'
          };
          
          const service = serviceMap[messageText];
          if (service) {
            // Save service selection and ask for store
            await supabase
              .from('line_users')
              .update({ 
                conversation_state: JSON.stringify({ step: 'booking_select_store', service })
              })
              .eq('id', user.id);
            
            await sendLineMessage(replyToken, [createStoreSelectionMessage()], accessToken);
            continue;
          }
        }

        // Handle store selection
        if (conversationState) {
          try {
            const state = JSON.parse(conversationState);
            
            if (state.step === 'booking_select_store') {
              const storeMap: Record<string, string> = {
                '元化店': 'yuanhua',
                '忠福店': 'zhongfu'
              };
              
              const store = storeMap[messageText];
              if (store) {
                state.step = 'booking_input_date';
                state.store = store;
                
                await supabase
                  .from('line_users')
                  .update({ conversation_state: JSON.stringify(state) })
                  .eq('id', user.id);
                
                await sendLineMessage(replyToken, [{
                  type: "text",
                  text: "📅 請輸入預約日期\n\n格式：YYYY-MM-DD\n例如：2026-01-15"
                }], accessToken);
                continue;
              }
            }
            
            if (state.step === 'booking_input_date') {
              // Validate date format
              if (/^\d{4}-\d{2}-\d{2}$/.test(messageText)) {
                const bookingDate = new Date(messageText);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (bookingDate >= today) {
                  state.step = 'booking_input_time';
                  state.booking_date = messageText;
                  
                  await supabase
                    .from('line_users')
                    .update({ conversation_state: JSON.stringify(state) })
                    .eq('id', user.id);
                  
                  await sendLineMessage(replyToken, [{
                    type: "text",
                    text: "⏰ 請輸入預約時間\n\n格式：HH:MM\n例如：14:00\n\n營業時間：09:00 - 22:00"
                  }], accessToken);
                  continue;
                } else {
                  await sendLineMessage(replyToken, [{
                    type: "text",
                    text: "❌ 預約日期必須是今天或之後\n\n請重新輸入日期（格式：YYYY-MM-DD）"
                  }], accessToken);
                  continue;
                }
              } else {
                await sendLineMessage(replyToken, [{
                  type: "text",
                  text: "❌ 日期格式錯誤\n\n請使用格式：YYYY-MM-DD\n例如：2026-01-15"
                }], accessToken);
                continue;
              }
            }
            
            if (state.step === 'booking_input_time') {
              // Validate time format
              if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(messageText)) {
                state.step = 'booking_input_name';
                state.booking_time = messageText;
                
                await supabase
                  .from('line_users')
                  .update({ conversation_state: JSON.stringify(state) })
                  .eq('id', user.id);
                
                await sendLineMessage(replyToken, [{
                  type: "text",
                  text: "👤 請輸入您的姓名"
                }], accessToken);
                continue;
              } else {
                await sendLineMessage(replyToken, [{
                  type: "text",
                  text: "❌ 時間格式錯誤\n\n請使用格式：HH:MM\n例如：14:00"
                }], accessToken);
                continue;
              }
            }
            
            if (state.step === 'booking_input_name') {
              state.step = 'booking_input_phone';
              state.user_name = messageText.trim();
              
              await supabase
                .from('line_users')
                .update({ conversation_state: JSON.stringify(state) })
                .eq('id', user.id);
              
              await sendLineMessage(replyToken, [{
                type: "text",
                text: "📱 請輸入您的聯絡電話"
              }], accessToken);
              continue;
            }
            
            if (state.step === 'booking_input_phone') {
              state.phone = messageText.trim();
              
              // Create booking
              const serviceNames: Record<string, string> = {
                nail: '💅 美甲服務',
                lash: '👁️ 美睫服務',
                tattoo: '✨ 紋繡服務',
                waxing: '🪶 熱蠟除毛'
              };
              
              const storeNames: Record<string, string> = {
                yuanhua: '中壢元化店（前站）',
                zhongfu: '中壢忠福店（黃昏市場對面）'
              };
              
              const { error: bookingError } = await supabase
                .from('line_bookings')
                .insert({
                  line_user_id: user.line_user_id,
                  user_name: state.user_name,
                  phone: state.phone,
                  service: state.service,
                  store: state.store,
                  booking_date: state.booking_date,
                  booking_time: state.booking_time,
                  status: 'pending'
                });
              
              if (bookingError) {
                console.error("Error creating booking:", bookingError);
                await sendLineMessage(replyToken, [{
                  type: "text",
                  text: "❌ 預約失敗，請稍後再試或聯繫我們"
                }], accessToken);
              } else {
                await sendLineMessage(replyToken, [{
                  type: "text",
                  text: `✅ 預約成功！\n\n👤 姓名：${state.user_name}\n📱 電話：${state.phone}\n💆 服務：${serviceNames[state.service]}\n🏪 分店：${storeNames[state.store]}\n📅 日期：${state.booking_date}\n⏰ 時間：${state.booking_time}\n\n我們會盡快與您確認預約，感謝您的預約！🎉`
                }], accessToken);
              }
              
              // Clear conversation state
              await supabase
                .from('line_users')
                .update({ conversation_state: null })
                .eq('id', user.id);
              
              continue;
            }
          } catch (e) {
            console.error("Error parsing conversation state:", e);
          }
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
