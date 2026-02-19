"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ViewToggle } from "@/components/ui/view-toggle";
import type { ViewMode } from "@/components/ui/view-toggle";
import { Badge } from "@/components/ui/badge";
import { FulfillmentBadge } from "@/components/ui/fulfillment-badge";
import { deleteProject, duplicateProject } from "@/lib/actions/projects";
import type { ProjectWithClient } from "@/lib/actions/projects";
import type { ProjectSummary } from "@/lib/actions/project-summaries";
import { formatCurrency } from "@/lib/invoice-calculations";
import type { ProjectStatus } from "@/types";

interface AllProjectsViewProps {
  projects: ProjectWithClient[];
  noteCounts: Record<string, number>;
  summaries: Record<string, ProjectSummary>;
}

const STATUS_FILTERS: { label: string; value: ProjectStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Quote", value: "quote" },
  { label: "Submitted", value: "submitted" },
  { label: "Accepted", value: "accepted" },
  { label: "Paid", value: "paid" },
  { label: "Preparing", value: "preparing" },
  { label: "Shipped", value: "shipped" },
  { label: "Received", value: "received" },
  { label: "Completed", value: "completed" },
];

export function AllProjectsView({ projects, noteCounts, summaries }: AllProjectsViewProps) {
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
              summary={summaries[project.id]}
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
              summary={summaries[project.id]}
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

/* ─── Status phase bars ─── */

const SALES_STEPS: ProjectStatus[] = ["draft", "quote", "submitted", "accepted", "paid"];
const FULFILLMENT_STEPS: ProjectStatus[] = ["preparing", "shipped", "received", "completed"];

/** Returns 0–1 progress through a status array based on current status */
function statusProgress(currentStatus: ProjectStatus, steps: ProjectStatus[]): number {
  const idx = steps.indexOf(currentStatus);
  if (idx === -1) {
    // If current status is beyond this phase, check if it's a later phase
    const allStatuses: ProjectStatus[] = ["draft", "quote", "submitted", "accepted", "paid", "preparing", "shipped", "received", "completed"];
    const currentIdx = allStatuses.indexOf(currentStatus);
    const lastStepIdx = allStatuses.indexOf(steps[steps.length - 1]);
    // If we're past this phase's last step, it's 100%
    if (currentIdx > lastStepIdx) return 1;
    return 0;
  }
  // step 0 = first step reached → show some progress
  return (idx + 1) / steps.length;
}

function StatusBars({
  status,
  contractViewedAt,
  contractSignedAt,
  compact = false,
}: {
  status: ProjectStatus;
  contractViewedAt: string | null;
  contractSignedAt: string | null;
  compact?: boolean;
}) {
  const salesPct = statusProgress(status, SALES_STEPS) * 100;
  const fulfillmentPct = statusProgress(status, FULFILLMENT_STEPS) * 100;

  // Contract: 0 = none, 50 = viewed, 100 = signed
  const contractPct = contractSignedAt ? 100 : contractViewedAt ? 50 : 0;

  const barHeight = compact ? "h-1" : "h-1.5";

  return (
    <div className={`flex items-center gap-1 ${compact ? "w-full" : ""}`}>
      {/* Sales: draft → paid */}
      <div className="flex-1 flex flex-col items-center gap-0.5" title={`Sales: ${Math.round(salesPct)}%`}>
        <div className={`w-full ${barHeight} rounded-full bg-gray-100 overflow-hidden`}>
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${salesPct}%` }}
          />
        </div>
        {!compact && <span className="text-[8px] text-gray-400 leading-none">Sales</span>}
      </div>
      {/* Contract: viewed → signed */}
      <div className="flex-1 flex flex-col items-center gap-0.5" title={`Contract: ${contractSignedAt ? "Signed" : contractViewedAt ? "Viewed" : "Pending"}`}>
        <div className={`w-full ${barHeight} rounded-full bg-gray-100 overflow-hidden`}>
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{ width: `${contractPct}%` }}
          />
        </div>
        {!compact && <span className="text-[8px] text-gray-400 leading-none">Contract</span>}
      </div>
      {/* Fulfillment: preparing → completed */}
      <div className="flex-1 flex flex-col items-center gap-0.5" title={`Fulfillment: ${Math.round(fulfillmentPct)}%`}>
        <div className={`w-full ${barHeight} rounded-full bg-gray-100 overflow-hidden`}>
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${fulfillmentPct}%` }}
          />
        </div>
        {!compact && <span className="text-[8px] text-gray-400 leading-none">Fulfillment</span>}
      </div>
    </div>
  );
}

