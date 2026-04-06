import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { isAdminRole } from "@/types";
import { deleteJobImage } from "@/lib/jobs/storage";
import type { Profile } from "@/types";
import type { ApiResponse, Job, JobImage } from "@/lib/jobs/types";

/**
 * GET /api/jobs/[id]
 * Fetch a single job by ID. Auth required (admin).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Job>>> {
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

    const { data: job, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: job as Job });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[GET /api/jobs/[id]]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/jobs/[id]
 * Update a job by ID. Auth required (admin).
 * Body: partial job fields.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Job>>> {
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

    const ALLOWED_FIELDS = new Set([
      "title",
      "description",
      "requirements_input",
      "tags",
      "images",
      "video_url",
      "status",
    ]);

    const update: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key)) {
        update[key] = value;
      }
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (update.status !== undefined && update.status !== "active" && update.status !== "paused") {
      return NextResponse.json(
        { success: false, error: "status must be 'active' or 'paused'" },
        { status: 400 }
      );
    }

    const { data: job, error } = await supabase
      .from("jobs")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[PUT /api/jobs/[id]]", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: job });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[PUT /api/jobs/[id]]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/[id]
 * Delete a job by ID. Also cleans up storage images. Auth required (admin).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
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

    // Fetch the job first to get image paths for cleanup
    const { data: job } = await supabase
      .from("jobs")
      .select("images")
      .eq("id", id)
      .single();

    // Delete the job row
    const { error } = await supabase.from("jobs").delete().eq("id", id);

    if (error) {
      console.error("[DELETE /api/jobs/[id]]", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Best-effort cleanup of storage images
    if (job?.images && Array.isArray(job.images)) {
      const imageCleanups = (job.images as readonly JobImage[]).map((img) =>
        deleteJobImage(img.filename).catch((e) =>
          console.error("[DELETE /api/jobs/[id]] image cleanup:", e)
        )
      );
      await Promise.all(imageCleanups);
    }

    return NextResponse.json({ success: true, data: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[DELETE /api/jobs/[id]]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
