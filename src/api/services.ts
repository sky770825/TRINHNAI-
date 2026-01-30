import { supabase } from "@/integrations/supabase/client";
import type { ServiceSetting, ServiceSettingInsert, ServiceSettingUpdate } from "./types";

export async function fetchServices(): Promise<{
  data: ServiceSetting[] | null;
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("service_settings")
    .select("*")
    .order("sort_order");
  if (error) return { data: null, error: error as Error };
  return { data: data ?? [], error: null };
}

export async function createService(
  payload: ServiceSettingInsert
): Promise<{ data: ServiceSetting | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("service_settings")
    .insert(payload)
    .select()
    .single();
  if (error) return { data: null, error: error as Error };
  return { data, error: null };
}

export async function updateService(
  id: string,
  payload: ServiceSettingUpdate
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("service_settings").update(payload).eq("id", id);
  return { error: error ? (error as Error) : null };
}

export async function deleteService(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("service_settings").delete().eq("id", id);
  return { error: error ? (error as Error) : null };
}

export async function updateServiceSortOrder(
  id: string,
  sortOrder: number
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("service_settings")
    .update({ sort_order: sortOrder })
    .eq("id", id);
  return { error: error ? (error as Error) : null };
}

export async function uploadServiceImage(
  file: File,
  filePath: string
): Promise<{ publicUrl: string | null; error: Error | null }> {
  const { error } = await supabase.storage
    .from("service-images")
    .upload(filePath, file, { cacheControl: "3600", upsert: false });
  if (error) return { publicUrl: null, error: error as Error };
  const {
    data: { publicUrl },
  } = supabase.storage.from("service-images").getPublicUrl(filePath);
  return { publicUrl, error: null };
}

export async function removeServiceImage(pathInBucket: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.storage.from("service-images").remove([pathInBucket]);
  return { error: error ? (error as Error) : null };
}
