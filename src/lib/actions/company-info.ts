"use server";

import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export interface CompanyInfo {
  id: string;
  name: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  ein: string;
  logo_url: string | null;
  logo_scale: number;
  updated_at: string;
}

/** Service-role client for public reads (share pages) */
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const FALLBACK: CompanyInfo = {
  id: "",
  name: "SimsForHire",
  tagline: "Your trusted partner for sourcing quality products at the best prices.",
  phone: "(555) 123-4567",
  email: "info@simsforhire.com",
  address: "123 Main Street, Suite 100\nAnytown, USA 12345",
  ein: "",
  logo_url: "/logo.png",
  logo_scale: 100,
  updated_at: "",
};

/**
 * Fetch company info from DB. Uses service client so it works
 * on both authenticated (dashboard) and unauthenticated (share) pages.
 * Falls back to hardcoded values if table is empty.
 */
export async function getCompanyInfo(): Promise<CompanyInfo> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("company_info")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) return FALLBACK;
  return data as CompanyInfo;
}

/**
 * Update company info (admin only).
 * Upserts the single row — if no row exists, creates one.
 */
export async function updateCompanyInfo(
  updates: Partial<Omit<CompanyInfo, "id" | "updated_at">>
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "collaborator"].includes(profile.role)) {
    return { error: "Not authorized" };
  }

  // Get existing row ID (or create new)
  const serviceClient = getServiceClient();
  const { data: existing } = await serviceClient
    .from("company_info")
    .select("id")
    .limit(1)
    .single();

  if (existing) {
    const { error } = await serviceClient
      .from("company_info")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await serviceClient
      .from("company_info")
      .insert({ ...updates, updated_at: new Date().toISOString() });

    if (error) return { error: error.message };
  }

  revalidatePath("/company");
  revalidatePath("/share", "layout");
  return { error: null };
}
