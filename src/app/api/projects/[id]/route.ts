import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { isAdminRole } from "@/types";
import type { Profile, DiscountType, FulfillmentType } from "@/types";

/**
 * PATCH /api/projects/[id]
 *
 * Lightweight endpoint for persisting individual invoice-card field edits.
 * Uses a plain fetch (not a server action) so it is immune to React's
 * startTransition / AbortController behaviour that was silently aborting
 * server-action POSTs on this page.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createSupabaseServer();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !isAdminRole((profile as Profile).role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Parse body — accept only the invoice-card fields
  const body = await request.json();

  const ALLOWED_FIELDS: Record<string, "string" | "number" | "nullable_string"> = {
    invoice_number: "nullable_string",
    date_required: "nullable_string",
    fulfillment_type: "string",
    notes: "string",
    tax_percent: "number",
    discount_percent: "number",
    discount_type: "string",
    discount_amount: "number",
  };

  const update: Record<string, string | number | null> = {};

  for (const [key, value] of Object.entries(body)) {
    const type = ALLOWED_FIELDS[key];
    if (!type) continue; // ignore unknown fields

    if (type === "number") {
      update[key] = typeof value === "number" ? value : parseFloat(value as string) || 0;
    } else if (type === "nullable_string") {
      update[key] = value === null || value === "" ? null : String(value);
    } else {
      update[key] = String(value);
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", id);

  if (error) {
    console.error("[PATCH /api/projects/[id]]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
