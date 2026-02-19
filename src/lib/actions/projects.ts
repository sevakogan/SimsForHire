"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { createNotification, notifyChange } from "@/lib/actions/notifications";
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
  creator_name: string | null;
  creator_avatar: string | null;
}

export async function getProjectsWithClients(): Promise<ProjectWithClient[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // Batch-fetch creator profiles for all projects with a created_by
  const creatorIds = [...new Set(
    (data ?? []).map((p) => p.created_by).filter(Boolean) as string[]
  )];
  const creatorMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", creatorIds);
    for (const p of profiles ?? []) {
      creatorMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
    }
  }

  return (data ?? []).map((p) => {
    const clientData = p.clients as unknown as { name: string } | null;
    const creator = p.created_by ? creatorMap.get(p.created_by) : null;
    return {
      ...p,
      client_name: clientData?.name ?? "Unknown",
      creator_name: creator?.full_name ?? null,
      creator_avatar: creator?.avatar_url ?? null,
      clients: undefined,
    };
  }) as ProjectWithClient[];
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

  // Notify: project created
  notifyChange({
    projectId: data.id,
    type: "project_created",
    description: `created project "${input.name}"`,
  });

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
    shipping_address?: string | null;
  }
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  // Block ALL edits (except notes) when contract is signed
  const hasNonNoteChanges = Object.keys(input).some((k) => k !== "notes");
  if (hasNonNoteChanges) {
    const { data: proj } = await supabase
      .from("projects")
      .select("contract_signed_at")
      .eq("id", id)
      .single();
    if (proj?.contract_signed_at) {
      return { error: "Invoice is locked — the purchase agreement has been signed" };
    }
  }

  // If status is being downgraded from accepted+ to pre-accepted, reset all
  // item acceptance statuses so the customer sees a fresh review screen.
  const POST_ACCEPTANCE: string[] = ["accepted", "paid", "preparing", "shipped", "received", "completed"];
  const PRE_ACCEPTANCE: string[] = ["draft", "quote", "submitted"];
  if (input.status && PRE_ACCEPTANCE.includes(input.status)) {
    const { data: current } = await supabase
      .from("projects")
      .select("status")
      .eq("id", id)
      .single();

    if (current && POST_ACCEPTANCE.includes(current.status)) {
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

  // Notify on status change
  if (input.status) {
    notifyChange({
      projectId: id,
      type: "status_changed",
      description: `changed status to "${input.status}"`,
    });
  }

  revalidatePath("/projects", "layout");
  revalidatePath("/dashboard");
  return { error: null };
}

/** Statuses that indicate a project has financial activity and should not be hard-deleted. */
const PROTECTED_STATUSES: ProjectStatus[] = [
  "paid", "preparing", "shipped", "received", "completed", "archived",
];

export async function deleteProject(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  // Block hard-delete for projects that have reached "paid" or beyond
  const { data: proj } = await supabase
    .from("projects")
    .select("status")
    .eq("id", id)
    .single();

  if (proj && PROTECTED_STATUSES.includes(proj.status as ProjectStatus)) {
    return { error: "This project has financial history and cannot be deleted. Use archive instead." };
  }

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects", "layout");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function archiveProject(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  const { error } = await supabase
    .from("projects")
    .update({ status: "archived" })
    .eq("id", id);

  if (error) return { error: error.message };

  notifyChange({
    projectId: id,
    type: "status_changed",
    description: 'archived project',
  });

  revalidatePath("/projects", "layout");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function unarchiveProject(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  const { error } = await supabase
    .from("projects")
    .update({ status: "completed" })
    .eq("id", id);

  if (error) return { error: error.message };

  notifyChange({
    projectId: id,
    type: "status_changed",
    description: 'unarchived project (restored to completed)',
  });

  revalidatePath("/projects", "layout");
  revalidatePath("/dashboard");
  return { error: null };
}

/**
 * Duplicate a project and all its items.
 * The copy starts as "draft" with a new invoice number and "(Copy)" suffix.
 */
export async function duplicateProject(
  id: string
): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { id: null, error: "Not authenticated" };

  // Fetch the original project
  const { data: original, error: fetchErr } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !original) return { id: null, error: fetchErr?.message ?? "Project not found" };

  // Auto-generate next invoice number
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

  // Create the new project
  const { data: newProject, error: insertErr } = await supabase
    .from("projects")
    .insert({
      client_id: original.client_id,
      name: `${original.name} (Copy)`,
      status: "draft" as ProjectStatus,
      invoice_number: nextNumber,
      fulfillment_type: original.fulfillment_type,
      notes: original.notes,
      tax_percent: original.tax_percent,
      discount_percent: original.discount_percent,
      discount_type: original.discount_type,
      discount_amount: original.discount_amount,
      date_required: original.date_required,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertErr || !newProject) return { id: null, error: insertErr?.message ?? "Failed to create copy" };

  // Copy all items from the original project
  const { data: items } = await supabase
    .from("items")
    .select("*")
    .eq("project_id", id)
    .order("item_number", { ascending: true });

  if (items && items.length > 0) {
    const copies = items.map((item) => ({
      project_id: newProject.id,
      item_number: item.item_number,
      item_type: item.item_type,
      category: item.category,
      description: item.description,
      item_link: item.item_link,
      retail_price: item.retail_price,
      retail_shipping: item.retail_shipping,
      discount_percent: item.discount_percent,
      my_cost: item.my_cost,
      my_shipping: item.my_shipping,
      price_sold_for: item.price_sold_for,
      quantity: item.quantity,
      image_url: item.image_url,
      notes: item.notes,
      model_number: item.model_number,
      seller_merchant: item.seller_merchant,
      product_id: item.product_id,
      acceptance_status: "pending" as AcceptanceStatus,
    }));

    await supabase.from("items").insert(copies);
  }

  revalidatePath("/projects", "layout");
  revalidatePath("/dashboard");
  return { id: newProject.id, error: null };
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
  client: { name: string; email: string | null; phone: string | null; address: string | null } | null;
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
    .select("name, email, phone, address")
    .eq("id", project.client_id)
    .single();

  return {
    project: project as Project,
    client: client
      ? {
          name: client.name,
          email: client.email ?? null,
          phone: client.phone ?? null,
          address: client.address ?? null,
        }
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

  // Update project status to "accepted" so it stays locked on reload
  const { error: statusError } = await supabase
    .from("projects")
    .update({ status: "accepted" })
    .eq("id", project.id);

  if (statusError) return { error: statusError.message };

  // Notify admin
  await createNotification({
    projectId: project.id,
    type: "items_accepted",
    title: "All items accepted",
    body: "Customer accepted all items on the invoice.",
  });

  revalidatePath("/projects", "layout");
  revalidatePath("/share", "layout");
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

  // Check if ALL items on the project are now accepted
  const { data: allItems } = await supabase
    .from("items")
    .select("acceptance_status")
    .eq("project_id", project.id);

  const allAccepted = allItems && allItems.length > 0 &&
    allItems.every((item) => item.acceptance_status === "accepted");

  // If every item is accepted, promote project status to "accepted"
  if (allAccepted) {
    await supabase
      .from("projects")
      .update({ status: "accepted" })
      .eq("id", project.id);
  }

  // Notify admin with summary
  const accepted = decisions.filter((d) => d.status === "accepted").length;
  const rejected = decisions.filter((d) => d.status === "rejected").length;
  await createNotification({
    projectId: project.id,
    type: "items_decided",
    title: allAccepted ? "All items accepted" : "Items reviewed by customer",
    body: allAccepted
      ? "Customer accepted all items on the invoice."
      : `${accepted} accepted, ${rejected} rejected out of ${decisions.length} items.`,
  });

  revalidatePath("/projects", "layout");
  revalidatePath("/share", "layout");
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
  if (["accepted", "paid", "preparing", "shipped", "received", "completed", "archived"].includes(project.status)) {
    return { error: "This invoice is no longer editable" };
  }

  // When a customer writes/updates a note, reset read status so admin sees it as new
  const { error } = await supabase
    .from("items")
    .update({ client_note: note || null, client_note_read_at: null })
    .eq("id", itemId)
    .eq("project_id", project.id);

  if (error) return { error: error.message };

  // Notify admin (only for non-empty notes)
  if (note && note.trim()) {
    await createNotification({
      projectId: project.id,
      type: "client_note",
      title: "New client note",
      body: note.trim().length > 120 ? note.trim().slice(0, 120) + "…" : note.trim(),
    });
  }

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
  if (["accepted", "paid", "preparing", "shipped", "received", "completed", "archived"].includes(project.status)) {
    return { error: "This invoice is no longer editable" };
  }

  // Fetch item description before deleting for the notification
  const { data: item } = await supabase
    .from("items")
    .select("description")
    .eq("id", itemId)
    .eq("project_id", project.id)
    .single();

  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId)
    .eq("project_id", project.id);

  if (error) return { error: error.message };

  // Notify admin
  await createNotification({
    projectId: project.id,
    type: "item_deleted",
    title: "Item removed by customer",
    body: item?.description ? `"${item.description}" was deleted.` : "An item was deleted from the invoice.",
  });

  revalidatePath("/projects", "layout");
  return { error: null };
}

/**
 * Mark a contract as viewed via share token.
 * Idempotent — only sets the timestamp and fires notification on first view.
 */
export async function markContractViewed(
  shareToken: string
): Promise<{ error: string | null }> {
  if (!shareToken) return { error: "Invalid token" };

  const supabase = getAdminSupabase();

  const { data: project } = await supabase
    .from("projects")
    .select("id, contract_viewed_at")
    .eq("share_token", shareToken)
    .single();

  if (!project) return { error: "Invalid share link" };

  // Idempotent — already viewed, skip
  if (project.contract_viewed_at) return { error: null };

  const { error } = await supabase
    .from("projects")
    .update({ contract_viewed_at: new Date().toISOString() })
    .eq("id", project.id);

  if (error) return { error: error.message };

  await createNotification({
    projectId: project.id,
    type: "contract_viewed",
    title: "Contract viewed by customer",
    body: "The customer opened the contract page.",
  });

  revalidatePath("/projects", "layout");
  revalidatePath("/share", "layout");
  return { error: null };
}

/**
 * Sign the contract via share token.
 * Records the signer name and timestamp. Cannot be undone by customer.
 */
export async function signContract(
  shareToken: string,
  signerName: string
): Promise<{ error: string | null }> {
  if (!shareToken) return { error: "Invalid token" };
  const trimmedName = signerName.trim();
  if (!trimmedName) return { error: "Signer name is required" };

  const supabase = getAdminSupabase();

  const { data: project } = await supabase
    .from("projects")
    .select("id, contract_signed_at")
    .eq("share_token", shareToken)
    .single();

  if (!project) return { error: "Invalid share link" };

  if (project.contract_signed_at) {
    return { error: "Contract has already been signed" };
  }

  const { error } = await supabase
    .from("projects")
    .update({
      contract_signed_at: new Date().toISOString(),
      contract_signed_by: trimmedName,
    })
    .eq("id", project.id);

  if (error) return { error: error.message };

  await createNotification({
    projectId: project.id,
    type: "contract_signed",
    title: `Contract signed by ${trimmedName}`,
    body: "The customer has signed the contract.",
  });

  revalidatePath("/projects", "layout");
  revalidatePath("/share", "layout");
  return { error: null };
}
