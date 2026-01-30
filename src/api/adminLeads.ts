/**
 * admin-leads Edge Function 呼叫封裝；驗證由 utils/adminLeads 的 adminLeadsBody 處理
 */
import { supabase } from "@/integrations/supabase/client";
import { adminLeadsBody, isAdminLeads401, ADMIN_LEADS_401_MESSAGE } from "@/utils/adminLeads";

export { isAdminLeads401, ADMIN_LEADS_401_MESSAGE };

export type AdminLeadsPayload =
  | { action: "getAdminData" }
  | { action: "updateStatus"; bookingId: string; newStatus: string }
  | { action: "deleteBooking"; bookingId: string }
  | { action: "deleteLead"; leadId: string }
  | { action: "getLineUsers" }
  | { action: "updateLineUser"; lineUserId: string; notes?: string; tags?: string[] }
  | { action: "confirmPayment"; lineUserId: string }
  | { action: "sendPaymentConfirmation"; lineUserId: string }
  | { action: "broadcastMessage"; targetGroup: string; message: string }
  | { action: "getRemarketingMessages" }
  | { action: "createRemarketingMessage"; hoursAfterInterest: number; messageContent: string }
  | { action: "updateRemarketingMessage"; remarketingMessageId: string; hoursAfterInterest?: number; messageContent?: string; isActive?: boolean }
  | { action: "deleteRemarketingMessage"; remarketingMessageId: string }
  | { action: "sendBookingConfirmation"; lineBookingId: string };

export interface AdminLeadsResult {
  data: unknown;
  error: unknown;
  is401?: boolean;
}

export async function invokeAdminLeads<T = unknown>(
  payload: AdminLeadsPayload
): Promise<{ data: T | null; error: unknown; is401: boolean }> {
  const { data, error } = await supabase.functions.invoke("admin-leads", {
    body: adminLeadsBody(payload as Record<string, unknown>),
  });
  const is401 = isAdminLeads401(error, data?.error);
  if (error || data?.error) {
    return { data: null, error: data?.error ?? error, is401 };
  }
  return { data: data as T, error: null, is401: false };
}
