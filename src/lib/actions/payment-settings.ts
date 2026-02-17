"use server";

import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import type { PaymentSettings, PaymentMethod } from "@/types";

/** Service-role client for reads (share pages need this too) */
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const FALLBACK: PaymentSettings = {
  id: "",
  stripe_publishable_key: "",
  stripe_secret_key: "",
  stripe_webhook_secret: "",
  payments_enabled: false,
  accepted_payment_methods: ["card"],
  updated_at: "",
};

/**
 * Fetch full payment settings (server-side only — contains secret keys).
 * Uses service client so it works on both dashboard and share pages.
 */
export async function getPaymentSettings(): Promise<PaymentSettings> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("payment_settings")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) return FALLBACK;
  return data as PaymentSettings;
}

/**
 * Fetch public-safe payment settings (never exposes secret keys).
 * Safe to call from share pages / client components.
 */
export async function getPaymentSettingsPublic(): Promise<{
  payments_enabled: boolean;
  accepted_payment_methods: PaymentMethod[];
}> {
  const settings = await getPaymentSettings();
  return {
    payments_enabled: settings.payments_enabled,
    accepted_payment_methods: settings.accepted_payment_methods,
  };
}

/**
 * Update payment settings (admin only).
 * Upserts the single row — if no row exists, creates one.
 */
export async function updatePaymentSettings(
  updates: Partial<Omit<PaymentSettings, "id" | "updated_at">>
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

  const serviceClient = getServiceClient();

  // Get existing row ID (or create new)
  const { data: existing } = await serviceClient
    .from("payment_settings")
    .select("id")
    .limit(1)
    .single();

  if (existing) {
    const { error } = await serviceClient
      .from("payment_settings")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (error) return { error: error.message };
  } else {
    const { error } = await serviceClient
      .from("payment_settings")
      .insert({ ...updates, updated_at: new Date().toISOString() });

    if (error) return { error: error.message };
  }

  revalidatePath("/payment-setup");
  revalidatePath("/share", "layout");
  return { error: null };
}
