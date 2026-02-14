"use server";

import { createSupabaseServer } from "@/lib/supabase-server";

export async function updateProfile(
  id: string,
  input: {
    full_name?: string | null;
    avatar_url?: string | null;
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
