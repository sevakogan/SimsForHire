import { NextRequest, NextResponse } from "next/server";
import { signNda } from "@/lib/actions/jobs";
import type { ApiResponse } from "@/lib/jobs/types";

/**
 * POST /api/jobs/applications/[id]/nda/sign
 * Public endpoint — token-based auth (no session required).
 * Body: { token, signatureName, signatureDataUrl, pdfBase64 }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ signed: boolean }>>> {
  try {
    await params; // consume params to avoid Next.js warning

    const body = await request.json();
    const { token, signatureName, signatureDataUrl, pdfBase64 } = body;

    if (!token || !signatureName || !signatureDataUrl || !pdfBase64) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: token, signatureName, signatureDataUrl, pdfBase64",
        },
        { status: 400 }
      );
    }

    const result = await signNda(token, signatureName, signatureDataUrl, pdfBase64);

    if (result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data: { signed: true } });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("[POST /api/jobs/applications/[id]/nda/sign]", message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
