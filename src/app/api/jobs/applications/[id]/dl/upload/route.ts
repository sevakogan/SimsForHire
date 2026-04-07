import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { isAdminRole } from "@/types";
import type { Profile } from "@/types";

export const maxDuration = 30;

/**
 * POST /api/jobs/applications/[id]/dl/upload
 * Upload a driver's license photo (front or back). Auth required (admin).
 * Accepts FormData with 'file' and 'side' (front|back) fields.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServer();

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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const side = formData.get("side") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (side !== "front" && side !== "back") {
      return NextResponse.json(
        { error: "Side must be 'front' or 'back'" },
        { status: 400 }
      );
    }

    const admin = getAdminSupabase();

    // Upload to private bucket
    const ext = file.name.split(".").pop() ?? "jpg";
    const storagePath = `applications/${id}/dl/dl-${side}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await admin.storage
      .from("application-files")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[DL upload]", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get signed URL for immediate preview
    const { data: signedUrl } = await admin.storage
      .from("application-files")
      .createSignedUrl(storagePath, 3600);

    // Update the application record
    const column = side === "front" ? "dl_front_url" : "dl_back_url";
    const updatePayload: Record<string, unknown> = {
      [column]: storagePath,
    };

    // Check if both sides are now uploaded
    const { data: app } = await admin
      .from("job_applications")
      .select("dl_front_url, dl_back_url")
      .eq("id", id)
      .single();

    const otherSide = side === "front" ? app?.dl_back_url : app?.dl_front_url;
    if (otherSide) {
      updatePayload.dl_submitted_at = new Date().toISOString();
    }

    await admin
      .from("job_applications")
      .update(updatePayload)
      .eq("id", id);

    return NextResponse.json({
      success: true,
      url: signedUrl?.signedUrl ?? storagePath,
      side,
    });
  } catch (err) {
    console.error("[DL upload]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
