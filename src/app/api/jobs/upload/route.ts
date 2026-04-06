import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { isAdminRole } from "@/types";
import { uploadJobImage } from "@/lib/jobs/storage";
import type { Profile } from "@/types";
import type { ApiResponse } from "@/lib/jobs/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * POST /api/jobs/upload
 * Upload an image to Supabase Storage. Auth required (admin).
 * Accepts FormData with 'file' and 'jobId' fields.
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ url: string; filename: string }>>> {
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

    const formData = await request.formData();
    const file = formData.get("file");
    const jobId = formData.get("jobId");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "file is required" },
        { status: 400 }
      );
    }

    if (!jobId || typeof jobId !== "string" || !jobId.trim()) {
      return NextResponse.json(
        { success: false, error: "jobId is required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only JPEG, PNG, WebP, and GIF images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File must be under 10 MB" },
        { status: 400 }
      );
    }

    const url = await uploadJobImage(jobId.trim(), file);

    // Extract the filename (storage path) from the public URL
    const bucketPrefix = "/job-images/";
    const idx = url.indexOf(bucketPrefix);
    const filename = idx !== -1
      ? url.slice(idx + bucketPrefix.length)
      : url;

    return NextResponse.json({
      success: true,
      data: { url, filename },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    console.error("[POST /api/jobs/upload]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
