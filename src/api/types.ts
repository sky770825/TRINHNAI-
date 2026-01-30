/**
 * API 層共用型別：與 DB 表對齊，供 api/* 與頁面使用
 */
import type { Database } from "@/integrations/supabase/types";

export type Announcement = Database["public"]["Tables"]["announcements"]["Row"];
export type AnnouncementInsert = Database["public"]["Tables"]["announcements"]["Insert"];
export type AnnouncementUpdate = Database["public"]["Tables"]["announcements"]["Update"];

export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];

export type ServiceSetting = Database["public"]["Tables"]["service_settings"]["Row"];
export type ServiceSettingInsert = Database["public"]["Tables"]["service_settings"]["Insert"];
export type ServiceSettingUpdate = Database["public"]["Tables"]["service_settings"]["Update"];

export type StoreSetting = Database["public"]["Tables"]["store_settings"]["Row"];
export type StoreSettingInsert = Database["public"]["Tables"]["store_settings"]["Insert"];
export type StoreSettingUpdate = Database["public"]["Tables"]["store_settings"]["Update"];

export type SiteAssetRow = Database["public"]["Tables"]["site_assets"]["Row"];
export type SiteContentRow = Database["public"]["Tables"]["site_content"]["Row"];

export type LineUser = Database["public"]["Tables"]["line_users"]["Row"];
export type LineBooking = Database["public"]["Tables"]["line_bookings"]["Row"];
export type BotKeyword = Database["public"]["Tables"]["bot_keywords"]["Row"];
export type BotSetting = Database["public"]["Tables"]["bot_settings"]["Row"];
export type RemarketingMessage = Database["public"]["Tables"]["remarketing_messages"]["Row"];
