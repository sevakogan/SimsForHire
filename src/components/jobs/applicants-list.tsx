"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateApplicationStatus, deleteApplication } from "@/lib/actions/jobs";
import { tableStyles } from "@/components/ui/form-styles";
import type { JobApplication, ApplicationStatus, APPLICATION_STATUSES } from "@/lib/jobs/types";

interface ApplicantsListProps {
  readonly applications: readonly JobApplication[];
}

const STATUS_STYLES: Record<ApplicationStatus, { bg: string; text: string; label: string }> = {
  new: { bg: "bg-blue-50", text: "text-blue-700", label: "New" },
  reviewed: { bg: "bg-violet-50", text: "text-violet-700", label: "Reviewed" },
  contacted: { bg: "bg-amber-50", text: "text-amber-700", label: "Contacted" },
  in_process: { bg: "bg-sky-50", text: "text-sky-700", label: "In Process" },
  hired: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Hired" },
  rejected: { bg: "bg-red-50", text: "text-red-700", label: "Rejected" },
};

const STATUS_OPTIONS: readonly { value: ApplicationStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "contacted", label: "Contacted" },
  { value: "in_process", label: "In Process" },
  { value: "hired", label: "Hired" },
  { value: "rejected", label: "Rejected" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

export function ApplicantsList({ applications: initial }: ApplicantsListProps) {
  const router = useRouter();
  const [applications, setApplications] = useState<readonly JobApplication[]>(initial);
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleStatusChange(appId: string, newStatus: ApplicationStatus) {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    startTransition(async () => {
      await updateApplicationStatus(appId, newStatus);
      router.refresh();
    });
  }

  const filtered =
    statusFilter === "all"
      ? applications
      : applications.filter((a) => a.status === statusFilter);

  const statusCounts = applications.reduce<Record<string, number>>(
    (acc, a) => ({ ...acc, [a.status]: (acc[a.status] ?? 0) + 1 }),
    {}
  );

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-20 gap-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">No applications yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Applications from the careers page will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
            statusFilter === "all"
              ? "bg-foreground text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          All ({applications.length})
        </button>
        {STATUS_OPTIONS.map(({ value, label }) => {
          const count = statusCounts[value] ?? 0;
          if (count === 0) return null;
          const style = STATUS_STYLES[value];
          return (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                statusFilter === value
                  ? `${style.bg} ${style.text}`
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className={tableStyles.wrapper}>
        <table className={tableStyles.table}>
          <thead className={tableStyles.thead}>
            <tr>
              <th className={tableStyles.th}>Applicant</th>
              <th className={tableStyles.th}>Job</th>
              <th className={tableStyles.th}>Status</th>
              <th className={tableStyles.th}>Applied</th>
              <th className={tableStyles.th}>Actions</th>
            </tr>
          </thead>
          <tbody className={tableStyles.tbody}>
            {filtered.map((app) => {
              const statusStyle = STATUS_STYLES[app.status];
              const isExpanded = expandedId === app.id;

              return (
                <tr key={app.id} className="hover:bg-muted/30 transition-colors">
                  <td className={tableStyles.td}>
                    <div>
                      <p className="font-medium text-foreground">{app.full_name}</p>
                      <p className="text-xs text-muted-foreground">{app.email}</p>
                    </div>
                  </td>
                  <td className={tableStyles.tdMuted}>
                    {app.job_title ?? "Unknown"}
                  </td>
                  <td className={tableStyles.td}>
                    <select
                      value={app.status}
                      onChange={(e) =>
                        handleStatusChange(app.id, e.target.value as ApplicationStatus)
                      }
                      disabled={isPending}
                      className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium ${statusStyle.bg} ${statusStyle.text} cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20`}
                    >
                      {STATUS_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={tableStyles.tdMuted}>{formatDate(app.created_at)}</td>
                  <td className={tableStyles.td}>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/jobs/applicants/${app.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-hover transition-colors"
                      >
                        Open
                      </Link>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : app.id)}
                        className="text-xs font-medium text-muted-foreground hover:text-foreground"
                      >
                        {isExpanded ? "Hide" : "Details"}
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm(`Delete ${app.full_name}'s application?`)) return;
                          if (!confirm("Are you sure? This cannot be undone.")) return;
                          setApplications((prev) => prev.filter((a) => a.id !== app.id));
                          startTransition(async () => {
                            await deleteApplication(app.id);
                            router.refresh();
                          });
                        }}
                        disabled={isPending}
                        className="flex h-6 w-6 items-center justify-center rounded-md text-destructive hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete applicant"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Expanded detail panel */}
      {expandedId && (() => {
        const app = filtered.find((a) => a.id === expandedId);
        if (!app) return null;
        return (
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{app.full_name}</h3>
              <button
                onClick={() => setExpandedId(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                <a href={`mailto:${app.email}`} className="text-blue-600 hover:underline">{app.email}</a>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</p>
                <a href={`tel:${app.phone}`} className="text-blue-600 hover:underline">{app.phone}</a>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Instagram</p>
                <p className="text-foreground">@{app.instagram.replace(/^@/, "")}</p>
              </div>
              {app.socials.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Socials</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {app.socials.map((s, i) => (
                      <span key={i} className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {s.platform}: {s.handle}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {app.about_me && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">About</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{app.about_me}</p>
              </div>
            )}
            {app.resume_url && (
              <div>
                <a
                  href={app.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  View Resume
                </a>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}
