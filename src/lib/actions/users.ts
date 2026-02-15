"use server";

import { createSupabaseServer } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";
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

export async function inviteUser(
  email: string,
  fullName: string,
  role: UserRole
): Promise<{ error: string | null }> {
  const admin = getAdminSupabase();

  // Invite user via Supabase Auth (sends magic link email)
  const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    {
      data: { full_name: fullName },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://simsforhire.com"}/auth/callback`,
    }
  );

  if (inviteError) return { error: inviteError.message };

  // Update the profile that was auto-created by the trigger
  if (data?.user) {
    const { error: profileError } = await admin
      .from("profiles")
      .update({
        full_name: fullName,
        role,
        status: "approved",
      })
      .eq("id", data.user.id);

    if (profileError) return { error: profileError.message };
  }

  return { error: null };
}

export async function deleteUser(
  userId: string
): Promise<{ error: string | null }> {
  const admin = getAdminSupabase();

  // Delete from profiles first (cascade may handle this, but be explicit)
  const { error: profileError } = await admin
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileError) return { error: profileError.message };

  // Delete from auth
  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) return { error: authError.message };

  return { error: null };
}
