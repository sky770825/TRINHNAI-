import { supabase } from "@/integrations/supabase/client";
import type { Announcement, AnnouncementInsert } from "./types";

export async function fetchAnnouncements(): Promise<{
  data: Announcement[] | null;
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) return { data: null, error: error as Error };
  return { data: data ?? [], error: null };
}

export async function createAnnouncement(
  payload: AnnouncementInsert
): Promise<{ data: Announcement | null; error: Error | null }> {
  const { data, error } = await supabase.from("announcements").insert(payload).select().single();
  if (error) return { data: null, error: error as Error };
  return { data, error: null };
}

export async function updateAnnouncement(
  id: string,
  payload: Partial<AnnouncementInsert>
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("announcements").update(payload).eq("id", id);
  return { error: error ? (error as Error) : null };
}

export async function deleteAnnouncement(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  return { error: error ? (error as Error) : null };
}

export async function toggleAnnouncementActive(
  id: string,
  isActive: boolean
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("announcements")
    .update({ is_active: !isActive })
    .eq("id", id);
  return { error: error ? (error as Error) : null };
}

export async function uploadAnnouncementImage(
  file: File,
  fileName?: string
): Promise<{ publicUrl: string | null; error: Error | null }> {
  const ext = file.name.split(".").pop() || "png";
  const path = fileName || `announcement-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("announcement-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) return { publicUrl: null, error: error as Error };
  const {
    data: { publicUrl },
  } = supabase.storage.from("announcement-images").getPublicUrl(path);
  return { publicUrl, error: null };
}

export async function removeAnnouncementImage(pathInBucket: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.storage.from("announcement-images").remove([pathInBucket]);
  return { error: error ? (error as Error) : null };
}

export async function checkAnnouncementBucketExists(): Promise<boolean> {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) return false;
  return buckets?.some((b) => b.name === "announcement-images") ?? false;
}
