"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ViewToggle } from "@/components/ui/view-toggle";
import type { ViewMode } from "@/components/ui/view-toggle";
import { Badge } from "@/components/ui/badge";
import { deleteProject, duplicateProject } from "@/lib/actions/projects";
import type { ProjectWithClient } from "@/lib/actions/projects";
import type { FulfillmentType, ProjectStatus } from "@/types";

interface AllProjectsViewProps {
  projects: ProjectWithClient[];
  noteCounts: Record<string, number>;
}

const STATUS_FILTERS: { label: string; value: ProjectStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Quote", value: "quote" },
  { label: "Submitted", value: "submitted" },
  { label: "Accepted", value: "accepted" },
  { label: "Paid", value: "paid" },
  { label: "Shipped", value: "shipped" },
  { label: "Received", value: "received" },
  { label: "Completed", value: "completed" },
];

export function AllProjectsView({ projects, noteCounts }: AllProjectsViewProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("list");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      statusFilter === ""
        ? projects
        : projects.filter((p) => p.status === statusFilter),
    [projects, statusFilter]
  );

  async function handleDuplicate(projectId: string) {
    setActionLoading(projectId);
    await duplicateProject(projectId);
    setActionLoading(null);
    router.refresh();
  }

  async function handleDelete(projectId: string) {
    setActionLoading(projectId);
    await deleteProject(projectId);
    setConfirmDeleteId(null);
    setActionLoading(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {/* Filter + View toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? "bg-primary text-white"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <ViewToggle value={view} onChange={setView} />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {projects.length === 0
              ? "No projects yet."
              : "No projects match this filter."}
          </p>
        </div>
      ) : view === "list" ? (
        <div className="space-y-2">
          {filtered.map((project) => (
            <ProjectListRow
              key={project.id}
              project={project}
              noteCount={noteCounts[project.id] ?? 0}
              onDuplicate={handleDuplicate}
              onDeleteRequest={setConfirmDeleteId}
              isLoading={actionLoading === project.id}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((project) => (
            <ProjectGridCard
              key={project.id}
              project={project}
              noteCount={noteCounts[project.id] ?? 0}
              onDuplicate={handleDuplicate}
              onDeleteRequest={setConfirmDeleteId}
              isLoading={actionLoading === project.id}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <ConfirmDeleteModal
          projectName={projects.find((p) => p.id === confirmDeleteId)?.name ?? "this project"}
          isLoading={actionLoading === confirmDeleteId}
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

/* ─── Delete Confirmation Modal ─── */

function ConfirmDeleteModal({
  projectName,
  isLoading,
  onConfirm,
  onCancel,
}: {
  projectName: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-xl">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-foreground text-center">Delete Project</h3>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">{projectName}</span>?
          This will permanently remove the project and all its items.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── List row ─── */

function ProjectListRow({
  project,
  noteCount,
  onDuplicate,
  onDeleteRequest,
  isLoading,
}: {
  project: ProjectWithClient;
  noteCount: number;
  onDuplicate: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="group flex items-center justify-between rounded-xl border border-border bg-white p-3.5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md sm:p-5">
      <Link
        href={`/projects/${project.id}`}
        className="min-w-0 flex-1"
      >
        <div className="flex items-center gap-2">
          <p className="text-sm sm:text-base font-medium text-foreground truncate">
            {project.name}
          </p>
          <FulfillmentBadge type={project.fulfillment_type} />
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground truncate">
          {project.client_name} · {new Date(project.created_at).toLocaleDateString()}
        </p>
      </Link>

      <div className="flex items-center gap-2 ml-3 shrink-0">
        <Badge variant={project.status}>{project.status}</Badge>

        {noteCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-600">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
            {noteCount}
          </span>
        )}

        {project.invoice_number && (
          <span className="hidden sm:inline text-[10px] text-muted-foreground/60">
            #{project.invoice_number}
          </span>
        )}

        {/* Action buttons — visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDuplicate(project.id)}
            disabled={isLoading}
            className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
            title="Duplicate project"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
            </svg>
          </button>
          <button
            onClick={() => onDeleteRequest(project.id)}
            disabled={isLoading}
            className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            title="Delete project"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Grid card ─── */

function ProjectGridCard({
  project,
  noteCount,
  onDuplicate,
  onDeleteRequest,
  isLoading,
}: {
  project: ProjectWithClient;
  noteCount: number;
  onDuplicate: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="group relative rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-md hover:border-primary/20 overflow-hidden">
      {/* Color bar */}
      <div className={`h-1.5 ${statusColor(project.status)}`} />

      {/* Action buttons — top-right on hover */}
      <div className="absolute top-3 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={() => onDuplicate(project.id)}
          disabled={isLoading}
          className="rounded-md p-1 bg-white/90 text-muted-foreground/60 shadow-sm border border-border/40 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
          title="Duplicate project"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
          </svg>
        </button>
        <button
          onClick={() => onDeleteRequest(project.id)}
          disabled={isLoading}
          className="rounded-md p-1 bg-white/90 text-muted-foreground/60 shadow-sm border border-border/40 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          title="Delete project"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>

      <Link href={`/projects/${project.id}`} className="block">
        <div className="p-3 sm:p-4 space-y-2.5">
          <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {project.name}
          </p>

          <p className="text-xs text-muted-foreground truncate">
            {project.client_name}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={project.status}>{project.status}</Badge>
            <FulfillmentBadge type={project.fulfillment_type} />
          </div>

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

          {project.invoice_number && (
            <p className="text-[10px] text-muted-foreground/60 truncate">
              Invoice #{project.invoice_number}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}

/* ─── Helpers ─── */

function statusColor(status: ProjectStatus): string {
  switch (status) {
    case "quote":
      return "bg-blue-400";
    case "submitted":
      return "bg-indigo-400";
    case "accepted":
      return "bg-green-400";
    case "paid":
      return "bg-emerald-400";
    case "shipped":
      return "bg-amber-400";
    case "received":
      return "bg-orange-400";
    case "completed":
      return "bg-purple-400";
    default:
      return "bg-slate-300";
  }
}

function FulfillmentBadge({ type }: { type: FulfillmentType | undefined }) {
  const fulfillment = type ?? "delivery";
  const isPickup = fulfillment === "pickup";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
        isPickup
          ? "bg-amber-50 text-amber-700"
          : "bg-blue-50 text-blue-700"
      }`}
    >
      {isPickup ? (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      ) : (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      )}
      {isPickup ? "Pickup" : "Delivery"}
    </span>
  );
}
