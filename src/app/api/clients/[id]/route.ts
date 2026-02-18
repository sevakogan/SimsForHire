import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { isAdminRole } from "@/types";
import type { Profile } from "@/types";

/**
 * PATCH /api/clients/[id]
 *
 * Lightweight endpoint for inline-editing client fields from the project
 * detail page. Uses a plain fetch so it's immune to React's
 * startTransition / AbortController issues.
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

  // Parse body — accept only safe client fields
  const body = await request.json();

  const ALLOWED_FIELDS: Record<string, "string" | "nullable_string"> = {
    name: "string",
    email: "nullable_string",
    phone: "nullable_string",
    address: "nullable_string",
  };

  const update: Record<string, string | null> = {};

  for (const [key, value] of Object.entries(body)) {
    const type = ALLOWED_FIELDS[key];
    if (!type) continue;

    if (type === "nullable_string") {
      update[key] = value === null || value === "" ? null : String(value);
    } else {
      // "string" — required field, skip if empty
      const str = String(value).trim();
      if (str) update[key] = str;
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const { error } = await supabase
    .from("clients")
    .update(update)
    .eq("id", id);

  if (error) {
    console.error("[PATCH /api/clients/[id]]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
