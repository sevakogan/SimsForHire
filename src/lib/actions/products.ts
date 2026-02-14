"use server";

import { createSupabaseServer } from "@/lib/supabase-server";
import type { Product, ClientProduct, ProductSearchResult } from "@/types";

const CLIENT_SAFE_COLUMNS =
  "id, model_number, name, type, description, retail_price, sales_price, shipping, image_url, notes, manufacturer_website, created_at, updated_at";

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
  image_url?: string;
  notes?: string;
  manufacturer_website?: string;
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { id: null, error: "Not authenticated" };

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
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
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
    image_url: string;
    notes: string;
    manufacturer_website: string;
  }>
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("products")
    .update(input)
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteProduct(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) return { error: error.message };
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
    .select("id, model_number, name, type, description, retail_price, cost, sales_price, shipping, image_url")
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
