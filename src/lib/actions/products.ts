"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { Product, ClientProduct, ProductSearchResult } from "@/types";

const CLIENT_SAFE_COLUMNS =
  "id, model_number, name, type, description, retail_price, sales_price, shipping, image_url, notes, manufacturer_website, seller_merchant, created_at, updated_at";

export async function getProducts(): Promise<Product[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

export async function getProductsForClient(): Promise<ClientProduct[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("products")
    .select(CLIENT_SAFE_COLUMNS)
    .order("name", { ascending: true });

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

  console.log("[createProduct]", input.name, "image_url:", JSON.stringify(input.image_url));

  const { data, error } = await supabase
    .from("products")
    .insert({
      model_number: input.model_number,
      name: input.name,
      type: input.type,
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
    console.error("[createProduct] FAILED:", error.message);
    return { id: null, error: error.message };
  }
  console.log("[createProduct] SUCCESS id:", data.id);
  revalidatePath("/catalog");
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

  console.log("[updateProduct]", id, "image_url:", JSON.stringify(cleanInput.image_url), "keys:", Object.keys(cleanInput).join(","));

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("products")
    .update(cleanInput)
    .eq("id", id);

  if (error) {
    console.error("[updateProduct] FAILED:", error.message);
    return { error: error.message };
  }
  console.log("[updateProduct] SUCCESS for", id);

  // Sync image_url to all linked items when product image changes
  if ("image_url" in cleanInput) {
    const imageValue = (cleanInput.image_url as string) ?? null;
    await supabase
      .from("items")
      .update({ image_url: imageValue })
      .eq("product_id", id);
    revalidatePath("/projects", "layout");
  }

  revalidatePath("/catalog");
  revalidatePath(`/catalog/${id}`);
  return { error: null };
}

export async function deleteProduct(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/catalog");
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
    .select("id, model_number, name, type, description, retail_price, cost, sales_price, shipping, image_url, seller_merchant")
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
