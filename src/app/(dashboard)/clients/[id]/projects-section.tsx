"use client";

import { useState } from "react";
import Link from "next/link";
import { ViewToggle } from "@/components/ui/view-toggle";
import type { ViewMode } from "@/components/ui/view-toggle";
import { ProjectCard } from "./project-card";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/form-styles";
import type { Project, FulfillmentType } from "@/types";

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

function FulfillmentIcon({ type }: { type: FulfillmentType | undefined }) {
  const fulfillment = type ?? "delivery";
  const isPickup = fulfillment === "pickup";

  if (isPickup) {
    return (
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
      </svg>
    );
  }

  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
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
          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
            (project.fulfillment_type ?? "delivery") === "pickup"
              ? "bg-amber-50 text-amber-700"
              : "bg-blue-50 text-blue-700"
          }`}>
            <FulfillmentIcon type={project.fulfillment_type} />
            {(project.fulfillment_type ?? "delivery") === "pickup" ? "Pickup" : "Delivery"}
          </span>
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
