"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { getSignedUrl } from "@/lib/jobs/storage";
import { sendEmail } from "@/lib/email-sender";
import type { Job, JobApplication, ApplicationStatus } from "@/lib/jobs/types";

export async function getJobs(): Promise<Job[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch jobs:", error.message);
    return [];
  }

  return (data ?? []) as Job[];
}

export async function getApplications(): Promise<JobApplication[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("job_applications")
    .select("*, jobs(title)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch applications:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const { jobs, ...rest } = row as Record<string, unknown> & { jobs?: { title: string } | null };
    return {
      ...rest,
      job_title: jobs?.title ?? "Unknown",
    };
  }) as unknown as JobApplication[];
}

export async function updateJobStatus(
  jobId: string,
  status: Job["status"]
): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("jobs")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", jobId);

  if (error) {
    throw new Error(`Failed to update job status: ${error.message}`);
  }

  revalidatePath("/jobs");
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) {
    throw new Error(`Failed to update application status: ${error.message}`);
  }

  revalidatePath("/jobs");
}

export async function deleteJob(jobId: string): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase.from("jobs").delete().eq("id", jobId);

  if (error) {
    throw new Error(`Failed to delete job: ${error.message}`);
  }

  revalidatePath("/jobs");
}

/**
 * Fetch a single application by ID with signed URLs for resume and images.
 */
export async function getApplicationById(
  id: string
): Promise<(JobApplication & { signed_resume_url?: string; signed_image_urls?: readonly string[] }) | null> {
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("job_applications")
    .select("*, jobs(title)")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Failed to fetch application:", error?.message);
    return null;
  }

  const { jobs, ...rest } = data as Record<string, unknown> & { jobs?: { title: string } | null };
  const application = {
    ...rest,
    job_title: jobs?.title ?? "Unknown",
  } as JobApplication;

  let signed_resume_url: string | undefined;
  if (application.resume_url) {
    try {
      signed_resume_url = await getSignedUrl(application.resume_url);
    } catch (e) {
      console.error("[getApplicationById] resume signed URL:", e);
    }
  }

  let signed_image_urls: string[] = [];
  if (application.images && application.images.length > 0) {
    signed_image_urls = await Promise.all(
      application.images.map(async (path) => {
        try {
          return await getSignedUrl(path);
        } catch {
          return path;
        }
      })
    );
  }

  return {
    ...application,
    ...(signed_resume_url ? { signed_resume_url } : {}),
    ...(signed_image_urls.length > 0 ? { signed_image_urls } : {}),
  };
}

/**
 * Send an NDA email to an applicant. Generates a unique token for signing.
 */
