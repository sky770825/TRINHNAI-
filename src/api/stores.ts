import { supabase } from "@/integrations/supabase/client";
import type { StoreSetting, StoreSettingInsert, StoreSettingUpdate } from "./types";

export async function fetchStores(): Promise<{
  data: StoreSetting[] | null;
  error: Error | null;
}> {
  const { data, error } = await supabase.from("store_settings").select("*");
  if (error) return { data: null, error: error as Error };
  return { data: data ?? [], error: null };
}

export async function createStore(
  payload: StoreSettingInsert
): Promise<{ data: StoreSetting | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("store_settings")
    .insert(payload)
    .select()
    .single();
  if (error) return { data: null, error: error as Error };
  return { data, error: null };
}

export async function updateStore(
  id: string,
  payload: StoreSettingUpdate
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("store_settings").update(payload).eq("id", id);
  return { error: error ? (error as Error) : null };
}

export async function deleteStore(id: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("store_settings").delete().eq("id", id);
  return { error: error ? (error as Error) : null };
}

export async function toggleStoreActive(
  id: string,
  isActive: boolean
): Promise<{ error: Error | null }> {
  const { error } = await supabase
    .from("store_settings")
    .update({ is_active: !isActive })
    .eq("id", id);
  return { error: error ? (error as Error) : null };
}
