"use server";

import { revalidatePath } from "next/cache";
import { getAdminSupabase } from "@/lib/supabase-admin";
import type { Lead, LeadStatus } from "@/types";

export async function getLeads(): Promise<Lead[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Lead[];
}

export interface LeadStats {
  total: number;
  newCount: number;
  thisWeek: number;
}

export async function getLeadStats(): Promise<LeadStats> {
  const supabase = getAdminSupabase();

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [totalRes, newRes, weekRes] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", oneWeekAgo.toISOString()),
  ]);

  return {
    total: totalRes.count ?? 0,
    newCount: newRes.count ?? 0,
    thisWeek: weekRes.count ?? 0,
  };
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/leads");
}
