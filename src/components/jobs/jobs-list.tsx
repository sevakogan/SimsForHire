"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateJobStatus, deleteJob } from "@/lib/actions/jobs";
import { tableStyles } from "@/components/ui/form-styles";
import type { Job } from "@/lib/jobs/types";

interface JobsListProps {
  readonly jobs: readonly Job[];
}

const STATUS_STYLES: Record<Job["status"], { bg: string; text: string; label: string }> = {
  active: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Active" },
  paused: { bg: "bg-amber-50", text: "text-amber-700", label: "Paused" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMainImage(job: Job): string | null {
  const main = job.images.find((img) => img.is_main);
  return main?.url ?? job.images[0]?.url ?? null;
}

export function JobsList({ jobs: initial }: JobsListProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<readonly Job[]>(initial);
  const [isPending, startTransition] = useTransition();

  function handleToggleStatus(job: Job) {
    const newStatus = job.status === "active" ? "paused" : "active";
    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j))
    );
    startTransition(async () => {
      await updateJobStatus(job.id, newStatus);
      router.refresh();
    });
  }

  function handleDelete(jobId: string) {
    if (!confirm("Delete this job listing? This cannot be undone.")) return;
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
    startTransition(async () => {
      await deleteJob(jobId);
      router.refresh();
    });
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-20 gap-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">No job listings yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Job listings from the careers page will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={tableStyles.wrapper}>
      <table className={tableStyles.table}>
        <thead className={tableStyles.thead}>
          <tr>
            <th className={tableStyles.th}>Job</th>
            <th className={tableStyles.th}>Status</th>
            <th className={tableStyles.th}>Tags</th>
            <th className={tableStyles.th}>Created</th>
            <th className={tableStyles.th}>Actions</th>
          </tr>
        </thead>
        <tbody className={tableStyles.tbody}>
          {jobs.map((job) => {
            const image = getMainImage(job);
            const statusStyle = STATUS_STYLES[job.status];

            return (
              <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                <td className={tableStyles.td}>
                  <div className="flex items-center gap-3">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted flex-shrink-0">
                        <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{job.title}</p>
                      {job.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1 max-w-xs">
                          {job.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className={tableStyles.td}>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                    {statusStyle.label}
                  </span>
                </td>
                <td className={tableStyles.td}>
                  <div className="flex flex-wrap gap-1">
                    {job.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                    {job.tags.length > 3 && (
                      <span className="text-[11px] text-muted-foreground">
                        +{job.tags.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className={tableStyles.tdMuted}>{formatDate(job.created_at)}</td>
                <td className={tableStyles.td}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(job)}
                      disabled={isPending}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                    >
                      {job.status === "active" ? "Pause" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      disabled={isPending}
                      className="text-xs font-medium text-destructive hover:text-red-600 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
