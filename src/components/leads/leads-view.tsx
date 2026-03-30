"use client";

import { useState, useTransition } from "react";
import { LeadStatusSelect } from "./lead-status-select";
import { archiveLead, deleteLead, startLeadCampaign, stopLeadCampaigns } from "@/lib/actions/leads";
import type { Lead, LeadSource, LeadStatus, LeadCampaign } from "@/types";

interface LeadsViewProps {
  leads: Lead[];
  campaignStatuses: Record<string, LeadCampaign>;
}

type SourceFilter = "all" | LeadSource;
type StatusFilter = "all" | LeadStatus;

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "All",
  new: "New",
  replied: "Replied",
  in_progress: "In Progress",
  booked: "Booked",
  lost: "Lost",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function getDetails(lead: Lead): string {
  return lead.event_type ?? lead.business_name ?? lead.interest ?? lead.message ?? "—";
}

function getCampaignLabel(c: LeadCampaign): string {
  const name = c.campaign?.name ?? "Campaign";
  // Shorten long names
  const shortName = name.replace("& Nurture", "").replace("Recovery", "").trim();
  return `${shortName} ${c.current_step}/${c.total_steps ?? "?"}`;
}

// ─── Campaign Start/Stop control ───

function CampaignControl({ leadId, campaign }: { leadId: string; campaign?: LeadCampaign }) {
  const [isPending, startTransition] = useTransition();
  const isActive = campaign?.status === "active";

  function handleStart() {
    startTransition(() => {
      startLeadCampaign(leadId, "welcome_nurture");
    });
  }

  function handleStop() {
    startTransition(() => {
      stopLeadCampaigns(leadId);
    });
  }

  if (!campaign) {
    return (
      <button
        onClick={handleStart}
        disabled={isPending}
        className="rounded px-2 py-1 text-[11px] font-medium bg-[rgba(48,209,88,0.1)] text-[#30D158] hover:bg-[rgba(48,209,88,0.18)] disabled:opacity-50 transition-colors whitespace-nowrap"
      >
        {isPending ? "…" : "Start"}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[11px] text-muted-foreground truncate max-w-[110px]">
        {getCampaignLabel(campaign)}
      </span>
      {isActive ? (
        <button
          onClick={handleStop}
          disabled={isPending}
          className="rounded px-2 py-1 text-[11px] font-medium bg-[rgba(225,6,0,0.08)] text-[#E10600] hover:bg-[rgba(225,6,0,0.14)] disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {isPending ? "…" : "Stop"}
        </button>
      ) : (
        <button
          onClick={handleStart}
          disabled={isPending}
          className="rounded px-2 py-1 text-[11px] font-medium bg-[rgba(48,209,88,0.1)] text-[#30D158] hover:bg-[rgba(48,209,88,0.18)] disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {isPending ? "…" : "Resume"}
        </button>
      )}
    </div>
  );
}

// ─── Archive/Delete actions ───

function LeadActions({ leadId }: { leadId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleArchive() {
    if (!confirm("Archive this lead? You can restore it later.")) return;
    startTransition(() => {
      archiveLead(leadId);
    });
  }

  function handleDelete() {
    if (!confirm("Permanently delete this lead? This cannot be undone.")) return;
    startTransition(() => {
      deleteLead(leadId);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleArchive}
        disabled={isPending}
        className="rounded p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-40 transition-colors"
        title="Archive"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      </button>
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-[#E10600] disabled:opacity-40 transition-colors"
        title="Delete"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main view ───

export function LeadsView({ leads, campaignStatuses }: LeadsViewProps) {
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = leads.filter((lead) => {
    if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Source filter */}
        <div className="flex overflow-hidden rounded-[10px] border border-border bg-white">
          {(["all", "rent", "lease", "popup"] as SourceFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`px-4 py-2 text-[13px] transition-all ${
                sourceFilter === s
                  ? "bg-foreground font-medium text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex overflow-hidden rounded-[10px] border border-border bg-white">
          {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-[13px] transition-all ${
                statusFilter === s
                  ? "bg-foreground font-medium text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-[14px] border border-border bg-white sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Status", "Name", "Email", "Phone", "Source", "Details", "Date", "Campaign", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3.5 text-left text-[11px] font-medium uppercase tracking-[0.5px] text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead) => (
              <tr key={lead.id} className="border-b border-border last:border-0 transition-colors hover:bg-black/[0.015]">
                <td className="px-4 py-3.5">
                  <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} />
                </td>
                <td className="px-4 py-3.5 font-medium text-foreground">{lead.name || "—"}</td>
                <td className="px-4 py-3.5">
                  <a href={`mailto:${lead.email}`} className="text-[#E10600] hover:underline">
                    {lead.email}
                  </a>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground">
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} className="text-muted-foreground hover:text-foreground">
                      {lead.phone}
                    </a>
                  ) : "—"}
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-[11px] uppercase tracking-[0.5px] text-muted-foreground">
                    {lead.source}
                  </span>
                </td>
                <td className="max-w-[180px] truncate px-4 py-3.5 text-[13px] text-muted-foreground">
                  {getDetails(lead)}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-muted-foreground">
                  {formatDate(lead.created_at)}
                </td>
                <td className="px-4 py-3.5">
                  <CampaignControl leadId={lead.id} campaign={campaignStatuses[lead.id]} />
                </td>
                <td className="px-4 py-3.5">
                  <LeadActions leadId={lead.id} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-16 text-center text-sm text-muted-foreground">
                  No leads found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 sm:hidden">
        {filtered.map((lead) => (
          <div key={lead.id} className="rounded-[14px] border border-border bg-white p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium text-sm text-foreground">{lead.name || "—"}</div>
                <div className="text-[11px] uppercase tracking-[0.5px] text-muted-foreground mt-0.5">
                  {lead.source}
                </div>
              </div>
              <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} />
            </div>
            <div className="space-y-1 text-[13px]">
              <a href={`mailto:${lead.email}`} className="block text-[#E10600]">
                {lead.email}
              </a>
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="block text-muted-foreground">
                  {lead.phone}
                </a>
              )}
            </div>
            {getDetails(lead) !== "—" && (
              <div className="truncate text-[13px] text-muted-foreground">{getDetails(lead)}</div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[13px] text-muted-foreground">{formatDate(lead.created_at)}</span>
              <div className="flex items-center gap-2">
                <CampaignControl leadId={lead.id} campaign={campaignStatuses[lead.id]} />
                <LeadActions leadId={lead.id} />
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-[14px] border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No leads found</p>
          </div>
        )}
      </div>
    </div>
  );
}
