"use server";

import { createSupabaseServer } from "@/lib/supabase-server";

export async function updateProfile(
  id: string,
  input: {
    full_name?: string | null;
    avatar_url?: string | null;
    phone?: string | null;
  }
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Users can only update their own profile
  if (user.id !== id) return { error: "Unauthorized" };

  const updates: Record<string, string | null> = {};
  if ("full_name" in input) updates.full_name = input.full_name ?? null;
  if ("avatar_url" in input) updates.avatar_url = input.avatar_url ?? null;
  if ("phone" in input) updates.phone = input.phone ?? null;

  if (Object.keys(updates).length === 0) {
    return { error: "No fields to update" };
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}

/** Update the user's email via Supabase Auth (sends confirmation email) */
export async function updateEmail(
  newEmail: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.auth.updateUser({ email: newEmail });

  if (error) return { error: error.message };
  return { error: null };
}

/** Update the user's password */
export async function updatePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Verify current password by signing in
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email!,
    password: currentPassword,
  });

  if (signInError) return { error: "Current password is incorrect" };

  // Update to new password
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return { error: error.message };
  return { error: null };
}
