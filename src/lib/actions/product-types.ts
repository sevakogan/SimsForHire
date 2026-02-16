"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";

export interface ProductType {
  id: string;
  name: string;
  color_key: string;
  sort_order: number;
  created_at: string;
}

export async function getProductTypes(): Promise<ProductType[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("product_types")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProductType[];
}

export async function createProductType(
  name: string,
  colorKey: string
): Promise<{ id: string | null; error: string | null }> {
  const trimmed = name.trim();
  if (!trimmed) return { id: null, error: "Name is required" };

  const supabase = await createSupabaseServer();

  // Get the next sort_order
  const { data: maxRow } = await supabase
    .from("product_types")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data, error } = await supabase
    .from("product_types")
    .insert({ name: trimmed, color_key: colorKey, sort_order: nextOrder })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { id: null, error: "This type already exists" };
    }
    return { id: null, error: error.message };
  }

  revalidatePath("/customizations/types");
  return { id: data.id, error: null };
}

export async function updateProductType(
  id: string,
  name: string,
  colorKey: string
): Promise<{ error: string | null }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required" };

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("product_types")
    .update({ name: trimmed, color_key: colorKey })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: "This type already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/customizations/types");
  return { error: null };
}

export async function deleteProductType(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("product_types").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/customizations/types");
  return { error: null };
}
