import { supabase } from "@/integrations/supabase/client";
import type { Lead } from "./types";

export async function fetchLeads(): Promise<{ data: Lead[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return { data: null, error: error as Error };
  return { data: data ?? [], error: null };
}

export async function deleteLead(leadId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  return { error: error ? (error as Error) : null };
}
