import { notFound } from "next/navigation";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { NdaSigningPage } from "@/components/nda/nda-signing-page";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

interface ApplicationRow {
  id: string;
  full_name: string;
  nda_signed_at: string | null;
  require_dl: boolean | null;
  job_id: string;
}

interface JobRow {
  title: string;
}

export default async function NdaPage({ params }: Props) {
  const { token } = await params;

  if (!token || token.length < 10) {
    notFound();
  }

  const supabase = getAdminSupabase();

  const { data: application, error } = await supabase
    .from("job_applications")
    .select("id, full_name, nda_signed_at, require_dl, job_id")
    .eq("nda_token", token)
    .single();

  if (error || !application) {
    notFound();
  }

  const app = application as ApplicationRow;

  // Record that the NDA was opened (first open only)
  if (!app.nda_signed_at) {
    supabase
      .from("job_applications")
      .update({ nda_opened_at: new Date().toISOString() })
      .eq("id", app.id)
      .is("nda_opened_at", null)
      .then(() => {});
  }

  // Fetch job title
  const { data: job } = await supabase
    .from("jobs")
    .select("title")
    .eq("id", app.job_id)
    .single();

  const jobTitle = (job as JobRow | null)?.title ?? "Contractor";

  // Already signed — show confirmation
  if (app.nda_signed_at) {
    const signedDate = new Date(app.nda_signed_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-900/40">
          <svg
            className="h-7 w-7 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white">NDA Already Signed</h2>
        <p className="mt-2 text-sm text-zinc-400">
          This Non-Disclosure Agreement was signed on {signedDate}.
        </p>
        <p className="mt-4 text-xs text-zinc-500">
          If you believe this is an error, please contact SimsForHire directly.
        </p>
      </div>
    );
  }

  return (
    <NdaSigningPage
      applicantName={app.full_name}
      jobTitle={jobTitle}
      token={token}
      requireDl={app.require_dl ?? true}
    />
  );
}
