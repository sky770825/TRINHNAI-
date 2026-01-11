import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  name: string;
  email: string;
  phone: string;
  lineId?: string;
  store: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
  admin_email: string;
}

const serviceLabels: Record<string, string> = {
  nail: "美甲服務",
  lash: "美睫服務",
  tattoo: "紋繡服務",
  waxing: "熱蠟除毛",
};

const storeInfo: Record<string, { name: string; address: string; mapUrl: string }> = {
  yuanhua: {
    name: "中壢元化店（前站）",
    address: "桃園市中壢區元化路357號2樓",
    mapUrl: "https://maps.google.com/?q=桃園市中壢區元化路357號2樓",
  },
  zhongfu: {
    name: "中壢忠福店（黃昏市場對面）",
    address: "桃園市中壢區忠福路87號",
    mapUrl: "https://maps.google.com/?q=桃園市中壢區忠福路87號",
  },
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      name, 
      email, 
      phone, 
      lineId,
      store,
      service, 
      date, 
      time, 
      notes, 
      admin_email 
    }: BookingConfirmationRequest = await req.json();

    console.log("Sending booking confirmation emails...");
    console.log("Admin email:", admin_email);
    console.log("Client email:", email);

    const serviceLabel = serviceLabels[service] || service;
    const storeData = storeInfo[store] || { name: store, address: "", mapUrl: "" };
    const timestamp = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

    // 管理者通知信
    const adminHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #fdf2f8 0%, #fff1f2 100%); border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #be185d; font-size: 28px; margin: 0;">📅 Trinhnai 新預約通知</h1>
        </div>
        
        <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 15px rgba(190, 24, 93, 0.1);">
          <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">有一位新客戶預約了服務：</p>
          
          <div style="border-left: 4px solid #f472b6; padding-left: 20px; margin: 20px 0;">
            <p style="color: #1f2937; font-size: 16px; margin: 12px 0;">
              <span style="font-size: 18px;">👩‍💼</span> <strong>客戶稱呼：</strong>${name || "未填"}
            </p>
            <p style="color: #1f2937; font-size: 16px; margin: 12px 0;">
              <span style="font-size: 18px;">📧</span> <strong>Email：</strong><a href="mailto:${email}" style="color: #be185d;">${email}</a>
            </p>
            <p style="color: #1f2937; font-size: 16px; margin: 12px 0;">
              <span style="font-size: 18px;">📱</span> <strong>電話：</strong><a href="tel:${phone}" style="color: #be185d;">${phone}</a>
            </p>
            ${lineId ? `<p style="color: #1f2937; font-size: 16px; margin: 12px 0;">
              <span style="font-size: 18px;">💬</span> <strong>LINE ID：</strong>${lineId}
            </p>` : ''}
            <p style="color: #1f2937; font-size: 16px; margin: 12px 0;">
              <span style="font-size: 18px;">🏪</span> <strong>預約門市：</strong>${storeData.name}
            </p>
            <p style="color: #1f2937; font-size: 16px; margin: 12px 0;">
              <span style="font-size: 18px;">💅</span> <strong>預約服務：</strong>${serviceLabel}
            </p>
            <p style="color: #1f2937; font-size: 16px; margin: 12px 0;">
              <span style="font-size: 18px;">📅</span> <strong>預約日期：</strong>${date}
            </p>
            <p style="color: #1f2937; font-size: 16px; margin: 12px 0;">
              <span style="font-size: 18px;">🕐</span> <strong>預約時段：</strong>${time}
            </p>
            ${notes ? `<p style="color: #1f2937; font-size: 16px; margin: 12px 0;">
              <span style="font-size: 18px;">📝</span> <strong>備註：</strong>${notes}
            </p>` : ''}
            <p style="color: #1f2937; font-size: 16px; margin: 12px 0;">
              <span style="font-size: 18px;">⏰</span> <strong>建立時間：</strong>${timestamp}
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #be185d; font-size: 16px;">
          <p style="margin: 0;">請盡快確認預約 💖</p>
        </div>
      </div>
    `;

    // 客戶確認信
    const clientHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #fdf2f8 0%, #fff1f2 100%); border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #be185d; font-size: 28px; margin: 0;">💖 感謝妳預約 Trinhnai 💖</h1>
        </div>
        
        <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 4px 15px rgba(190, 24, 93, 0.1);">
          <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">親愛的 ${name || "貴賓"}：</p>
          
          <p style="color: #4a5568; font-size: 16px; margin-bottom: 20px;">我們已收到妳的預約資料，以下是妳的預約內容：</p>
          
          <div style="border-left: 4px solid #f472b6; padding-left: 20px; margin: 20px 0; background: #fdf2f8; padding: 20px; border-radius: 8px;">
            <p style="color: #1f2937; font-size: 16px; margin: 12px 0;">
              <span style="font-size: 18px;">🏪</span> <strong>預約門市：</strong>${storeData.name}
            </p>
            <p style="color: #1f2937; font-size: 16px; margin: 12px 0;">
              <span style="font-size: 18px;">📍</span> <strong>地址：</strong>${storeData.address}
            </p>
            <p style="color: #1f2937; font-size: 16px; margin: 12px 0;">
              <span style="font-size: 18px;">🗺️</span> <strong>導航：</strong><a href="${storeData.mapUrl}" target="_blank" style="color: #be185d; text-decoration: underline;">點我開啟 Google Maps</a>
            </p>
            <p style="color: #1f2937; font-size: 16px; margin: 12px 0;">
              <span style="font-size: 18px;">💅</span> <strong>預約服務：</strong>${serviceLabel}
            </p>
            <p style="color: #1f2937; font-size: 16px; margin: 12px 0;">
              <span style="font-size: 18px;">📅</span> <strong>預約日期：</strong>${date}
            </p>
            <p style="color: #1f2937; font-size: 16px; margin: 12px 0;">
              <span style="font-size: 18px;">🕐</span> <strong>預約時段：</strong>${time}
            </p>
          </div>
          
          <p style="color: #4a5568; font-size: 16px; margin-top: 25px; line-height: 1.8;">
            我們將於 <strong style="color: #be185d;">24 小時內</strong> 與妳確認預約 💅<br/>
            若有任何問題，歡迎直接回覆此信或加入 LINE <strong style="color: #be185d;">@355uniyb</strong>。
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 14px;">
          <p style="margin: 0; color: #be185d; font-weight: 600;">Trinhnai 全方位美學沙龍</p>
          <p style="margin: 8px 0 0 0;">中壢元化店・中壢忠福店</p>
        </div>
      </div>
    `;

    // 發送管理者通知信
    const adminEmailResponse = await resend.emails.send({
      from: "Trinhnai 預約通知 <onboarding@resend.dev>",
      to: [admin_email],
      subject: `【Trinhnai 預約通知】${name || "新客戶"} 預約 ${serviceLabel} - ${date} ${time}`,
      html: adminHtml,
    });

    console.log("Admin notification sent:", adminEmailResponse);

    // 發送客戶確認信
    const clientEmailResponse = await resend.emails.send({
      from: "Trinhnai <onboarding@resend.dev>",
      to: [email],
      subject: `感謝妳預約 Trinhnai 💅 ${date} ${time}`,
      html: clientHtml,
    });

    console.log("Client confirmation email sent:", clientEmailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      adminEmail: adminEmailResponse,
      clientEmail: clientEmailResponse
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
