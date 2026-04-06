import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { isAdminRole } from "@/types";
import { generateJobDescription } from "@/lib/jobs/generate-description";
import type { Profile } from "@/types";
import type { ApiResponse } from "@/lib/jobs/types";

/**
 * POST /api/jobs/generate
 * Generate an AI-powered job description. Auth required (admin).
 * Body: { title, requirements? }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ description: string }>>> {
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

    const body = await request.json();
    const { title, requirements } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "title is required" },
        { status: 400 }
      );
    }

    const description = await generateJobDescription(
      title.trim(),
      typeof requirements === "string" ? requirements : null
    );

    return NextResponse.json({
      success: true,
      data: { description },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    console.error("[POST /api/jobs/generate]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
