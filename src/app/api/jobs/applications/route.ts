import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { isAdminRole } from "@/types";
import type { Profile } from "@/types";
import type { ApiResponse, JobApplication, ApplicationStatus } from "@/lib/jobs/types";

/**
 * GET /api/jobs/applications
 * List all job applications. Auth required (admin).
 * Query params: jobId (filter by job), status (filter by status).
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<readonly JobApplication[]>>> {
  try {
    const supabase = await createSupabaseServer();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !isAdminRole((profile as Profile).role)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const status = searchParams.get("status") as ApplicationStatus | null;

    // Build query — join with jobs table to get job_title
    let query = supabase
      .from("job_applications")
      .select("*, jobs!inner(title)")
      .order("created_at", { ascending: false });

    if (jobId) {
      query = query.eq("job_id", jobId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[GET /api/jobs/applications]", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Flatten the joined job title into each application row
    const applications: JobApplication[] = (data ?? []).map((row) => {
      const { jobs, ...rest } = row as Record<string, unknown>;
      return {
        ...rest,
        job_title: (jobs as { title: string } | null)?.title ?? undefined,
      } as JobApplication;
    });

    return NextResponse.json({ success: true, data: applications });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[GET /api/jobs/applications]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
