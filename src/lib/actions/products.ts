"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { createSeller } from "@/lib/actions/sellers";
import type { Product, ClientProduct, ProductCategory, ProductSearchResult } from "@/types";

/** Auto-create seller in the sellers table if it doesn't already exist */
async function ensureSellerExists(name: string | undefined) {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return;
  // createSeller handles duplicates gracefully (23505 unique constraint)
  await createSeller(trimmed);
}

const CLIENT_SAFE_COLUMNS =
  "id, model_number, name, type, category, description, retail_price, sales_price, shipping, image_url, notes, manufacturer_website, seller_merchant, created_at, updated_at";

export async function getProducts(category?: ProductCategory): Promise<Product[]> {
  const supabase = await createSupabaseServer();
  let query = supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

export async function getProductsForClient(category?: ProductCategory): Promise<ClientProduct[]> {
  const supabase = await createSupabaseServer();
  let query = supabase
    .from("products")
    .select(CLIENT_SAFE_COLUMNS)
    .order("name", { ascending: true });

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientProduct[];
}

export async function getProductById(id: string): Promise<Product | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Product;
}

export async function createProduct(input: {
  model_number: string;
  name: string;
  type: string;
  category?: ProductCategory;
  description: string;
  retail_price: number;
  cost: number;
  sales_price: number;
  shipping: number;
  image_url?: string | null;
  notes?: string;
  manufacturer_website?: string;
  seller_merchant?: string;
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { id: null, error: "Not authenticated" };

  const category = input.category ?? "product";

  const { data, error } = await supabase
    .from("products")
    .insert({
      model_number: input.model_number,
      name: input.name,
      type: input.type,
      category,
      description: input.description,
      retail_price: input.retail_price,
      cost: input.cost,
      sales_price: input.sales_price,
      shipping: input.shipping,
      image_url: input.image_url ?? null,
      notes: input.notes ?? "",
      manufacturer_website: input.manufacturer_website ?? null,
      seller_merchant: input.seller_merchant ?? "",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { id: null, error: error.message };
  }

  // Auto-create seller if it doesn't exist yet
  await ensureSellerExists(input.seller_merchant);

  revalidatePath("/customizations/products");
  revalidatePath("/customizations/services");
  return { id: data.id, error: null };
}

export async function updateProduct(
  id: string,
  input: Partial<{
    model_number: string;
    name: string;
    type: string;
    description: string;
    retail_price: number;
    cost: number;
    sales_price: number;
    shipping: number;
    image_url: string | null;
    notes: string;
    manufacturer_website: string;
    seller_merchant: string;
  }>
): Promise<{ error: string | null }> {
  // Clean undefined values — null is intentional (e.g. clearing image)
  const cleanInput: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      cleanInput[key] = value;
    }
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("products")
    .update(cleanInput)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  // Auto-create seller if name changed and doesn't exist yet
  if ("seller_merchant" in cleanInput) {
    await ensureSellerExists(cleanInput.seller_merchant as string);
  }

  // ── Sync product changes to linked items in open invoices ──
  // Map product fields → item fields
  const PRODUCT_TO_ITEM_FIELD: Record<string, string> = {
    retail_price: "retail_price",
    sales_price: "price_sold_for",
    cost: "my_cost",
    shipping: "retail_shipping",
    image_url: "image_url",
    description: "description",
    type: "item_type",
    seller_merchant: "seller_merchant",
    model_number: "model_number",
  };

  // Build the item update payload from changed product fields
  const itemUpdate: Record<string, unknown> = {};
  for (const [productField, itemField] of Object.entries(PRODUCT_TO_ITEM_FIELD)) {
    if (productField in cleanInput) {
      itemUpdate[itemField] = cleanInput[productField];
    }
  }

  if (Object.keys(itemUpdate).length > 0) {
    // Only update items in open (pre-accepted) projects
    const OPEN_STATUSES = ["draft", "quote", "submitted"];

    // Find item IDs linked to this product that belong to open projects
    const { data: linkedItems } = await supabase
      .from("items")
      .select("id, projects!inner(status)")
      .eq("product_id", id);

    const openItemIds = (linkedItems ?? [])
      .filter((row) => {
        const project = row.projects as unknown as { status: string };
        return OPEN_STATUSES.includes(project.status);
      })
      .map((row) => row.id);

    if (openItemIds.length > 0) {
      await supabase
        .from("items")
        .update(itemUpdate)
        .in("id", openItemIds);
    }

    revalidatePath("/projects", "layout");
  }

  revalidatePath("/customizations/products");
  revalidatePath("/customizations/services");
  revalidatePath(`/customizations/products/${id}`);
  revalidatePath(`/customizations/services/${id}`);
  return { error: null };
}

export async function deleteProduct(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/customizations/products");
  revalidatePath("/customizations/services");
  return { error: null };
}

export async function searchProducts(
  query: string,
  includeCost: boolean = false
): Promise<ProductSearchResult[]> {
  if (!query.trim()) return [];

  const supabase = await createSupabaseServer();
  const searchTerm = query.trim();

  const { data, error } = await supabase
    .from("products")
    .select("id, model_number, name, type, category, description, retail_price, cost, sales_price, shipping, image_url, seller_merchant")
    .or(
      `name.ilike.%${searchTerm}%,model_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
    )
    .order("name", { ascending: true })
    .limit(10);

  if (error) throw new Error(error.message);

  const results = (data ?? []) as (ProductSearchResult & { cost: number })[];

  if (!includeCost) {
    return results.map(({ cost: _cost, ...rest }) => rest);
  }

  return results;
}
