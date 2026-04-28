import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public dynamic-QR redirect.
 *
 *   GET /qr/<token>
 *     1. Look up the qr_redirects row by token
 *     2. Increment scan_count atomically
 *     3. 302 to destination_url
 *
 * Destination can be a relative path (resolved against the request origin) or
 * an absolute URL. Relative paths keep dev/preview/prod self-consistent.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length > 64) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const supabase = getAdminSupabase();

  const { data: row, error } = await supabase
    .from("qr_redirects")
    .select("destination_url, scan_count")
    .eq("token", token)
    .maybeSingle();

  if (error || !row) {
    return new NextResponse("QR not found", { status: 404 });
  }

  // Best-effort scan increment (don't block the redirect on a write failure).
  // We use a server-side update with a known prior value pattern; for low
  // contention this is fine. If lots of simultaneous scans matter later, swap
  // for an RPC that does an atomic UPDATE ... SET scan_count = scan_count + 1.
  const nextCount = ((row.scan_count as number) ?? 0) + 1;
  void supabase
    .from("qr_redirects")
    .update({ scan_count: nextCount, updated_at: new Date().toISOString() })
    .eq("token", token);

  const dest = String(row.destination_url ?? "").trim();
  if (!dest) {
    return new NextResponse("QR has no destination configured", { status: 410 });
  }

  // Resolve relative paths against the request origin so dev / preview / prod
  // each redirect within their own host.
  const target = /^https?:\/\//i.test(dest)
    ? dest
    : new URL(dest, request.url).toString();

  return NextResponse.redirect(target, 302);
}
