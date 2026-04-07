import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import type { ApiResponse } from "@/lib/jobs/types";

interface SignNdaBody {
  readonly signatureName: string;
  readonly signatureDataUrl: string;
  readonly pdfBase64: string;
}

/**
 * POST /api/nda/[token]/sign
 * Public endpoint — no auth required.
 * Signs the NDA for the given token.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse<ApiResponse<{ signedAt: string }>>> {
  try {
    const { token } = await params;

    if (!token || token.length < 10) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as SignNdaBody;

    if (!body.signatureName?.trim()) {
      return NextResponse.json(
        { success: false, error: "Signature name is required" },
        { status: 400 }
      );
    }

    if (!body.signatureDataUrl) {
      return NextResponse.json(
        { success: false, error: "Signature is required" },
        { status: 400 }
      );
    }

    if (!body.pdfBase64) {
      return NextResponse.json(
        { success: false, error: "PDF data is required" },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    // Look up the application by token
    const { data: application, error: lookupError } = await supabase
      .from("job_applications")
      .select("id, nda_signed_at")
      .eq("nda_token", token)
      .single();

    if (lookupError || !application) {
      return NextResponse.json(
        { success: false, error: "NDA link not found or expired" },
        { status: 404 }
      );
    }

    if (application.nda_signed_at) {
      return NextResponse.json(
        { success: false, error: "This NDA has already been signed" },
        { status: 409 }
      );
    }

    // Upload the signed PDF to storage (private bucket)
    const pdfBuffer = Buffer.from(body.pdfBase64, "base64");
    const pdfPath = `applications/${application.id}/nda/signed-nda.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("application-files")
      .upload(pdfPath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("[POST /api/nda/sign] Upload error:", uploadError);
      return NextResponse.json(
        { success: false, error: "Failed to save signed NDA" },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();

    // Update the application record with storage path (not public URL — it's a private bucket)
    const { error: updateError } = await supabase
      .from("job_applications")
      .update({
        nda_signed_at: now,
        nda_signature_data: body.signatureDataUrl,
        nda_pdf_url: pdfPath,
      })
      .eq("id", application.id);

    if (updateError) {
      console.error("[POST /api/nda/sign] Update error:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to record NDA signature" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { signedAt: now },
    });
  } catch (err) {
    console.error("[POST /api/nda/[token]/sign] Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
