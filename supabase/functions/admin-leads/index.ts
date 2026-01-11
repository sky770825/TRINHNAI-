import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting (per IP, resets on function restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 10; // Max 10 attempts per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Allowed status values
const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const;
type ValidStatus = typeof VALID_STATUSES[number];

// Allowed payment status values
const VALID_PAYMENT_STATUSES = ['unpaid', 'pending', 'confirmed'] as const;
type ValidPaymentStatus = typeof VALID_PAYMENT_STATUSES[number];

// Allowed action values
const VALID_ACTIONS = [
  'updateStatus', 'getLineUsers', 'updateLineUser', 'confirmPayment', 
  'sendPaymentConfirmation', 'broadcastMessage',
  'getRemarketingMessages', 'createRemarketingMessage', 'updateRemarketingMessage', 'deleteRemarketingMessage',
  'getAdminData', 'deleteBooking', 'deleteLead', 'sendBookingConfirmation'
] as const;
type ValidAction = typeof VALID_ACTIONS[number];

// Allowed target groups for broadcast
const VALID_TARGET_GROUPS = ['all', 'unpaid', 'pending', 'confirmed'] as const;
type ValidTargetGroup = typeof VALID_TARGET_GROUPS[number];

// UUID regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(str: string): boolean {
  return UUID_REGEX.test(str);
}

function isValidStatus(status: unknown): status is ValidStatus {
  return typeof status === 'string' && VALID_STATUSES.includes(status as ValidStatus);
}

function isValidAction(action: unknown): action is ValidAction {
  return typeof action === 'string' && VALID_ACTIONS.includes(action as ValidAction);
}

interface AdminRequest {
  password?: string;
  action?: ValidAction;
  bookingId?: string;
  newStatus?: ValidStatus;
  lineUserId?: string;
  notes?: string;
  tags?: string[];
  paymentStatus?: ValidPaymentStatus;
  targetGroup?: ValidTargetGroup;
  message?: string;
  remarketingMessageId?: string;
  hoursAfterInterest?: number;
  messageContent?: string;
  isActive?: boolean;
  leadId?: string;
  lineBookingId?: string;
}

