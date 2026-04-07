import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { getSignedUrl } from "@/lib/jobs/storage";
import { ApplicantDetail } from "@/components/jobs/applicant-detail";
import type { JobApplication } from "@/lib/jobs/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ApplicantDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = getAdminSupabase();

  const { data, error } = await supabase
    .from("job_applications")
    .select("*, jobs(title)")
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const { jobs, ...rest } = data as Record<string, unknown> & {
    jobs?: { title: string } | null;
  };

  const application: JobApplication = {
    ...rest,
    job_title: jobs?.title ?? "Unknown",
  } as unknown as JobApplication;

  // Generate signed URLs for private files
  let resumeSignedUrl: string | null = null;
  if (application.resume_url) {
    try {
      resumeSignedUrl = await getSignedUrl(application.resume_url);
    } catch {
      console.error("Failed to generate signed URL for resume");
    }
  }

  const imageSignedUrls: string[] = [];
  for (const imagePath of application.images) {
    try {
      const url = await getSignedUrl(imagePath);
      imageSignedUrls.push(url);
    } catch {
      console.error("Failed to generate signed URL for image:", imagePath);
    }
  }

  // Generate signed URLs for DL images
  let dlFrontSignedUrl: string | null = null;
  let dlBackSignedUrl: string | null = null;
  if (application.dl_front_url) {
    try { dlFrontSignedUrl = await getSignedUrl(application.dl_front_url); } catch { /* */ }
  }
  if (application.dl_back_url) {
    try { dlBackSignedUrl = await getSignedUrl(application.dl_back_url); } catch { /* */ }
  }

  // Merge signed DL URLs into application for the client
  const appWithDlUrls = {
    ...application,
    dl_front_url: dlFrontSignedUrl ?? application.dl_front_url,
    dl_back_url: dlBackSignedUrl ?? application.dl_back_url,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
          <Link
            href="/jobs"
            className="hover:text-foreground transition-colors"
          >
            Jobs
          </Link>
          <span>/</span>
          <span className="text-foreground">{application.full_name}</span>
        </div>
        <h1 className="text-lg sm:text-2xl font-bold text-foreground mt-1">
          {application.full_name}
        </h1>
      </div>

      <ApplicantDetail
        application={appWithDlUrls}
        resumeSignedUrl={resumeSignedUrl}
        imageSignedUrls={imageSignedUrls}
      />
    </div>
  );
}
