import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const maxDuration = 30;

/**
 * POST /api/nda/[token]/dl
 * Public endpoint — token-based auth.
 * Upload driver's license photo (front or back).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const { token } = await params;

    if (!token || token.length < 10) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    // Look up application by token
    const { data: app, error: lookupError } = await supabase
      .from("job_applications")
      .select("id")
      .eq("nda_token", token)
      .single();

    if (lookupError || !app) {
      return NextResponse.json({ error: "Invalid token" }, { status: 404 });
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

    const ext = file.name.split(".").pop() ?? "jpg";
    const storagePath = `applications/${app.id}/dl/dl-${side}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("application-files")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[DL upload public]", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Update the application record
    const column = side === "front" ? "dl_front_url" : "dl_back_url";
    const updatePayload: Record<string, unknown> = {
      [column]: storagePath,
    };

    // Check if both sides are now uploaded
    const { data: current } = await supabase
      .from("job_applications")
      .select("dl_front_url, dl_back_url")
      .eq("id", app.id)
      .single();

    const otherSide = side === "front" ? current?.dl_back_url : current?.dl_front_url;
    if (otherSide) {
      updatePayload.dl_submitted_at = new Date().toISOString();
    }

    await supabase
      .from("job_applications")
      .update(updatePayload)
      .eq("id", app.id);

    return NextResponse.json({ success: true, side });
  } catch (err) {
    console.error("[DL upload public]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
