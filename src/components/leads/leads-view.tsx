"use client";

import { useState } from "react";
import { LeadStatusSelect } from "./lead-status-select";
import type { Lead, LeadSource, LeadStatus } from "@/types";

interface LeadsViewProps {
  leads: Lead[];
}

type SourceFilter = "all" | LeadSource;
type StatusFilter = "all" | LeadStatus;

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

export function LeadsView({ leads }: LeadsViewProps) {
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
        {/* Source segmented control */}
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

        {/* Status segmented control */}
        <div className="flex overflow-hidden rounded-[10px] border border-border bg-white">
          {(["all", "new", "contacted", "closed"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-[13px] transition-all ${
                statusFilter === s
                  ? "bg-foreground font-medium text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-[14px] border border-border bg-white sm:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Status", "Name", "Email", "Phone", "Source", "Details", "Date", ""].map((h) => (
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
                <td className="max-w-[200px] truncate px-4 py-3.5 text-[13px] text-muted-foreground">
                  {getDetails(lead)}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5 text-[13px] text-muted-foreground">
                  {formatDate(lead.created_at)}
                </td>
                <td className="px-4 py-3.5">
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-[13px] font-medium text-[#E10600] hover:underline"
                  >
                    Reply
                  </a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-sm text-muted-foreground">
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
              <a href={`mailto:${lead.email}`} className="text-[13px] font-medium text-[#E10600]">
                Reply
              </a>
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
