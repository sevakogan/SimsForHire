"use server";

import { createSupabaseServer } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import type { Project, ProjectStatus, FulfillmentType, ClientItem } from "@/types";

export async function getProjects(filters?: {
  clientId?: string;
}): Promise<Project[]> {
  const supabase = await createSupabaseServer();
  let query = supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.clientId) {
    query = query.eq("client_id", filters.clientId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Project[];
}

export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Project;
}

export async function createProject(input: {
  client_id: string;
  name: string;
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { id: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      client_id: input.client_id,
      name: input.name,
      status: "draft" as ProjectStatus,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data.id, error: null };
}

export async function updateProject(
  id: string,
  input: {
    name?: string;
    status?: ProjectStatus;
    invoice_link?: string;
    invoice_link_2?: string;
    date_required?: string | null;
    fulfillment_type?: FulfillmentType;
  }
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  const { error } = await supabase
    .from("projects")
    .update(input)
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}

export async function deleteProject(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function generateShareToken(
  projectId: string
): Promise<{ token: string | null; error: string | null }> {
  const supabase = await createSupabaseServer();

  // Check if token already exists
  const { data: existing } = await supabase
    .from("projects")
    .select("share_token")
    .eq("id", projectId)
    .single();

  if (existing?.share_token) {
    return { token: existing.share_token, error: null };
  }

  // Generate a new token
  const token = crypto.randomUUID();
  const { error } = await supabase
    .from("projects")
    .update({ share_token: token })
    .eq("id", projectId);

  if (error) return { token: null, error: error.message };
  return { token, error: null };
}

/**
 * Public function — uses admin client to bypass RLS for share token lookup.
 * Only returns data if a valid share_token exists (prevents enumeration).
 */
export async function getProjectByShareToken(
  token: string
): Promise<{ project: Project | null; client: { name: string } | null }> {
  if (!token) return { project: null, client: null };

  const supabase = getAdminSupabase();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("share_token", token)
    .single();

  if (error || !project) return { project: null, client: null };

  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", project.client_id)
    .single();

  return {
    project: project as Project,
    client: client ? { name: client.name } : null,
  };
}

/**
 * Public function — uses admin client to bypass RLS for share page.
 * Only fetches client-safe columns (no my_cost, my_shipping).
 */
export async function getClientSafeItemsByProjectId(
  projectId: string
): Promise<ClientItem[]> {
  const supabase = getAdminSupabase();

  const CLIENT_SAFE_COLUMNS =
    "id, project_id, item_number, item_type, description, item_link, retail_price, retail_shipping, discount_percent, price_sold_for, image_url, notes, model_number, product_id, seller_merchant, created_at, updated_at";

  const { data, error } = await supabase
    .from("items")
    .select(CLIENT_SAFE_COLUMNS)
    .eq("project_id", projectId)
    .order("item_number", { ascending: true });

  if (error) return [];
  return (data ?? []) as ClientItem[];
}
