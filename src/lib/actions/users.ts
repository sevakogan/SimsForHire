"use server";

import { createSupabaseServer } from "@/lib/supabase-server";
import type { Profile, UserRole } from "@/types";

export interface ProfileWithClient extends Profile {
  client_name?: string;
}

export async function getUsers(): Promise<ProfileWithClient[]> {
  const supabase = await createSupabaseServer();

  const { data, error } = await supabase
    .from("profiles")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const { clients, ...profile } = row as Record<string, unknown>;
    const clientData = clients as { name: string } | null;
    return {
      ...profile,
      client_name: clientData?.name ?? undefined,
    } as ProfileWithClient;
  });
}

export async function approveUser(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("profiles")
    .update({ status: "approved" })
    .eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function denyUser(
  id: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("profiles")
    .update({ status: "denied" })
    .eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function assignClientToUser(
  userId: string,
  clientId: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("profiles")
    .update({ client_id: clientId })
    .eq("id", userId);
  if (error) return { error: error.message };
  return { error: null };
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) return { error: error.message };
  return { error: null };
}
