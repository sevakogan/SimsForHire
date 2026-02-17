"use server";

import { getAdminSupabase } from "@/lib/supabase-admin";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { Client, Profile, UserRole } from "@/types";

async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export interface ProfileWithClient extends Profile {
  client_name?: string;
  invite_accepted: boolean;
  /** For employee users: IDs of assigned clients */
  assigned_client_ids?: string[];
}

export async function getUsers(): Promise<ProfileWithClient[]> {
  // Use admin client to bypass RLS — this is an admin-only function
  const admin = getAdminSupabase();

  const [profilesResult, authResult, assignmentsResult] = await Promise.all([
    admin
      .from("profiles")
      .select("*, clients!profiles_client_id_fkey(name)")
      .order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin
      .from("employee_client_assignments")
      .select("employee_id, client_id"),
  ]);

  if (profilesResult.error) throw new Error(profilesResult.error.message);

  // Build a set of user IDs that have confirmed their email/invite
  const confirmedIds = new Set<string>();
  if (authResult.data?.users) {
    for (const authUser of authResult.data.users) {
      if (authUser.confirmed_at || authUser.email_confirmed_at) {
        confirmedIds.add(authUser.id);
      }
    }
  }

  // Build a map of employee_id -> client_ids[]
  const assignmentMap = new Map<string, string[]>();
  if (assignmentsResult.data) {
    for (const row of assignmentsResult.data) {
      const existing = assignmentMap.get(row.employee_id) ?? [];
      assignmentMap.set(row.employee_id, [...existing, row.client_id]);
    }
  }

  return (profilesResult.data ?? []).map((row) => {
    const { clients, ...profile } = row as Record<string, unknown>;
    const clientData = clients as { name: string } | null;
    const id = profile.id as string;
    const role = profile.role as string;
    return {
      ...profile,
      client_name: clientData?.name ?? undefined,
      invite_accepted: confirmedIds.has(id),
      assigned_client_ids: role === "employee" ? (assignmentMap.get(id) ?? []) : undefined,
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
      role: "employee",
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
  const currentId = await getCurrentUserId();
  if (currentId === userId) {
    return { error: "You cannot change your own role." };
  }

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
  const currentId = await getCurrentUserId();
  if (currentId === userId) {
    return { error: "You cannot delete your own account." };
  }

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

/* ── Employee–Client assignment helpers ─────────────── */

export async function assignClientsToEmployee(
  employeeId: string,
  clientIds: string[]
): Promise<{ error: string | null }> {
  const admin = getAdminSupabase();

  // Remove all existing assignments
  const { error: deleteError } = await admin
    .from("employee_client_assignments")
    .delete()
    .eq("employee_id", employeeId);

  if (deleteError) return { error: deleteError.message };

  // Insert new assignments (if any)
  if (clientIds.length > 0) {
    const rows = clientIds.map((clientId) => ({
      employee_id: employeeId,
      client_id: clientId,
    }));

    const { error: insertError } = await admin
      .from("employee_client_assignments")
      .insert(rows);

    if (insertError) return { error: insertError.message };
  }

  return { error: null };
}

export async function getEmployeeClientIds(
  employeeId: string
): Promise<string[]> {
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from("employee_client_assignments")
    .select("client_id")
    .eq("employee_id", employeeId);

  if (error || !data) return [];
  return data.map((row) => row.client_id);
}