export async function sendNda(
  applicationId: string,
  overrides?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    requireDl?: boolean;
  }
): Promise<{ error: string | null }> {
  try {
    const supabase = getAdminSupabase();

    const { data: application, error: fetchError } = await supabase
      .from("job_applications")
      .select("id, full_name, email, phone, status")
      .eq("id", applicationId)
      .single();

    if (fetchError || !application) {
      return { error: fetchError?.message ?? "Application not found" };
    }

    const row = application as Record<string, unknown>;

    // Resolve final values — prefer overrides if provided
    const hasNameOverride =
      overrides?.firstName !== undefined || overrides?.lastName !== undefined;
    const resolvedName = hasNameOverride
      ? `${(overrides?.firstName ?? "").trim()} ${(overrides?.lastName ?? "").trim()}`.trim()
      : (row.full_name as string);
    const resolvedEmail = overrides?.email?.trim() || (row.email as string);
    const resolvedPhone = overrides?.phone?.trim() || (row.phone as string | null);

    const ndaToken = randomUUID();
    const now = new Date().toISOString();

    const statusesToBump: readonly string[] = ["new", "reviewed", "contacted"];
    const shouldBumpStatus = statusesToBump.includes(row.status as string);

    const updatePayload: Record<string, unknown> = {
      nda_token: ndaToken,
      nda_sent_at: now,
      require_dl: overrides?.requireDl ?? true,
    };

    // Apply corrected info if changed
    if (resolvedName !== row.full_name) {
      updatePayload.full_name = resolvedName;
    }
    if (resolvedEmail !== row.email) {
      updatePayload.email = resolvedEmail;
    }
    if (resolvedPhone !== null && resolvedPhone !== row.phone) {
      updatePayload.phone = resolvedPhone;
    }

    if (shouldBumpStatus) {
      updatePayload.status = "in_process";
    }

    const { error: updateError } = await supabase
      .from("job_applications")
      .update(updatePayload)
      .eq("id", applicationId);

    if (updateError) {
      return { error: `Failed to update application: ${updateError.message}` };
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://admin.simsforhire.com";
    const ndaLink = `${appUrl}/nda/${ndaToken}`;
    const applicantName = resolvedName;

    const bodyHtml = `
      <p style="margin:0 0 16px 0;">
        As part of the onboarding process at <strong>SimsForHire</strong>, we require all team members to review and sign a Non-Disclosure Agreement (NDA).
      </p>
      <p style="margin:0 0 24px 0;">
        Please click the button below to review and sign the agreement:
      </p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">
        <tr>
          <td style="background:#E10600; border-radius:10px; padding:0;">
            <a href="${ndaLink}" style="display:inline-block; padding:14px 28px; font-family:'DM Sans',-apple-system,Arial,sans-serif; font-size:15px; font-weight:500; color:#FFFFFF; text-decoration:none; letter-spacing:-0.2px;">Review & Sign NDA &rarr;</a>
          </td>
        </tr>
      </table>
      <p style="margin:0; font-size:14px; color:#86868B;">
        If you have any questions, reply to this email and we'll be happy to help.
      </p>
      <img src="${appUrl}/api/nda/track?t=${ndaToken}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;" />
    `;

    // Fire email in background — don't block the response
    sendEmail({
      to: resolvedEmail,
      subject: "SimsForHire — Non-Disclosure Agreement",
      bodyHtml,
      leadName: applicantName,
      skipCc: true,
    }).catch((emailErr) => {
      console.error("[sendNda] Email failed:", emailErr instanceof Error ? emailErr.message : emailErr);
    });

    revalidatePath("/jobs");
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send NDA";
    console.error("[sendNda] Unexpected error:", message);
    return { error: message };
  }
}

/**
 * Sign an NDA using the token sent via email.
 * Uploads the signed PDF and records signature data.
 */
export async function signNda(
  token: string,
  signatureName: string,
  signatureDataUrl: string,
  pdfBase64: string
): Promise<{ error: string | null }> {
  try {
    if (!token || !signatureName.trim() || !signatureDataUrl || !pdfBase64) {
      return { error: "All fields are required" };
    }

    const supabase = getAdminSupabase();

    const { data: application, error: fetchError } = await supabase
      .from("job_applications")
      .select("id, full_name, email, nda_signed_at, job_id, jobs(title)")
      .eq("nda_token", token)
      .single();

    if (fetchError || !application) {
      return { error: "Invalid or expired NDA link" };
    }

    const row = application as Record<string, unknown>;

    if (row.nda_signed_at) {
      return { error: "This NDA has already been signed" };
    }

    // Decode base64 PDF and upload to Supabase Storage
    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    const storagePath = `applications/${row.id}/nda/signed-nda.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("application-files")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      return { error: `Failed to upload signed PDF: ${uploadError.message}` };
    }

    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("job_applications")
      .update({
        nda_signed_at: now,
        nda_signature_data: signatureDataUrl,
        nda_pdf_url: storagePath,
      })
      .eq("id", row.id);

    if (updateError) {
      return { error: `Failed to record signature: ${updateError.message}` };
    }

    // Send admin notification
    const applicantName = row.full_name as string;
    const jobTitle =
      (row.jobs as { title: string } | null)?.title ?? "Unknown Position";

    const adminBodyHtml = `
      <p style="margin:0 0 16px 0;">
        <strong>${applicantName}</strong> has signed the Non-Disclosure Agreement for the <strong>${jobTitle}</strong> position.
      </p>
      <p style="margin:0; font-size:14px; color:#86868B;">
        You can view the signed document in the admin dashboard.
      </p>
    `;

    // Fire admin notification in background — don't block the signing response
    sendEmail({
      to: "seva@simsforhire.com",
      subject: `NDA Signed: ${applicantName} — ${jobTitle}`,
      bodyHtml: adminBodyHtml,
    }).catch((emailErr) => {
      console.error("[signNda] admin notification email failed:", emailErr);
    });

    revalidatePath("/jobs");
    return { error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to sign NDA";
    console.error("[signNda]", message);
    return { error: message };
  }
}

/**
 * Update the background check URL for an application.
 */
export async function updateBackgroundCheckUrl(
  applicationId: string,
  url: string
): Promise<{ error: string | null }> {
  try {
    const supabase = getAdminSupabase();

    const { error } = await supabase
      .from("job_applications")
      .update({ background_check_url: url })
      .eq("id", applicationId);

    if (error) {
      return { error: `Failed to update background check URL: ${error.message}` };
    }

    revalidatePath("/jobs");
    return { error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update background check URL";
    console.error("[updateBackgroundCheckUrl]", message);
    return { error: message };
  }
}
