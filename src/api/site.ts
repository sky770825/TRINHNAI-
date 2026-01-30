import { supabase } from "@/integrations/supabase/client";
import type { SiteAssetRow, SiteContentRow } from "./types";

export async function fetchSiteAssets(): Promise<{
  data: SiteAssetRow[] | null;
  error: Error | null;
}> {
  const { data, error } = await supabase.from("site_assets").select("*").order("key");
  if (error) return { data: null, error: error as Error };
  return { data: data ?? [], error: null };
}

export async function fetchSiteContent(): Promise<{
  data: SiteContentRow[] | null;
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .order("page_key")
    .order("sort_order");
  if (error) return { data: null, error: error as Error };
  return { data: data ?? [], error: null };
}

export async function updateSiteAsset(
  id: string,
  payload: { path?: string; url?: string; alt_text?: string | null }
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("site_assets")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error ? (error as Error) : null };
}

export async function insertSiteAsset(payload: {
  key: string;
  path: string | null;
  url: string | null;
  alt_text?: string | null;
}): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("site_assets").insert(payload);
  return { error: error ? (error as Error) : null };
}

export async function uploadSiteAsset(
  bucketKey: string,
  file: File,
  path: string
): Promise<{ publicUrl: string | null; error: Error | null }> {
  const { error } = await supabase.storage
    .from("site-assets")
    .upload(path, file, { cacheControl: "3600", upsert: true });
  if (error) return { publicUrl: null, error: error as Error };
  const {
    data: { publicUrl },
  } = supabase.storage.from("site-assets").getPublicUrl(path);
  return { publicUrl, error: null };
}

export async function updateSiteContent(
  id: string,
  content: unknown
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("site_content")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error ? (error as Error) : null };
}
