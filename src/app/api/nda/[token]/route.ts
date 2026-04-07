import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import type { ApiResponse } from "@/lib/jobs/types";

interface NdaPublicData {
  readonly full_name: string;
  readonly job_title: string;
  readonly nda_signed_at: string | null;
}

/**
 * GET /api/nda/[token]
 * Public endpoint — no auth required.
 * Looks up an application by its nda_token and returns non-sensitive data
 * needed for the signing page.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse<ApiResponse<NdaPublicData>>> {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    const { data, error } = await supabase
      .from("job_applications")
      .select("full_name, nda_signed_at, jobs(title)")
      .eq("nda_token", token)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired NDA link" },
        { status: 404 }
      );
    }

    const row = data as unknown as Record<string, unknown>;
    const jobs = row.jobs as { title: string } | { title: string }[] | null;
    const jobTitle = Array.isArray(jobs) ? jobs[0]?.title : jobs?.title;

    return NextResponse.json({
      success: true,
      data: {
        full_name: row.full_name as string,
        job_title: jobTitle ?? "Unknown Position",
        nda_signed_at: (row.nda_signed_at as string | null) ?? null,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("[GET /api/nda/[token]]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
