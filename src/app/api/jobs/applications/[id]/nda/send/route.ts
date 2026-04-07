import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { isAdminRole } from "@/types";
import { sendNda } from "@/lib/actions/jobs";
import type { Profile } from "@/types";
import type { ApiResponse } from "@/lib/jobs/types";

/**
 * POST /api/jobs/applications/[id]/nda/send
 * Send NDA email to applicant. Auth required (admin).
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ sent: boolean }>>> {
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

    const result = await sendNda(id);

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: { sent: true } });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("[POST /api/jobs/applications/[id]/nda/send]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
