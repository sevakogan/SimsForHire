"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { notifyChange } from "@/lib/actions/notifications";
import type { Item, ClientItem, ProductCategory } from "@/types";

const CLIENT_SAFE_COLUMNS =
  "id, project_id, item_number, item_type, category, description, item_link, retail_price, retail_shipping, discount_percent, price_sold_for, quantity, image_url, notes, model_number, seller_merchant, acceptance_status, client_note, created_at, updated_at";

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
  category?: ProductCategory;
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
  product_id?: string | null;
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("items")
    .insert({
      project_id: input.project_id,
      item_number: input.item_number,
      item_type: input.item_type,
      category: input.category ?? "product",
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
      product_id: input.product_id ?? null,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };

  // Notify: item added
  notifyChange({
    projectId: input.project_id,
    type: "item_added",
    description: `added item "${input.description ?? "New item"}"`,
  });

  revalidatePath(`/projects/${input.project_id}`);
  return { id: data.id, error: null };
}

export async function updateItem(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: Record<string, any>
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  // Fetch project_id + description before updating (for notification)
  const { data: existing } = await supabase
    .from("items")
    .select("project_id, description")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("items").update(input).eq("id", id);
  if (error) return { error: error.message };

  // Notify: item updated
  if (existing?.project_id) {
    notifyChange({
      projectId: existing.project_id,
      type: "item_updated",
      description: `updated item "${existing.description ?? "item"}"`,
    });
  }

  revalidatePath("/projects", "layout");
  return { error: null };
}

export async function deleteItem(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects", "layout");
  return { error: null };
}

/**
 * Refresh all items in a project from their linked products.
 * Only updates items that have a product_id. Syncs: retail_price, sales_price → price_sold_for,
 * cost → my_cost, shipping → retail_shipping, image_url, description, type, seller_merchant, model_number.
 * Returns the count of updated items.
 */
export async function syncItemsFromProducts(
  projectId: string
): Promise<{ updated: number; error: string | null }> {
  const supabase = await createSupabaseServer();

  // Fetch all items with a linked product
  const { data: items, error: itemsErr } = await supabase
    .from("items")
    .select("id, product_id")
    .eq("project_id", projectId)
    .not("product_id", "is", null);

  if (itemsErr) return { updated: 0, error: itemsErr.message };
  if (!items || items.length === 0) return { updated: 0, error: null };

  // Collect unique product IDs
  const productIds = [...new Set(items.map((i) => i.product_id as string))];

  // Fetch all referenced products in one query
  const { data: products, error: productsErr } = await supabase
    .from("products")
    .select("id, retail_price, sales_price, cost, shipping, image_url, description, type, seller_merchant, model_number")
    .in("id", productIds);

  if (productsErr) return { updated: 0, error: productsErr.message };

  // Build a product lookup map
  const productMap = new Map(
    (products ?? []).map((p) => [p.id, p])
  );

  // Update each item from its linked product
  let updated = 0;
  for (const item of items) {
    const product = productMap.get(item.product_id as string);
    if (!product) continue;

    const { error: updateErr } = await supabase
      .from("items")
      .update({
        retail_price: product.retail_price,
        price_sold_for: product.sales_price,
        my_cost: product.cost,
        retail_shipping: product.shipping,
        image_url: product.image_url,
        description: product.description,
        item_type: product.type,
        seller_merchant: product.seller_merchant,
        model_number: product.model_number,
      })
      .eq("id", item.id);

    if (!updateErr) updated++;
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/projects", "layout");
  return { updated, error: null };
}

/**
 * Count items with unread client notes for a project.
 * A note is "unread" when client_note is non-empty AND client_note_read_at is null.
 */
export async function getUnreadNoteCount(
  projectId: string
): Promise<number> {
  const supabase = await createSupabaseServer();
  const { count, error } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .not("client_note", "is", null)
    .neq("client_note", "")
    .is("client_note_read_at", null);

  if (error) return 0;
  return count ?? 0;
}

/**
 * Get unread client note counts for multiple projects at once.
 * Returns a map of projectId → count of items with unread notes.
 */
export async function getUnreadNoteCountsByProjects(
  projectIds: string[]
): Promise<Map<string, number>> {
  if (projectIds.length === 0) return new Map();

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("items")
    .select("project_id")
    .in("project_id", projectIds)
    .not("client_note", "is", null)
    .neq("client_note", "")
    .is("client_note_read_at", null);

  if (error || !data) return new Map();

  const counts = new Map<string, number>();
  for (const item of data) {
    const current = counts.get(item.project_id) ?? 0;
    counts.set(item.project_id, current + 1);
  }
  return counts;
}

/**
 * Get unread client note counts rolled up per client.
 * Returns a map of clientId → total unread note count across all projects.
 */
export async function getUnreadNoteCountsByClients(
  clientIds: string[]
): Promise<Map<string, number>> {
  if (clientIds.length === 0) return new Map();

  const supabase = await createSupabaseServer();

  // Get items with unread notes, joined to their project for client_id
  const { data, error } = await supabase
    .from("items")
    .select("project_id, projects!inner(client_id)")
    .not("client_note", "is", null)
    .neq("client_note", "")
    .is("client_note_read_at", null);

  if (error || !data) return new Map();

  const counts = new Map<string, number>();
  for (const item of data) {
    const clientId = (item.projects as unknown as { client_id: string }).client_id;
    if (!clientIds.includes(clientId)) continue;
    const current = counts.get(clientId) ?? 0;
    counts.set(clientId, current + 1);
  }
  return counts;
}

/**
 * Mark a single item's client note as read.
 */
export async function markNoteRead(
  itemId: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("items")
    .update({ client_note_read_at: new Date().toISOString() })
    .eq("id", itemId);

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Mark all client notes in a project as read.
 */
export async function markAllNotesReadInProject(
  projectId: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("items")
    .update({ client_note_read_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .not("client_note", "is", null)
    .neq("client_note", "")
    .is("client_note_read_at", null);

  if (error) return { error: error.message };
  return { error: null };
}

/* ── Notification helpers ───────────────────────────── */

export interface UnreadNotification {
  itemId: string;
  projectId: string;
  projectName: string;
  clientName: string;
  itemDescription: string;
  clientNote: string;
  createdAt: string;
}

/**
 * Get all unread client notes with project/client context for the notification bell.
 * Returns up to `limit` items, ordered by most recent first.
 */
export async function getUnreadNotifications(
  limit = 10
): Promise<UnreadNotification[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("items")
    .select(
      "id, project_id, description, client_note, updated_at, projects!inner(name, clients!inner(name))"
    )
    .not("client_note", "is", null)
    .neq("client_note", "")
    .is("client_note_read_at", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row: Record<string, unknown>) => {
    const project = row.projects as Record<string, unknown> | null;
    const client = project?.clients as Record<string, unknown> | null;
    return {
      itemId: row.id as string,
      projectId: row.project_id as string,
      projectName: (project?.name as string) ?? "Project",
      clientName: (client?.name as string) ?? "Client",
      itemDescription: (row.description as string) ?? "",
      clientNote: row.client_note as string,
      createdAt: row.updated_at as string,
    };
  });
}

/**
 * Get total count of all unread client notes across all projects.
 */
export async function getTotalUnreadNoteCount(): Promise<number> {
  const supabase = await createSupabaseServer();
  const { count, error } = await supabase
    .from("items")
    .select("id", { count: "exact", head: true })
    .not("client_note", "is", null)
    .neq("client_note", "")
    .is("client_note_read_at", null);

  if (error) return 0;
  return count ?? 0;
}
