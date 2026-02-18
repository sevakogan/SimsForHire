"use server";

import { createSupabaseServer } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";

/* ── Types ─────────────────────────────────────────── */

export type NotificationType =
  | "items_accepted"
  | "items_decided"
  | "client_note"
  | "item_deleted"
  | "contact_message"
  | "status_changed"
  | "item_added"
  | "item_updated"
  | "invoice_updated"
  | "project_created"
  | "payment_received"
  | "contract_viewed"
  | "contract_signed";

export interface Notification {
  id: string;
  project_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationWithProject extends Notification {
  projectName: string;
  clientName: string;
}

/* ── Create (uses admin client — called from public share actions) ── */

export async function createNotification(input: {
  projectId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
}): Promise<void> {
  const admin = getAdminSupabase();

  const { error } = await admin.from("notifications").insert({
    project_id: input.projectId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? `/projects/${input.projectId}`,
  });

  if (error) {
    console.error("[createNotification]", error.message);
  }
}

/**
 * Create a notification for a change made by an internal user.
 * Automatically resolves the current user's name from the session.
 */
export async function notifyChange(input: {
  projectId: string;
  type: NotificationType;
  description: string;
}): Promise<void> {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const actorName = profile?.full_name ?? user.email ?? "Someone";

    await createNotification({
      projectId: input.projectId,
      type: input.type,
      title: `${actorName} ${input.description}`,
      link: `/projects/${input.projectId}`,
    });
  } catch (err) {
    console.error("[notifyChange]", err);
  }
}

/* ── Read (uses authenticated client — admin dashboard) ── */

/**
 * Get unread notifications with project/client context for the bell dropdown.
 */
export async function getUnreadNotifications(
  limit = 10
): Promise<NotificationWithProject[]> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("notifications")
    .select("*, projects!inner(name, clients!inner(name))")
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row: Record<string, unknown>) => {
    const project = row.projects as Record<string, unknown> | null;
    const client = project?.clients as Record<string, unknown> | null;
    return {
      id: row.id as string,
      project_id: row.project_id as string,
      type: row.type as NotificationType,
      title: row.title as string,
      body: row.body as string | null,
      link: row.link as string | null,
      read_at: row.read_at as string | null,
      created_at: row.created_at as string,
      projectName: (project?.name as string) ?? "Project",
      clientName: (client?.name as string) ?? "Client",
    };
  });
}

/**
 * Get total count of unread notifications.
 */
export async function getTotalUnreadCount(): Promise<number> {
  const supabase = await createSupabaseServer();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (error) return 0;
  return count ?? 0;
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(
  notificationId: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Mark all unread notifications as read.
 */
export async function markAllNotificationsRead(): Promise<{
  error: string | null;
}> {
  const supabase = await createSupabaseServer();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  if (error) return { error: error.message };
  return { error: null };
}
