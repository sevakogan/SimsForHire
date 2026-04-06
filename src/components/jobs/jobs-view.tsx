"use client";

import { useState } from "react";
import Link from "next/link";
import { JobsList } from "./jobs-list";
import { ApplicantsList } from "./applicants-list";
import type { Job, JobApplication } from "@/lib/jobs/types";

type Tab = "jobs" | "applicants";

interface JobsViewProps {
  readonly jobs: readonly Job[];
  readonly applications: readonly JobApplication[];
}

export function JobsView({ jobs, applications }: JobsViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("jobs");

  return (
    <div className="space-y-6">
      {/* Header row: tabs + new job button */}
      <div className="flex items-center justify-between">
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-0.5 w-fit">
        <button
          onClick={() => setActiveTab("jobs")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            activeTab === "jobs"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
          </svg>
          Open Jobs ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab("applicants")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            activeTab === "applicants"
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
          </svg>
          Applicants ({applications.length})
        </button>
      </div>

        <Link
          href="/jobs/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#E10600] px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Job
        </Link>
      </div>

      {/* Tab content */}
      {activeTab === "jobs" ? (
        <JobsList jobs={jobs} />
      ) : (
        <ApplicantsList applications={applications} />
      )}
    </div>
  );
}
