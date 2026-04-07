import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { isAdminRole } from "@/types";
import type { Profile } from "@/types";

/**
 * GET /api/jobs/applications/[id]/nda/download
 * Returns a signed URL for the NDA PDF. Auth required (admin).
 */
export async function GET(
  _request: NextRequest,
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

    const admin = getAdminSupabase();

    const { data: app, error } = await admin
      .from("job_applications")
      .select("nda_pdf_url")
      .eq("id", id)
      .single();

    if (error || !app?.nda_pdf_url) {
      return NextResponse.json(
        { error: "No signed NDA found" },
        { status: 404 }
      );
    }

    const { data: signedUrl, error: urlError } = await admin.storage
      .from("application-files")
      .createSignedUrl(app.nda_pdf_url, 3600);

    if (urlError || !signedUrl?.signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate download URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signedUrl.signedUrl });
  } catch (err) {
    console.error("[NDA download]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
