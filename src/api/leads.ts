import { supabase } from "@/integrations/supabase/client";
import type { Lead } from "./types";

export async function fetchLeads(): Promise<{ data: Lead[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    const e = error as Error & { code?: string };
    if (e.code === "PGRST205" || e.message?.includes("Could not find the table")) {
      return { data: [], error: null };
    }
    return { data: null, error: error as Error };
  }
  return { data: data ?? [], error: null };
}

export async function deleteLead(leadId: string): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  return { error: error ? (error as Error) : null };
}
