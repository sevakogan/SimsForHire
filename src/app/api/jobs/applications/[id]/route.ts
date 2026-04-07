import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { isAdminRole } from "@/types";
import { getSignedUrl } from "@/lib/jobs/storage";
import { APPLICATION_STATUSES } from "@/lib/jobs/types";
import type { Profile } from "@/types";
import type { ApiResponse, JobApplication, ApplicationStatus } from "@/lib/jobs/types";

/**
 * GET /api/jobs/applications/[id]
 * Get a single application with signed URLs for resume and images.
 * Auth required (admin).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<JobApplication & { signed_resume_url?: string; signed_image_urls?: readonly string[] }>>> {
  try {
    const { id } = await params;
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

    const { data, error } = await supabase
      .from("job_applications")
      .select("*, jobs!inner(title)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: error?.message ?? "Application not found" },
        { status: error ? 500 : 404 }
      );
    }

    // Flatten job title
    const { jobs, ...rest } = data as Record<string, unknown>;
    const application = {
      ...rest,
      job_title: (jobs as { title: string } | null)?.title ?? undefined,
    } as JobApplication;

    // Generate signed URLs for private files
    let signed_resume_url: string | undefined;
    if (application.resume_url) {
      try {
        signed_resume_url = await getSignedUrl(application.resume_url);
      } catch (e) {
        console.error("[GET /api/jobs/applications/[id]] resume signed URL:", e);
      }
    }

    let signed_image_urls: string[] = [];
    if (application.images && application.images.length > 0) {
      signed_image_urls = await Promise.all(
        application.images.map(async (path) => {
          try {
            return await getSignedUrl(path);
          } catch {
            return path; // fallback to raw path if signing fails
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...application,
        ...(signed_resume_url ? { signed_resume_url } : {}),
        ...(signed_image_urls.length > 0 ? { signed_image_urls } : {}),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[GET /api/jobs/applications/[id]]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/jobs/applications/[id]
 * Update application status. Auth required (admin).
 * Body: { status }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<JobApplication>>> {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const { status, background_check_url } = body;

    // Build update payload from allowed fields
    const updatePayload: Record<string, unknown> = {};

    if (status !== undefined) {
      if (
        typeof status !== "string" ||
        !(APPLICATION_STATUSES as readonly string[]).includes(status)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `status must be one of: ${APPLICATION_STATUSES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      updatePayload.status = status;
    }

    if (background_check_url !== undefined) {
      if (typeof background_check_url !== "string") {
        return NextResponse.json(
          { success: false, error: "background_check_url must be a string" },
          { status: 400 }
        );
      }
      updatePayload.background_check_url = background_check_url;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data: application, error } = await supabase
      .from("job_applications")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PATCH /api/jobs/applications/[id]]", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: application });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[PATCH /api/jobs/applications/[id]]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
