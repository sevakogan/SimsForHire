"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CampaignWithSteps } from "@/lib/actions/campaigns";
import {
  createCampaign,
  deleteCampaign,
  seedDefaultCampaigns,
} from "@/lib/actions/campaigns";
import { CampaignEditor } from "./campaign-editor";

interface MarketingViewProps {
  campaigns: CampaignWithSteps[];
}

const CAMPAIGN_TRIGGERS: Record<string, string> = {
  welcome_nurture: "Auto — new lead",
  abandoned_booking: "Manual",
  post_visit: "Manual",
  win_back: "Auto — on lost",
};

const CAMPAIGN_TYPES = [
  { value: "welcome_nurture", label: "Welcome & Nurture" },
  { value: "abandoned_booking", label: "Abandoned Booking" },
  { value: "post_visit", label: "Post-Visit" },
  { value: "win_back", label: "Win-Back" },
  { value: "custom", label: "Custom" },
];

export function MarketingView({ campaigns: initial }: MarketingViewProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<CampaignWithSteps[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const [showCreate, setShowCreate] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("custom");
  const [newDesc, setNewDesc] = useState("");

  const selected = campaigns.find((c) => c.id === selectedId) ?? null;

  async function handleSeedDefaults() {
    setSeeding(true);
    try {
      await seedDefaultCampaigns();
      router.refresh();
    } finally {
      setSeeding(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreatePending(true);
    try {
      const created = await createCampaign({
        name: newName.trim(),
        type: newType,
        description: newDesc.trim() || undefined,
      });
      setCampaigns((prev) => [...prev, created]);
      setSelectedId(created.id);
      setShowCreate(false);
      setNewName("");
      setNewType("custom");
      setNewDesc("");
    } finally {
      setCreatePending(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Delete this campaign and all its steps?")) return;
    setCampaigns((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) {
      setSelectedId(campaigns.find((c) => c.id !== id)?.id ?? null);
    }
    await deleteCampaign(id);
  }

  // Empty state
  if (campaigns.length === 0 && !showCreate) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white py-20 gap-5">
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">No campaigns yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Load the 4 default campaigns or create your own</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSeedDefaults}
            disabled={seeding}
            className="rounded-lg bg-[#1D1D1F] px-4 py-2 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {seeding ? "Loading…" : "Load Default Campaigns"}
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg border border-border px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Create Custom
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
      {/* Sidebar */}
      <div className="space-y-2">
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.7px] text-muted-foreground">
            {campaigns.length} Campaign{campaigns.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 transition-colors"
              title="Load default campaigns"
            >
              {seeding ? "…" : "Load defaults"}
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-white hover:opacity-80 transition-opacity"
              title="New campaign"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Campaign list */}
        {campaigns.map((c) => (
          <div
            key={c.id}
            className={`group relative w-full rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
              selectedId === c.id
                ? "border-foreground bg-white shadow-sm"
                : "border-border bg-white hover:border-muted-foreground/30"
            }`}
            onClick={() => setSelectedId(c.id)}
          >
            <div className="pr-6">
              <p className="text-[13px] font-semibold text-foreground leading-tight">{c.name}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {c.steps.length} step{c.steps.length !== 1 ? "s" : ""}
                {c.enrollment_count > 0 && (
                  <span className="ml-1.5 inline-flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#30D158]" />
                    {c.enrollment_count} active
                  </span>
                )}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/60 leading-tight">
                {CAMPAIGN_TRIGGERS[c.type] ?? "Manual"}
              </p>
            </div>
            {/* Delete button */}
            <button
              onClick={(e) => handleDelete(e, c.id)}
              className="absolute right-2 top-2 rounded p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-[#E10600] transition-all"
              title="Delete campaign"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}

        {/* Create form (inline in sidebar) */}
        {showCreate && (
          <form onSubmit={handleCreate} className="rounded-xl border border-foreground bg-white p-3.5 space-y-2.5">
            <p className="text-[12px] font-semibold text-foreground">New campaign</p>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              autoFocus
              placeholder="Campaign name"
              className="w-full rounded-lg border border-border bg-[#F5F5F7] px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full rounded-lg border border-border bg-[#F5F5F7] px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-foreground"
            >
              {CAMPAIGN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-lg border border-border bg-[#F5F5F7] px-2.5 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createPending}
                className="flex-1 rounded-lg bg-[#1D1D1F] py-1.5 text-[12px] font-medium text-white disabled:opacity-50"
              >
                {createPending ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Editor */}
      {selected ? (
        <CampaignEditor
          key={selected.id}
          campaign={selected}
          onUpdate={(updated) =>
            setCampaigns((prev) =>
              prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
            )
          }
        />
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-white p-12">
          <p className="text-sm text-muted-foreground">Select a campaign to edit</p>
        </div>
      )}
    </div>
  );
}
