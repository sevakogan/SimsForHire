"use server";

import { createSupabaseServer } from "@/lib/supabase-server";

export async function updateProfile(
  id: string,
  input: {
    full_name?: string | null;
  }
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Users can only update their own profile
  if (user.id !== id) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: input.full_name ?? null })
    .eq("id", id);

  if (error) return { error: error.message };
  return { error: null };
}
