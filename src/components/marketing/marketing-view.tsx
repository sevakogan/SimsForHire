"use client";

import { useState } from "react";
import type { CampaignWithSteps } from "@/lib/actions/campaigns";
import { CampaignEditor } from "./campaign-editor";

interface MarketingViewProps {
  campaigns: CampaignWithSteps[];
}

export function MarketingView({ campaigns }: MarketingViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    campaigns[0]?.id ?? null
  );

  const selected = campaigns.find((c) => c.id === selectedId) ?? null;

  const CAMPAIGN_TRIGGERS: Record<string, string> = {
    welcome_nurture: "Auto — triggers on every new lead",
    abandoned_booking: "Manual — trigger per lead",
    post_visit: "Manual — trigger after session",
    win_back: "Auto — triggers when lead marked Lost",
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
      {/* Sidebar — campaign list */}
      <div className="space-y-2">
        {campaigns.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`w-full rounded-xl border p-4 text-left transition-all ${
              selectedId === c.id
                ? "border-foreground bg-white shadow-sm"
                : "border-border bg-white hover:border-muted-foreground/30"
            }`}
          >
            <p className="text-[14px] font-semibold text-foreground">{c.name}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {c.steps.length} step{c.steps.length !== 1 ? "s" : ""}
              {c.enrollment_count > 0 && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#30D158]" />
                  {c.enrollment_count} active
                </span>
              )}
            </p>
            <p className="mt-1.5 text-[11px] text-muted-foreground/70 leading-tight">
              {CAMPAIGN_TRIGGERS[c.type] ?? "Manual"}
            </p>
          </button>
        ))}

        {campaigns.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">No campaigns yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Run the setup to seed campaigns.
            </p>
          </div>
        )}
      </div>

      {/* Main — campaign editor */}
      {selected ? (
        <CampaignEditor campaign={selected} />
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-white p-12">
          <p className="text-sm text-muted-foreground">Select a campaign to edit</p>
        </div>
      )}
    </div>
  );
}
