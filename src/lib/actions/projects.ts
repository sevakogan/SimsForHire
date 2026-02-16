"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import type { Project, ProjectStatus, FulfillmentType, DiscountType, ClientItem, AcceptanceStatus } from "@/types";

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

export interface ProjectWithClient extends Project {
  client_name: string;
}

export async function getProjectsWithClients(): Promise<ProjectWithClient[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((p) => ({
    ...p,
    client_name: (p.clients as unknown as { name: string })?.name ?? "Unknown",
    clients: undefined,
  })) as ProjectWithClient[];
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

  // Auto-generate next invoice number in YYYY_NN format
  const year = new Date().getFullYear();
  const yearPrefix = `${year}_`;
  const { data: rows } = await supabase
    .from("projects")
    .select("invoice_number")
    .not("invoice_number", "is", null)
    .like("invoice_number", `${yearPrefix}%`)
    .order("invoice_number", { ascending: false })
    .limit(1);

  let nextSeq = 1;
  if (rows && rows.length > 0 && rows[0].invoice_number) {
    const parts = rows[0].invoice_number.split("_");
    const lastSeq = parseInt(parts[1], 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }
  const nextNumber = `${yearPrefix}${String(nextSeq).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      client_id: input.client_id,
      name: input.name,
      status: "draft" as ProjectStatus,
      invoice_number: nextNumber,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  revalidatePath("/projects", "layout");
  revalidatePath("/dashboard");
  return { id: data.id, error: null };
}

export async function updateProject(
  id: string,
  input: {
    name?: string;
    status?: ProjectStatus;
    invoice_number?: string | null;
    invoice_link?: string;
    invoice_link_2?: string;
    date_required?: string | null;
    fulfillment_type?: FulfillmentType;
    notes?: string;
    tax_percent?: number;
    discount_percent?: number;
    discount_type?: DiscountType;
    discount_amount?: number;
  }
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  // If status is being downgraded from accepted/completed, reset all item
  // acceptance statuses so the customer sees a fresh review screen.
  if (input.status && input.status !== "accepted" && input.status !== "completed") {
    const { data: current } = await supabase
      .from("projects")
      .select("status")
      .eq("id", id)
      .single();

    if (current && (current.status === "accepted" || current.status === "completed")) {
      await supabase
        .from("items")
        .update({ acceptance_status: "pending" })
        .eq("project_id", id);
    }
  }

  const { error } = await supabase
    .from("projects")
    .update(input)
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/projects", "layout");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteProject(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects", "layout");
  revalidatePath("/dashboard");
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
  revalidatePath("/projects", "layout");
  return { token, error: null };
}

/**
 * Public function — uses admin client to bypass RLS for share token lookup.
 * Only returns data if a valid share_token exists (prevents enumeration).
 */
export async function getProjectByShareToken(
  token: string
): Promise<{
  project: Project | null;
  client: { name: string; email: string | null; phone: string | null } | null;
}> {
  if (!token) return { project: null, client: null };

  const supabase = getAdminSupabase();

  const { data: project, error } = await supabase
    .from("projects")
    .select("*")
    .eq("share_token", token)
    .single();

  if (error || !project) {
    console.error("[getProjectByShareToken] error:", error?.message, "token:", token);
    return { project: null, client: null };
  }

  const { data: client } = await supabase
    .from("clients")
    .select("name, email, phone")
    .eq("id", project.client_id)
    .single();

  return {
    project: project as Project,
    client: client
      ? { name: client.name, email: client.email ?? null, phone: client.phone ?? null }
      : null,
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
    "id, project_id, item_number, item_type, category, description, item_link, retail_price, retail_shipping, discount_percent, price_sold_for, quantity, image_url, notes, model_number, seller_merchant, acceptance_status, client_note, created_at, updated_at";

  const { data, error } = await supabase
    .from("items")
    .select(CLIENT_SAFE_COLUMNS)
    .eq("project_id", projectId)
    .order("item_number", { ascending: true });

  if (error) {
    console.error("[getClientSafeItemsByProjectId] error:", error.message, "projectId:", projectId);
    return [];
  }
  return (data ?? []) as ClientItem[];
}

/**
 * Accept all items for a project via share token.
 * Sets all items to "accepted". Project status is NOT changed —
 * the admin reviews item decisions and promotes the status manually.
 */
export async function acceptAllItemsByShareToken(
  shareToken: string
): Promise<{ error: string | null }> {
  if (!shareToken) return { error: "Invalid token" };

  const supabase = getAdminSupabase();

  // Verify the share token and get the project
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("share_token", shareToken)
    .single();

  if (!project) return { error: "Invalid share link" };

  // Update all items to accepted
  const { error: itemsError } = await supabase
    .from("items")
    .update({ acceptance_status: "accepted" as AcceptanceStatus })
    .eq("project_id", project.id);

  if (itemsError) return { error: itemsError.message };
  revalidatePath("/projects", "layout");
  return { error: null };
}

/**
 * Submit per-item acceptance decisions via share token.
 * Updates each item's acceptance_status. Project status is NOT changed —
 * the admin reviews item decisions and promotes the status manually.
 */
export async function submitItemDecisions(
  shareToken: string,
  decisions: { itemId: string; status: AcceptanceStatus }[]
): Promise<{ error: string | null }> {
  if (!shareToken) return { error: "Invalid token" };

  const supabase = getAdminSupabase();

  // Verify share token
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("share_token", shareToken)
    .single();

  if (!project) return { error: "Invalid share link" };

  // Update each item's acceptance status
  for (const decision of decisions) {
    const { error } = await supabase
      .from("items")
      .update({ acceptance_status: decision.status })
      .eq("id", decision.itemId)
      .eq("project_id", project.id); // Security: ensure item belongs to this project

    if (error) return { error: error.message };
  }

  revalidatePath("/projects", "layout");
  return { error: null };
}

/**
 * Save a client note on an item via share token.
 */
export async function saveClientNote(
  shareToken: string,
  itemId: string,
  note: string | null
): Promise<{ error: string | null }> {
  if (!shareToken) return { error: "Invalid token" };

  const supabase = getAdminSupabase();

  const { data: project } = await supabase
    .from("projects")
    .select("id, status")
    .eq("share_token", shareToken)
    .single();

  if (!project) return { error: "Invalid share link" };
  if (project.status === "accepted" || project.status === "completed") {
    return { error: "This invoice is no longer editable" };
  }

  // When a customer writes/updates a note, reset read status so admin sees it as new
  const { error } = await supabase
    .from("items")
    .update({ client_note: note || null, client_note_read_at: null })
    .eq("id", itemId)
    .eq("project_id", project.id);

  if (error) return { error: error.message };
  revalidatePath("/projects", "layout");
  return { error: null };
}

/**
 * Delete an item from a project via share token.
 * Only allowed when the project is not yet accepted/completed.
 */
export async function deleteItemByShareToken(
  shareToken: string,
  itemId: string
): Promise<{ error: string | null }> {
  if (!shareToken) return { error: "Invalid token" };

  const supabase = getAdminSupabase();

  const { data: project } = await supabase
    .from("projects")
    .select("id, status")
    .eq("share_token", shareToken)
    .single();

  if (!project) return { error: "Invalid share link" };
  if (project.status === "accepted" || project.status === "completed") {
    return { error: "This invoice is no longer editable" };
  }

  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId)
    .eq("project_id", project.id);

  if (error) return { error: error.message };
  revalidatePath("/projects", "layout");
  return { error: null };
}
