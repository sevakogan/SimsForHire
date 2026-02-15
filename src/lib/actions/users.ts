"use server";

import { getAdminSupabase } from "@/lib/supabase-admin";
import type { Client, Profile, UserRole } from "@/types";

export interface ProfileWithClient extends Profile {
  client_name?: string;
}

export async function getUsers(): Promise<ProfileWithClient[]> {
  // Use admin client to bypass RLS — this is an admin-only function
  const admin = getAdminSupabase();

  const { data, error } = await admin
    .from("profiles")
    .select("*, clients!profiles_client_id_fkey(name)")
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

export async function getClientsAdmin(): Promise<Client[]> {
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Client[];
}

export async function approveUser(
  id: string
): Promise<{ error: string | null }> {
  const admin = getAdminSupabase();
  const { error } = await admin
    .from("profiles")
    .update({ status: "approved" })
    .eq("id", id);
  if (error) return { error: error.message };
  return { error: null };
}

export async function approveAsClient(
  userId: string
): Promise<{ error: string | null }> {
  const admin = getAdminSupabase();

  // Get the user's profile to use their name for the client record
  const { data: profile, error: fetchError } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();

  if (fetchError) return { error: fetchError.message };

  // Create a client record for them
  const { data: client, error: clientError } = await admin
    .from("clients")
    .insert({
      name: profile.full_name ?? profile.email,
      email: profile.email,
      created_by: userId,
    })
    .select("id")
    .single();

  if (clientError) return { error: clientError.message };

  // Update profile: set role to client, status to approved, link to client record
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      role: "client",
      status: "approved",
      client_id: client.id,
    })
    .eq("id", userId);

  if (profileError) return { error: profileError.message };
  return { error: null };
}

export async function approveAsEmployee(
  userId: string
): Promise<{ error: string | null }> {
  const admin = getAdminSupabase();
  const { error } = await admin
    .from("profiles")
    .update({
      role: "collaborator",
      status: "approved",
    })
    .eq("id", userId);

  if (error) return { error: error.message };
  return { error: null };
}

export async function denyUser(
  id: string
): Promise<{ error: string | null }> {
  const admin = getAdminSupabase();
  const { error } = await admin
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
  const admin = getAdminSupabase();
  const { error } = await admin
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
  const admin = getAdminSupabase();
  const { error } = await admin
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
