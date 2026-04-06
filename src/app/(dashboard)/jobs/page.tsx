import { getJobs, getApplications } from "@/lib/actions/jobs";
import { JobsView } from "@/components/jobs/jobs-view";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const [jobs, applications] = await Promise.all([
    getJobs(),
    getApplications(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage job listings and review applicants
        </p>
      </div>
      <JobsView jobs={jobs} applications={applications} />
    </div>
  );
}
