import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

/**
 * GET /api/nda/track?t=<nda_token>
 * Tracking pixel — records email open. Returns 1x1 transparent GIF.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get("t");

  if (token && token.length >= 10) {
    // Fire and forget — don't block the pixel response
    const supabase = getAdminSupabase();

    (async () => {
      try {
        const { data } = await supabase
          .from("job_applications")
          .select("id, nda_email_opened_at, nda_email_open_count")
          .eq("nda_token", token)
          .single();

        if (!data) return;

        const now = new Date().toISOString();
        const currentCount = (data.nda_email_open_count as number) ?? 0;

        const update: Record<string, unknown> = {
          nda_email_open_count: currentCount + 1,
        };

        if (!data.nda_email_opened_at) {
          update.nda_email_opened_at = now;
        }

        await supabase
          .from("job_applications")
          .update(update)
          .eq("id", data.id);
      } catch (err) {
        console.error("[NDA track pixel]", err);
      }
    })();
  }

  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
