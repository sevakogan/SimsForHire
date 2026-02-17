"use server";

import { createClient } from "@supabase/supabase-js";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { Payment, PaymentStatus } from "@/types";

/** Service-role client for operations from API routes / webhooks */
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Get payments for a project (authenticated — admin dashboard).
 */
export async function getPaymentsByProjectId(
  projectId: string
): Promise<Payment[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Payment[];
}

/**
 * Get payments for a project (public — share pages).
 * Returns only safe fields, no Stripe internal IDs.
 */
export async function getPaymentsByProjectIdPublic(
  projectId: string
): Promise<Pick<Payment, "id" | "amount" | "currency" | "status" | "created_at">[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, amount, currency, status, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as Pick<Payment, "id" | "amount" | "currency" | "status" | "created_at">[];
}

/**
 * Create a payment record (service role — called from API route).
 */
export async function createPaymentRecord(input: {
  projectId: string;
  stripeSessionId: string;
  amount: number;
  currency?: string;
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("payments")
    .insert({
      project_id: input.projectId,
      stripe_session_id: input.stripeSessionId,
      amount: input.amount,
      currency: input.currency ?? "usd",
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data.id, error: null };
}

/**
 * Update payment status by Stripe session ID (service role — called from webhook).
 */
export async function updatePaymentStatus(
  stripeSessionId: string,
  status: PaymentStatus,
  extra?: {
    stripe_payment_intent_id?: string;
    customer_email?: string;
  }
): Promise<{ error: string | null }> {
  const supabase = getServiceClient();

  const updateData: Record<string, unknown> = { status };
  if (extra?.stripe_payment_intent_id) {
    updateData.stripe_payment_intent_id = extra.stripe_payment_intent_id;
  }
  if (extra?.customer_email) {
    updateData.customer_email = extra.customer_email;
  }

  const { error } = await supabase
    .from("payments")
    .update(updateData)
    .eq("stripe_session_id", stripeSessionId);

  if (error) return { error: error.message };
  return { error: null };
}
