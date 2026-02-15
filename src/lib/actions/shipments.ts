"use server";

import { getAdminSupabase } from "@/lib/supabase-admin";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { Shipment, ShipmentStatus } from "@/types";

/**
 * Public — fetches shipments for a share token (no auth required).
 */
export async function getShipmentsByShareToken(
  shareToken: string
): Promise<Shipment[]> {
  const admin = getAdminSupabase();

  // Validate token → get project
  const { data: project, error: projErr } = await admin
    .from("projects")
    .select("id")
    .eq("share_token", shareToken)
    .single();

  if (projErr || !project) return [];

  const { data, error } = await admin
    .from("shipments")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getShipmentsByShareToken]", error.message);
    return [];
  }

  return (data ?? []) as Shipment[];
}

/**
 * Authenticated — fetch shipments for a project (admin/collaborator).
 */
export async function getShipmentsByProjectId(
  projectId: string
): Promise<Shipment[]> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getShipmentsByProjectId]", error.message);
    return [];
  }

  return (data ?? []) as Shipment[];
}

interface CreateShipmentInput {
  projectId: string;
  carrierName: string;
  trackingUrl: string;
  trackingNumber: string;
  status: ShipmentStatus;
  notes?: string;
}

/**
 * Authenticated — create a shipment (admin/collaborator).
 */
export async function createShipment(
  input: CreateShipmentInput
): Promise<{ error: string | null }> {
  if (!input.carrierName.trim()) return { error: "Carrier name is required." };
  if (!input.trackingUrl.trim()) return { error: "Tracking URL is required." };

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("shipments").insert({
    project_id: input.projectId,
    carrier_name: input.carrierName.trim(),
    tracking_url: input.trackingUrl.trim(),
    tracking_number: input.trackingNumber.trim(),
    status: input.status,
    notes: input.notes?.trim() ?? "",
    created_by: user?.id ?? null,
  });

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Authenticated — update a shipment's status or details.
 */
export async function updateShipment(
  id: string,
  updates: Partial<{
    carrierName: string;
    trackingUrl: string;
    trackingNumber: string;
    status: ShipmentStatus;
    notes: string;
  }>
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  const dbUpdates: Record<string, unknown> = {};
  if (updates.carrierName !== undefined) dbUpdates.carrier_name = updates.carrierName.trim();
  if (updates.trackingUrl !== undefined) dbUpdates.tracking_url = updates.trackingUrl.trim();
  if (updates.trackingNumber !== undefined) dbUpdates.tracking_number = updates.trackingNumber.trim();
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes.trim();

  const { error } = await supabase
    .from("shipments")
    .update(dbUpdates)
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Authenticated — delete a shipment.
 */
export async function deleteShipment(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  const { error } = await supabase
    .from("shipments")
    .delete()
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}
