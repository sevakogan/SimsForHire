"use client";

import { useState } from "react";
import Link from "next/link";
import { ViewToggle } from "@/components/ui/view-toggle";
import type { ViewMode } from "@/components/ui/view-toggle";
import { ProjectCard } from "./project-card";
import { Badge } from "@/components/ui/badge";
import { FulfillmentBadge } from "@/components/ui/fulfillment-badge";
import { buttonStyles } from "@/components/ui/form-styles";
import type { Project } from "@/types";

interface ProjectsSectionProps {
  projects: Project[];
  clientId: string;
  noteCounts: Record<string, number>;
}

export function ProjectsSection({ projects, clientId, noteCounts }: ProjectsSectionProps) {
  const [view, setView] = useState<ViewMode>("list");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold text-foreground">Projects</h2>
        <div className="flex items-center gap-2">
          {projects.length > 0 && <ViewToggle value={view} onChange={setView} />}
          <Link href={`/clients/${clientId}/new-project`} className={buttonStyles.primary}>
            New Project
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet.</p>
      ) : view === "list" ? (
        <div className="space-y-2 sm:space-y-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              clientNoteCount={noteCounts[project.id] ?? 0}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {projects.map((project) => (
            <ProjectCardCompact
              key={project.id}
              project={project}
              noteCount={noteCounts[project.id] ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCardCompact({
  project,
  noteCount,
}: {
  project: Project;
  noteCount: number;
}) {
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group block rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-md hover:border-primary/20 overflow-hidden"
    >
      {/* Top color bar */}
      <div className={`h-1.5 ${
        project.status === "accepted" || project.status === "paid" ? "bg-green-400"
          : project.status === "preparing" || project.status === "shipped" || project.status === "received" ? "bg-sky-400"
          : project.status === "completed" ? "bg-green-400"
          : project.status === "submitted" || project.status === "quote" ? "bg-gray-400"
          : "bg-slate-300"
      }`} />

      <div className="p-3 sm:p-4 space-y-2.5">
        {/* Name */}
        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
          {project.name}
        </p>

        {/* Status + Fulfillment */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant={project.status}>{project.status}</Badge>
          <FulfillmentBadge type={project.fulfillment_type} />
        </div>

        {/* Date + Notes */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {new Date(project.created_at).toLocaleDateString()}
          </p>
          {noteCount > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
              <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              {noteCount}
            </span>
          )}
        </div>

        {/* Invoice number */}
        {project.invoice_number && (
          <p className="text-[10px] text-muted-foreground/60 truncate">
            Invoice #{project.invoice_number}
          </p>
        )}
      </div>
    </Link>
  );
}