function validateRequest(body: unknown): { valid: true; data: AdminRequest } | { valid: false; error: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { valid: false, error: '無效的請求格式' };
  }

  const obj = body as Record<string, unknown>;
  const validatedRequest: AdminRequest = {};

  // Password is now optional (JWT auth takes priority)
  if (obj.password !== undefined) {
    if (typeof obj.password !== 'string' || obj.password.length > 100) {
      return { valid: false, error: '密碼格式錯誤' };
    }
    validatedRequest.password = obj.password;
  }

  // Validate optional action
  if (obj.action !== undefined) {
    if (!isValidAction(obj.action)) {
      return { valid: false, error: '無效的操作類型' };
    }
    validatedRequest.action = obj.action;

    // If action is updateStatus, bookingId and newStatus are required
    if (obj.action === 'updateStatus') {
      if (typeof obj.bookingId !== 'string' || !isValidUUID(obj.bookingId)) {
        return { valid: false, error: '無效的預約 ID 格式' };
      }
      if (!isValidStatus(obj.newStatus)) {
        return { valid: false, error: '無效的狀態值' };
      }
      validatedRequest.bookingId = obj.bookingId;
      validatedRequest.newStatus = obj.newStatus;
    }

    // If action is updateLineUser, lineUserId is required
    if (obj.action === 'updateLineUser') {
      if (typeof obj.lineUserId !== 'string' || !isValidUUID(obj.lineUserId)) {
        return { valid: false, error: '無效的用戶 ID 格式' };
      }
      validatedRequest.lineUserId = obj.lineUserId;
      
      // Validate notes (optional)
      if (obj.notes !== undefined) {
        if (typeof obj.notes !== 'string' || obj.notes.length > 2000) {
          return { valid: false, error: '備註格式錯誤' };
        }
        validatedRequest.notes = obj.notes;
      }
      
      // Validate tags (optional)
      if (obj.tags !== undefined) {
        if (!Array.isArray(obj.tags) || obj.tags.length > 20) {
          return { valid: false, error: '標籤格式錯誤' };
        }
        for (const tag of obj.tags) {
          if (typeof tag !== 'string' || tag.length > 50) {
            return { valid: false, error: '標籤格式錯誤' };
          }
        }
      validatedRequest.tags = obj.tags as string[];
      }
    }

    // If action is confirmPayment or sendPaymentConfirmation, lineUserId is required
    if (obj.action === 'confirmPayment' || obj.action === 'sendPaymentConfirmation') {
      if (typeof obj.lineUserId !== 'string' || !isValidUUID(obj.lineUserId)) {
        return { valid: false, error: '無效的用戶 ID 格式' };
      }
      validatedRequest.lineUserId = obj.lineUserId;
    }

    // If action is sendBookingConfirmation, lineBookingId is required
    if (obj.action === 'sendBookingConfirmation') {
      if (typeof obj.lineBookingId !== 'string' || !isValidUUID(obj.lineBookingId)) {
        return { valid: false, error: '無效的預約 ID 格式' };
      }
      validatedRequest.lineBookingId = obj.lineBookingId;
    }

    // If action is broadcastMessage, targetGroup and message are required
    if (obj.action === 'broadcastMessage') {
      if (typeof obj.targetGroup !== 'string' || !VALID_TARGET_GROUPS.includes(obj.targetGroup as ValidTargetGroup)) {
        return { valid: false, error: '無效的推播對象' };
      }
      if (typeof obj.message !== 'string' || obj.message.length === 0 || obj.message.length > 5000) {
        return { valid: false, error: '訊息格式錯誤（1-5000字）' };
      }
      validatedRequest.targetGroup = obj.targetGroup as ValidTargetGroup;
      validatedRequest.message = obj.message;
    }

    // Remarketing message actions validation
    if (obj.action === 'createRemarketingMessage') {
      if (typeof obj.hoursAfterInterest !== 'number' || obj.hoursAfterInterest < 1 || obj.hoursAfterInterest > 720) {
        return { valid: false, error: '時間設定錯誤（1-720小時）' };
      }
      if (typeof obj.messageContent !== 'string' || obj.messageContent.length === 0 || obj.messageContent.length > 5000) {
        return { valid: false, error: '訊息內容格式錯誤' };
      }
      validatedRequest.hoursAfterInterest = obj.hoursAfterInterest;
      validatedRequest.messageContent = obj.messageContent;
    }

    if (obj.action === 'updateRemarketingMessage') {
      if (typeof obj.remarketingMessageId !== 'string' || !isValidUUID(obj.remarketingMessageId)) {
        return { valid: false, error: '無效的訊息 ID' };
      }
      validatedRequest.remarketingMessageId = obj.remarketingMessageId;
      
      if (obj.hoursAfterInterest !== undefined) {
        if (typeof obj.hoursAfterInterest !== 'number' || obj.hoursAfterInterest < 1 || obj.hoursAfterInterest > 720) {
          return { valid: false, error: '時間設定錯誤（1-720小時）' };
        }
        validatedRequest.hoursAfterInterest = obj.hoursAfterInterest;
      }
      if (obj.messageContent !== undefined) {
        if (typeof obj.messageContent !== 'string' || obj.messageContent.length > 5000) {
          return { valid: false, error: '訊息內容格式錯誤' };
        }
        validatedRequest.messageContent = obj.messageContent;
      }
      if (obj.isActive !== undefined) {
        if (typeof obj.isActive !== 'boolean') {
          return { valid: false, error: '啟用狀態格式錯誤' };
        }
        validatedRequest.isActive = obj.isActive;
      }
    }

    if (obj.action === 'deleteRemarketingMessage') {
      if (typeof obj.remarketingMessageId !== 'string' || !isValidUUID(obj.remarketingMessageId)) {
        return { valid: false, error: '無效的訊息 ID' };
      }
      validatedRequest.remarketingMessageId = obj.remarketingMessageId;
    }

    // Delete booking action
    if (obj.action === 'deleteBooking') {
      if (typeof obj.bookingId !== 'string' || !isValidUUID(obj.bookingId)) {
        return { valid: false, error: '無效的預約 ID 格式' };
      }
      validatedRequest.bookingId = obj.bookingId;
    }

    // Delete lead action
    if (obj.action === 'deleteLead') {
      if (typeof obj.leadId !== 'string' || !isValidUUID(obj.leadId)) {
        return { valid: false, error: '無效的名單 ID 格式' };
      }
      validatedRequest.leadId = obj.leadId;
    }
  }

  return { valid: true, data: validatedRequest };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get client IP for rate limiting
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                   req.headers.get('x-real-ip') || 
                   'unknown';

  try {
    // Check content length to prevent large payload attacks
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 10000) {
      console.log("Request too large, rejecting");
      return new Response(
        JSON.stringify({ error: "請求過大" }),
        { 
          status: 413, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse JSON with error handling
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      console.log("Invalid JSON in request body");
      return new Response(
        JSON.stringify({ error: "無效的請求格式" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate request structure and types
    const validation = validateRequest(body);
    if (!validation.valid) {
      console.log("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { password, action, bookingId, newStatus, lineUserId, notes, tags, targetGroup, message, remarketingMessageId, hoursAfterInterest, messageContent, isActive, leadId } = validation.data;
    
    // Check JWT auth first (from Authorization header)
    const authHeader = req.headers.get('Authorization');
    let isJwtAuthed = false;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      });
      
      const { data: { user }, error: authError } = await anonClient.auth.getUser();
      
      if (!authError && user) {
        // Check if user has admin role
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data: roleData } = await serviceClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        
        if (roleData) {
          isJwtAuthed = true;
          console.log("JWT auth successful for user:", user.id);
        }
      }
    }
    
    // Fall back to password auth if JWT auth failed
    if (!isJwtAuthed) {
      const adminPassword = Deno.env.get('ADMIN_PASSWORD');
      
      if (!checkRateLimit(clientIP)) {
        return new Response(
          JSON.stringify({ error: "請求次數過多，請稍後再試" }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!password || password !== adminPassword) {
        return new Response(
          JSON.stringify({ error: "未授權的存取" }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle getAdminData action (for Admin page)
    if (action === 'getAdminData') {
      const [leadsRes, bookingsRes] = await Promise.all([
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*').order('created_at', { ascending: false })
      ]);
      
      return new Response(
        JSON.stringify({ leads: leadsRes.data || [], bookings: bookingsRes.data || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle deleteBooking action
    if (action === 'deleteBooking' && bookingId) {
      console.log(`Deleting booking ${bookingId}`);
      
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (deleteError) {
        console.error("Error deleting booking:", deleteError);
        return new Response(
          JSON.stringify({ error: "刪除預約失敗" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log("Booking deleted successfully");
      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle deleteLead action
    if (action === 'deleteLead' && leadId) {
      console.log(`Deleting lead ${leadId}`);
      
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (deleteError) {
        console.error("Error deleting lead:", deleteError);
        return new Response(
          JSON.stringify({ error: "刪除名單失敗" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log("Lead deleted successfully");
      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle status update action
    if (action === 'updateStatus' && bookingId && newStatus) {
      console.log(`Updating booking ${bookingId} to status: ${newStatus}`);
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (updateError) {
        console.error("Error updating booking status:", updateError);
        return new Response(
          JSON.stringify({ error: "更新狀態失敗" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log("Booking status updated successfully");
      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle getLineUsers action
    if (action === 'getLineUsers') {
      console.log("Fetching LINE users");
      
      const { data: lineUsers, error: lineUsersError } = await supabase
        .from('line_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (lineUsersError) {
        console.error("Error fetching LINE users:", lineUsersError);
        return new Response(
          JSON.stringify({ error: "取得用戶資料失敗" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`Successfully fetched ${lineUsers?.length || 0} LINE users`);
      return new Response(
        JSON.stringify({ lineUsers: lineUsers || [] }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle updateLineUser action
    if (action === 'updateLineUser' && lineUserId) {
      console.log(`Updating LINE user ${lineUserId}`);
      
      const updateData: Record<string, unknown> = {};
      if (notes !== undefined) updateData.notes = notes;
      if (tags !== undefined) updateData.tags = tags;

      const { error: updateError } = await supabase
        .from('line_users')
        .update(updateData)
        .eq('id', lineUserId);

      if (updateError) {
        console.error("Error updating LINE user:", updateError);
        return new Response(
          JSON.stringify({ error: "更新用戶資料失敗" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log("LINE user updated successfully");
      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle confirmPayment action - update payment status to confirmed
    if (action === 'confirmPayment' && lineUserId) {
      console.log(`Confirming payment for LINE user ${lineUserId}`);
      
      const { error: updateError } = await supabase
        .from('line_users')
        .update({ payment_status: 'confirmed' })
        .eq('id', lineUserId);

      if (updateError) {
        console.error("Error confirming payment:", updateError);
        return new Response(
          JSON.stringify({ error: "確認付款失敗" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log("Payment confirmed successfully");
      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle sendPaymentConfirmation action - send LINE message to user
    if (action === 'sendPaymentConfirmation' && lineUserId) {
      console.log(`Sending payment confirmation to LINE user ${lineUserId}`);
      
      // Get user's LINE user ID
      const { data: lineUser, error: userError } = await supabase
        .from('line_users')
        .select('line_user_id, display_name, payment_status')
        .eq('id', lineUserId)
        .single();

      if (userError || !lineUser) {
        console.error("Error fetching LINE user:", userError);
        return new Response(
          JSON.stringify({ error: "找不到用戶資料" }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Update payment status if not already confirmed
      if (lineUser.payment_status !== 'confirmed') {
        await supabase
          .from('line_users')
          .update({ payment_status: 'confirmed' })
          .eq('id', lineUserId);
      }

      // Send LINE message
      const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: "LINE 設定錯誤" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          to: lineUser.line_user_id,
          messages: [{
            type: 'text',
            text: `🎉 報名成功！\n\n親愛的 ${lineUser.display_name || '會員'} 您好，\n\n我們已確認收到您的匯款，報名手續已完成！\n\n感謝您的報名，期待與您見面！✨`,
          }],
        }),
      });

      if (!lineResponse.ok) {
        const errorText = await lineResponse.text();
        console.error("LINE API error:", errorText);
        return new Response(
          JSON.stringify({ error: "發送 LINE 訊息失敗" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log("Payment confirmation sent successfully");
      return new Response(
        JSON.stringify({ success: true }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle sendBookingConfirmation action - send LINE booking confirmation message
    if (action === 'sendBookingConfirmation' && request.lineBookingId) {
      console.log(`Sending booking confirmation for booking ${request.lineBookingId}`);
      
      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('line_bookings')
        .select('*')
        .eq('id', request.lineBookingId)
        .single();

      if (bookingError || !booking) {
        console.error("Error fetching booking:", bookingError);
        return new Response(
          JSON.stringify({ error: "找不到預約資料", details: bookingError?.message }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log("Booking data:", JSON.stringify({
        id: booking.id,
        line_user_id: booking.line_user_id,
        user_name: booking.user_name,
        service: booking.service,
        store: booking.store
      }));

      // Get service and store names
      const { data: service } = await supabase
        .from('service_settings')
        .select('name')
        .eq('service_id', booking.service)
        .single();

      const { data: store } = await supabase
        .from('store_settings')
        .select('name')
        .eq('store_id', booking.store)
        .single();

      const serviceName = service?.name || booking.service;
      const storeName = store?.name || booking.store;

      // Get LINE user info if needed
      let displayName = booking.user_name || '會員';
      if (booking.line_user_id) {
        const { data: lineUser } = await supabase
          .from('line_users')
          .select('display_name')
          .eq('line_user_id', booking.line_user_id)
          .single();
        if (lineUser?.display_name) {
          displayName = lineUser.display_name;
        }
      }

      // Update booking status to confirmed
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('line_bookings')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: user?.email || 'admin',
        })
        .eq('id', request.lineBookingId);

      // Send LINE message
      const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: "LINE 設定錯誤" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const lineUserId = booking.line_user_id;

      if (!lineUserId || lineUserId.trim() === '') {
        console.error("Booking missing line_user_id:", {
          bookingId: booking.id,
          line_user_id: booking.line_user_id,
          user_name: booking.user_name
        });
        return new Response(
          JSON.stringify({ 
            error: "找不到用戶 LINE ID",
            details: "預約記錄中沒有 LINE 用戶 ID，請確認預約是從 LINE 建立的"
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log("Sending LINE message to user:", lineUserId);

      const confirmationMessage = `✅ 預約確認成功！\n\n親愛的 ${displayName} 您好，\n\n您的預約已確認：\n\n📅 日期：${booking.booking_date}\n⏰ 時間：${booking.booking_time}\n💆 服務：${serviceName}\n🏪 分店：${storeName}\n\n我們期待為您服務！\n如有任何問題，請隨時聯繫我們。\n\n感謝您的預約！✨`;

      const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          to: lineUserId,
          messages: [{
            type: 'text',
            text: confirmationMessage,
          }],
        }),
      });

      if (!lineResponse.ok) {
        const errorText = await lineResponse.text();
        console.error("LINE API error:", errorText);
        return new Response(
          JSON.stringify({ error: "發送 LINE 訊息失敗" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log("Booking confirmation sent successfully");
      return new Response(
        JSON.stringify({ success: true, bookingId: request.lineBookingId }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle broadcastMessage action - send message to target group
    if (action === 'broadcastMessage' && targetGroup && message) {
      console.log(`Broadcasting message to group: ${targetGroup}`);
      
      // Build query based on target group
      let query = supabase
        .from('line_users')
        .select('line_user_id, display_name')
        .eq('follow_status', 'following');
      
      if (targetGroup !== 'all') {
        query = query.eq('payment_status', targetGroup);
      }
      
      const { data: targetUsers, error: usersError } = await query;
      
      if (usersError) {
        console.error("Error fetching target users:", usersError);
        return new Response(
          JSON.stringify({ error: "取得用戶資料失敗" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (!targetUsers || targetUsers.length === 0) {
        return new Response(
          JSON.stringify({ error: "沒有符合條件的用戶" }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      const accessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: "LINE 設定錯誤" }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Send messages to all target users
      let sentCount = 0;
      const errors: string[] = [];
      
      for (const user of targetUsers) {
        try {
          const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              to: user.line_user_id,
              messages: [{
                type: 'text',
                text: message,
              }],
            }),
          });
          
          if (lineResponse.ok) {
            sentCount++;
          } else {
            const errorText = await lineResponse.text();
            console.error(`Failed to send to ${user.line_user_id}:`, errorText);
            errors.push(user.display_name || user.line_user_id);
          }
        } catch (err) {
          console.error(`Error sending to ${user.line_user_id}:`, err);
          errors.push(user.display_name || user.line_user_id);
        }
      }
      
      console.log(`Broadcast complete: ${sentCount}/${targetUsers.length} sent`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          sentCount,
          totalTargets: targetUsers.length,
          failedUsers: errors.length > 0 ? errors : undefined
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle getRemarketingMessages action
    if (action === 'getRemarketingMessages') {
      console.log("Fetching remarketing messages");
      
      const { data: messages, error: messagesError } = await supabase
        .from('remarketing_messages')
        .select('*')
        .order('hours_after_interest', { ascending: true });

      if (messagesError) {
        console.error("Error fetching remarketing messages:", messagesError);
        return new Response(
          JSON.stringify({ error: "取得再行銷訊息失敗" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get sent log counts
      const { data: sentCounts } = await supabase
        .from('remarketing_sent_log')
        .select('message_id');

      const countMap: Record<string, number> = {};
      for (const log of sentCounts || []) {
        countMap[log.message_id] = (countMap[log.message_id] || 0) + 1;
      }

      const messagesWithCounts = (messages || []).map((msg: { id: string }) => ({
        ...msg,
        sent_count: countMap[msg.id] || 0,
      }));

      return new Response(
        JSON.stringify({ remarketingMessages: messagesWithCounts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle createRemarketingMessage action
    if (action === 'createRemarketingMessage' && hoursAfterInterest && messageContent) {
      console.log(`Creating remarketing message for ${hoursAfterInterest} hours`);
      
      const { data: newMessage, error: createError } = await supabase
        .from('remarketing_messages')
        .insert({
          hours_after_interest: hoursAfterInterest,
          message_content: messageContent,
          is_active: true,
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating remarketing message:", createError);
        if (createError.code === '23505') { // Unique violation
          return new Response(
            JSON.stringify({ error: "此時間點已有設定的訊息" }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ error: "建立訊息失敗" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: newMessage }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle updateRemarketingMessage action
    if (action === 'updateRemarketingMessage' && remarketingMessageId) {
      console.log(`Updating remarketing message ${remarketingMessageId}`);
      
      const updateData: Record<string, unknown> = {};
      if (hoursAfterInterest !== undefined) updateData.hours_after_interest = hoursAfterInterest;
      if (messageContent !== undefined) updateData.message_content = messageContent;
      if (isActive !== undefined) updateData.is_active = isActive;

      const { error: updateError } = await supabase
        .from('remarketing_messages')
        .update(updateData)
        .eq('id', remarketingMessageId);

      if (updateError) {
        console.error("Error updating remarketing message:", updateError);
        if (updateError.code === '23505') {
          return new Response(
            JSON.stringify({ error: "此時間點已有設定的訊息" }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ error: "更新訊息失敗" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle deleteRemarketingMessage action
    if (action === 'deleteRemarketingMessage' && remarketingMessageId) {
      console.log(`Deleting remarketing message ${remarketingMessageId}`);
      
      const { error: deleteError } = await supabase
        .from('remarketing_messages')
        .delete()
        .eq('id', remarketingMessageId);

      if (deleteError) {
        console.error("Error deleting remarketing message:", deleteError);
        return new Response(
          JSON.stringify({ error: "刪除訊息失敗" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error("Error fetching leads:", leadsError);
    }

    // Fetch all bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
    }

    console.log(`Successfully fetched ${leads?.length || 0} leads and ${bookings?.length || 0} bookings`);

    return new Response(
      JSON.stringify({ leads: leads || [], bookings: bookings || [] }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("Error in admin-leads function:", error);
    // Return generic error message to avoid information leakage
    return new Response(
      JSON.stringify({ error: "伺服器錯誤，請稍後再試" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
