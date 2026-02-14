"use server";

import { createSupabaseServer } from "@/lib/supabase-server";
import type { Item, ClientItem } from "@/types";

const CLIENT_SAFE_COLUMNS =
  "id, project_id, item_number, item_type, description, item_link, retail_price, retail_shipping, discount_percent, price_sold_for, quantity, image_url, notes, model_number, seller_merchant, acceptance_status, client_note, created_at, updated_at";

export async function getItems(projectId: string): Promise<Item[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("project_id", projectId)
    .order("item_number", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Item[];
}

export async function getItemsForClient(
  projectId: string
): Promise<ClientItem[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("items")
    .select(CLIENT_SAFE_COLUMNS)
    .eq("project_id", projectId)
    .order("item_number", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ClientItem[];
}

export async function getItemById(id: string): Promise<Item | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Item;
}

export async function getNextItemNumber(projectId: string): Promise<number> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("items")
    .select("item_number")
    .eq("project_id", projectId)
    .order("item_number", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    return (data[0].item_number as number) + 1;
  }
  return 1;
}

export async function createItem(input: {
  project_id: string;
  item_number: number;
  item_type: string;
  description: string;
  item_link?: string | null;
  retail_price: number;
  retail_shipping: number;
  discount_percent: number;
  my_cost: number;
  my_shipping: number;
  price_sold_for?: number | null;
  quantity?: number;
  image_url?: string | null;
  notes?: string;
  model_number?: string;
  seller_merchant?: string;
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("items")
    .insert({
      project_id: input.project_id,
      item_number: input.item_number,
      item_type: input.item_type,
      description: input.description,
      item_link: input.item_link ?? null,
      retail_price: input.retail_price,
      retail_shipping: input.retail_shipping,
      discount_percent: input.discount_percent,
      my_cost: input.my_cost,
      my_shipping: input.my_shipping,
      price_sold_for: input.price_sold_for ?? null,
      quantity: input.quantity ?? 1,
      image_url: input.image_url ?? null,
      notes: input.notes ?? "",
      model_number: input.model_number ?? "",
      seller_merchant: input.seller_merchant ?? "",
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data.id, error: null };
}

export async function updateItem(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, any>
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("items").update(input).eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteItem(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Count items with non-null client notes for a project.
 * Used to show notification badges in admin views.
 */
export async function getClientNoteCount(
  projectId: string
): Promise<number> {
  const supabase = await createSupabaseServer();
  const { count, error } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .not("client_note", "is", null)
    .neq("client_note", "");

  if (error) return 0;
  return count ?? 0;
}

/**
 * Get client note counts for multiple projects at once.
 * Returns a map of projectId → count of items with client notes.
 */
export async function getClientNoteCountsByProjects(
  projectIds: string[]
): Promise<Map<string, number>> {
  if (projectIds.length === 0) return new Map();

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("items")
    .select("project_id, client_note")
    .in("project_id", projectIds)
    .not("client_note", "is", null)
    .neq("client_note", "");

  if (error || !data) return new Map();

  const counts = new Map<string, number>();
  for (const item of data) {
    const current = counts.get(item.project_id) ?? 0;
    counts.set(item.project_id, current + 1);
  }
  return counts;
}
