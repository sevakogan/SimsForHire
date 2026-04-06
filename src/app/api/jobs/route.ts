import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { isAdminRole } from "@/types";
import { makeUniqueSlug } from "@/lib/jobs/slug";
import type { Profile } from "@/types";
import type { ApiResponse, Job } from "@/lib/jobs/types";

/**
 * GET /api/jobs
 * List all jobs ordered by created_at desc. Auth required (admin).
 */
export async function GET(): Promise<NextResponse<ApiResponse<readonly Job[]>>> {
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

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/jobs]", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: jobs ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[GET /api/jobs]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs
 * Create a new job. Auth required (admin).
 * Body: { title, description?, requirements_input?, tags?, images?, status? }
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<Job>>> {
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
    const { title, description, requirements_input, tags, images, video_url, status } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "title is required" },
        { status: 400 }
      );
    }

    // Generate unique slug — fetch existing slugs first
    const { data: existingRows } = await supabase
      .from("jobs")
      .select("slug");

    const existingSlugs = (existingRows ?? []).map((r) => r.slug);
    const slug = makeUniqueSlug(title.trim(), existingSlugs);

    const insert = {
      title: title.trim(),
      slug,
      description: description ?? null,
      requirements_input: requirements_input ?? null,
      tags: Array.isArray(tags) ? tags : [],
      images: Array.isArray(images) ? images : [],
      video_url: typeof video_url === "string" && video_url.trim() ? video_url.trim() : null,
      status: status === "paused" ? "paused" : "active",
    };

    const { data: job, error } = await supabase
      .from("jobs")
      .insert(insert)
      .select()
      .single();

    if (error) {
      console.error("[POST /api/jobs]", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: job }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[POST /api/jobs]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