/* ─── Profit indicator helper ─── */

function ProfitIndicator({ profit }: { profit: number }) {
  if (profit === 0) return null;
  const isPositive = profit > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
        isPositive ? "text-emerald-600" : "text-red-500"
      }`}
    >
      <svg
        className={`h-2.5 w-2.5 ${isPositive ? "" : "rotate-180"}`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2.5}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
      {formatCurrency(Math.abs(profit))}
    </span>
  );
}

/* ─── Payment progress helper ─── */

function PaymentProgress({ totalPaid, grandTotal }: { totalPaid: number; grandTotal: number }) {
  if (grandTotal <= 0) return null;
  const pct = Math.min(100, (totalPaid / grandTotal) * 100);
  const isPaid = totalPaid >= grandTotal && totalPaid > 0;

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden min-w-[40px]">
        <div
          className={`h-full rounded-full transition-all ${
            isPaid ? "bg-emerald-500" : pct > 0 ? "bg-amber-400" : "bg-gray-200"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-semibold shrink-0 ${isPaid ? "text-emerald-600" : "text-gray-400"}`}>
        {isPaid ? "Paid" : pct > 0 ? `${Math.round(pct)}%` : "Unpaid"}
      </span>
    </div>
  );
}

/* ─── List row ─── */

function ProjectListRow({
  project,
  noteCount,
  summary,
  onDuplicate,
  onDeleteRequest,
  isLoading,
}: {
  project: ProjectWithClient;
  noteCount: number;
  summary?: ProjectSummary;
  onDuplicate: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  isLoading: boolean;
}) {
  const s = summary ?? { itemCount: 0, grandTotal: 0, totalCost: 0, profit: 0, totalPaid: 0 };

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group grid grid-cols-[1fr] sm:grid-cols-[1fr_120px_100px_80px_50px_80px_48px_60px] items-center gap-x-3 rounded-xl border border-border bg-white p-3.5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md sm:p-5"
    >
      {/* Col 1: Name + meta */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm sm:text-base font-medium text-foreground truncate">
            {project.name}
          </p>
          <FulfillmentBadge type={project.fulfillment_type} />
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {/* Client (owner) */}
          <svg className="h-3.5 w-3.5 shrink-0 text-primary/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
            {project.client_name}
          </span>
          <span className="text-xs text-muted-foreground/50">·</span>
          {/* Creator avatar */}
          {project.creator_avatar ? (
            <img
              src={project.creator_avatar}
              alt={project.creator_name ?? ""}
              className="h-4 w-4 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : project.creator_name ? (
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-100 text-[8px] font-semibold text-gray-500">
              {project.creator_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
            </div>
          ) : null}
          <span className="text-[10px] sm:text-xs text-muted-foreground/50 truncate">
            {new Date(project.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Col 2: Status bars */}
      <div className="hidden sm:block">
        <StatusBars
          status={project.status}
          contractViewedAt={project.contract_viewed_at}
          contractSignedAt={project.contract_signed_at}
        />
      </div>

      {/* Col 3: Total + Profit */}
      <div className="hidden sm:block text-right">
        {s.grandTotal > 0 ? (
          <>
            <p className="text-sm font-bold tabular-nums text-foreground">
              {formatCurrency(s.grandTotal)}
            </p>
            <ProfitIndicator profit={s.profit} />
          </>
        ) : (
          <span className="text-xs text-muted-foreground/40">—</span>
        )}
      </div>

      {/* Col 4: Payment progress */}
      <div className="hidden sm:block">
        {s.grandTotal > 0 ? (
          <PaymentProgress totalPaid={s.totalPaid} grandTotal={s.grandTotal} />
        ) : null}
      </div>

      {/* Col 5: Item count */}
      <div className="hidden sm:block text-center">
        {s.itemCount > 0 ? (
          <span className="text-[10px] text-muted-foreground/60 tabular-nums">
            {s.itemCount} item{s.itemCount !== 1 ? "s" : ""}
          </span>
        ) : null}
      </div>

      {/* Col 6: Status badge */}
      <div className="hidden sm:flex justify-end">
        <Badge variant={project.status}>{project.status}</Badge>
      </div>

      {/* Col 7: Notes */}
      <div className="hidden sm:flex justify-center">
        {noteCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-600">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
            {noteCount}
          </span>
        )}
      </div>

      {/* Col 8: Invoice # + actions */}
      <div className="hidden sm:flex items-center justify-end gap-1">
        {project.invoice_number && (
          <span className="text-[10px] text-muted-foreground/60 group-hover:hidden">
            #{project.invoice_number}
          </span>
        )}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.preventDefault(); onDuplicate(project.id); }}
            disabled={isLoading}
            className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
            title="Duplicate project"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); onDeleteRequest(project.id); }}
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

      {/* Mobile: compact row below name */}
      <div className="flex items-center gap-2 mt-2 sm:hidden flex-wrap">
        <Badge variant={project.status}>{project.status}</Badge>
        {s.grandTotal > 0 && (
          <span className="text-xs font-bold tabular-nums text-foreground">
            {formatCurrency(s.grandTotal)}
          </span>
        )}
        {noteCount > 0 && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
            {noteCount}
          </span>
        )}
        {project.invoice_number && (
          <span className="text-[10px] text-muted-foreground/60 ml-auto">
            #{project.invoice_number}
          </span>
        )}
      </div>
    </Link>
  );
}

/* ─── Grid card ─── */

function ProjectGridCard({
  project,
  noteCount,
  summary,
  onDuplicate,
  onDeleteRequest,
  isLoading,
}: {
  project: ProjectWithClient;
  noteCount: number;
  summary?: ProjectSummary;
  onDuplicate: (id: string) => void;
  onDeleteRequest: (id: string) => void;
  isLoading: boolean;
}) {
  const s = summary ?? { itemCount: 0, grandTotal: 0, totalCost: 0, profit: 0, totalPaid: 0 };

  return (
    <div className="group relative rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-md hover:border-primary/20 overflow-hidden">
      {/* Status progress bars */}
      <div className="px-3 pt-2.5">
        <StatusBars
          status={project.status}
          contractViewedAt={project.contract_viewed_at}
          contractSignedAt={project.contract_signed_at}
          compact
        />
      </div>

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
          {/* Name + fulfillment */}
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {project.name}
            </p>
            <FulfillmentBadge type={project.fulfillment_type} />
          </div>

          {/* Client (owner) */}
          <div className="flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5 shrink-0 text-primary/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <span className="text-xs font-semibold text-foreground truncate">
              {project.client_name}
            </span>
          </div>

          {/* Creator */}
          <div className="flex items-center gap-1">
            {project.creator_avatar ? (
              <img
                src={project.creator_avatar}
                alt={project.creator_name ?? ""}
                className="h-3.5 w-3.5 rounded-full object-cover shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : project.creator_name ? (
              <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[7px] font-semibold text-gray-500">
                {project.creator_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
              </div>
            ) : null}
          </div>

          {/* Financial summary */}
          {s.grandTotal > 0 && (
            <div className="rounded-lg bg-gray-50 px-3 py-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Total</span>
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {formatCurrency(s.grandTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Profit</span>
                <ProfitIndicator profit={s.profit} />
              </div>
              <PaymentProgress totalPaid={s.totalPaid} grandTotal={s.grandTotal} />
            </div>
          )}

          {/* Status row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={project.status}>{project.status}</Badge>
            {s.itemCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-gray-50 border border-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 tabular-nums">
                {s.itemCount} item{s.itemCount !== 1 ? "s" : ""}
              </span>
            )}
            {noteCount > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 border border-red-200 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                </svg>
                {noteCount}
              </span>
            )}
          </div>

          {/* Footer: date + invoice # */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {new Date(project.created_at).toLocaleDateString()}
            </p>
            {project.invoice_number && (
              <p className="text-[10px] text-muted-foreground/60 truncate">
                #{project.invoice_number}
              </p>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}

