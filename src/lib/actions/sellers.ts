"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";

export interface Seller {
  id: string;
  name: string;
  created_at: string;
}

export async function getSellers(): Promise<Seller[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Seller[];
}

export async function searchSellers(query: string): Promise<Seller[]> {
  if (!query.trim()) return [];

  const supabase = await createSupabaseServer();
  const searchTerm = query.trim();
  const { data, error } = await supabase
    .from("sellers")
    .select("*")
    .ilike("name", `%${searchTerm}%`)
    .order("name", { ascending: true })
    .limit(10);

  if (error) return [];
  return (data ?? []) as Seller[];
}

export async function createSeller(
  name: string
): Promise<{ id: string | null; error: string | null }> {
  const trimmed = name.trim();
  if (!trimmed) return { id: null, error: "Name is required" };

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("sellers")
    .insert({ name: trimmed })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { id: null, error: "This seller already exists" };
    }
    return { id: null, error: error.message };
  }

  revalidatePath("/customizations");
  return { id: data.id, error: null };
}

export async function updateSeller(
  id: string,
  name: string
): Promise<{ error: string | null }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required" };

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("sellers")
    .update({ name: trimmed })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "This seller already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/customizations");
  return { error: null };
}

export async function deleteSeller(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("sellers").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/customizations");
  return { error: null };
}
