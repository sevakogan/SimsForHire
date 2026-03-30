"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import type { CampaignWithSteps } from "@/lib/actions/campaigns";
import type { CampaignStep } from "@/types";
import {
  updateCampaignStep,
  deleteCampaignStep,
  addCampaignStep,
  reorderCampaignStep,
} from "@/lib/actions/campaigns";

interface CampaignEditorProps {
  campaign: CampaignWithSteps;
}

const CHANNEL_LABEL: Record<string, string> = { email: "Email", sms: "SMS" };
const CHANNEL_COLOR: Record<string, string> = {
  email: "bg-blue-50 text-blue-700",
  sms: "bg-amber-50 text-amber-700",
};

function delayLabel(hours: number): string {
  if (hours === 0) return "Immediately";
  if (hours < 24) return `${hours}h after previous`;
  const days = hours / 24;
  return `${days % 1 === 0 ? days : days.toFixed(1)} day${days !== 1 ? "s" : ""} after previous`;
}

export function CampaignEditor({ campaign }: CampaignEditorProps) {
  const [steps, setSteps] = useState<CampaignStep[]>(campaign.steps);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Auto-save on change with debounce
  const handleFieldChange = useCallback(
    (stepId: string, field: "subject" | "body_html" | "delay_hours", value: string | number) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, [field]: value } : s))
      );

      const existing = saveTimers.current.get(stepId);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        startTransition(() => {
          updateCampaignStep(stepId, { [field]: value });
        });
      }, 800);
      saveTimers.current.set(stepId, timer);
    },
    []
  );

  const handleToggleActive = useCallback((stepId: string, current: boolean) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, is_active: !current } : s))
    );
    startTransition(() => {
      updateCampaignStep(stepId, { is_active: !current });
    });
  }, []);

  const handleDelete = useCallback((stepId: string) => {
    if (!confirm("Delete this step? This cannot be undone.")) return;
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
    startTransition(() => {
      deleteCampaignStep(stepId);
    });
  }, []);

  const handleReorder = useCallback(
    (stepId: string, direction: "up" | "down") => {
      setSteps((prev) => {
        const idx = prev.findIndex((s) => s.id === stepId);
        if (idx === -1) return prev;
        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= prev.length) return prev;
        const next = [...prev];
        const tmp = next[idx].step_number;
        next[idx] = { ...next[idx], step_number: next[targetIdx].step_number };
        next[targetIdx] = { ...next[targetIdx], step_number: tmp };
        return [...next].sort((a, b) => a.step_number - b.step_number);
      });
      startTransition(() => {
        reorderCampaignStep(stepId, direction);
      });
    },
    []
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-white px-5 py-4">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">{campaign.name}</h2>
          {campaign.description && (
            <p className="mt-0.5 text-[13px] text-muted-foreground">{campaign.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isPending && (
            <span className="text-[12px] text-muted-foreground">Saving…</span>
          )}
          <span className="rounded-full bg-muted px-3 py-1 text-[12px] text-muted-foreground">
            {steps.length} step{steps.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.sort((a, b) => a.step_number - b.step_number).map((step, idx) => (
          <div
            key={step.id}
            className={`rounded-xl border bg-white transition-all ${
              step.is_active ? "border-border" : "border-border opacity-50"
            }`}
          >
            {/* Step header row */}
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Step number */}
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                {step.step_number}
              </span>

              {/* Channel badge */}
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${CHANNEL_COLOR[step.channel] ?? "bg-muted text-muted-foreground"}`}>
                {CHANNEL_LABEL[step.channel] ?? step.channel}
              </span>

              {/* Subject / preview */}
              <button
                onClick={() => setExpandedId(expandedId === step.id ? null : step.id)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="truncate text-[14px] font-medium text-foreground">
                  {step.subject || "(no subject)"}
                </span>
                <span className="ml-3 text-[12px] text-muted-foreground">
                  {delayLabel(step.delay_hours)}
                </span>
              </button>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleReorder(step.id, "up")}
                  disabled={idx === 0 || isPending}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                  title="Move up"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => handleReorder(step.id, "down")}
                  disabled={idx === steps.length - 1 || isPending}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30"
                  title="Move down"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <button
                  onClick={() => handleToggleActive(step.id, step.is_active)}
                  disabled={isPending}
                  className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                    step.is_active
                      ? "bg-[rgba(48,209,88,0.08)] text-[#30D158]"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.is_active ? "Active" : "Off"}
                </button>

                <button
                  onClick={() => setExpandedId(expandedId === step.id ? null : step.id)}
                  className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                  title="Edit"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>

                <button
                  onClick={() => handleDelete(step.id)}
                  disabled={isPending}
                  className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-[#E10600]"
                  title="Delete"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expanded editor */}
            {expandedId === step.id && (
              <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1">
                    Send delay (hours from previous step)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={step.delay_hours}
                    onChange={(e) => handleFieldChange(step.id, "delay_hours", Number(e.target.value))}
                    className="w-32 rounded-lg border border-border bg-[#F5F5F7] px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground"
                  />
                  <span className="ml-2 text-[12px] text-muted-foreground">{delayLabel(step.delay_hours)}</span>
                </div>

                {step.channel === "email" && (
                  <div>
                    <label className="block text-[12px] font-medium text-muted-foreground mb-1">Subject line</label>
                    <input
                      type="text"
                      value={step.subject ?? ""}
                      onChange={(e) => handleFieldChange(step.id, "subject", e.target.value)}
                      className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground"
                      placeholder="Email subject line"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[12px] font-medium text-muted-foreground mb-1">Body (HTML)</label>
                  <textarea
                    value={step.body_html}
                    onChange={(e) => handleFieldChange(step.id, "body_html", e.target.value)}
                    rows={8}
                    className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 font-mono text-[12px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground resize-y"
                    placeholder="<p>Email body HTML...</p>"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add step */}
      {showAddForm ? (
        <AddStepForm
          campaignId={campaign.id}
          nextStepNumber={steps.length + 1}
          onDone={(newStep) => {
            setSteps((prev) => [...prev, newStep]);
            setShowAddForm(false);
          }}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-[13px] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add step
        </button>
      )}
    </div>
  );
}

// ─── Add step inline form ───

interface AddStepFormProps {
  campaignId: string;
  nextStepNumber: number;
  onDone: (step: CampaignStep) => void;
  onCancel: () => void;
}

function AddStepForm({ campaignId, nextStepNumber, onDone, onCancel }: AddStepFormProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("<p></p>");
  const [delay, setDelay] = useState(24);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await addCampaignStep(campaignId, { subject, body_html: body, delay_hours: delay });
      onDone({
        id: crypto.randomUUID(),
        campaign_id: campaignId,
        step_number: nextStepNumber,
        channel: "email",
        subject,
        body_html: body,
        delay_hours: delay,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-foreground bg-white p-4 space-y-3">
      <p className="text-[13px] font-semibold text-foreground">New step #{nextStepNumber}</p>

      <div>
        <label className="block text-[12px] font-medium text-muted-foreground mb-1">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground"
          placeholder="Email subject"
        />
      </div>

      <div>
        <label className="block text-[12px] font-medium text-muted-foreground mb-1">Body HTML</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 font-mono text-[12px] focus:outline-none focus:ring-1 focus:ring-foreground resize-y"
        />
      </div>

      <div className="flex items-center gap-3">
        <div>
          <label className="block text-[12px] font-medium text-muted-foreground mb-1">Delay (hours)</label>
          <input
            type="number"
            min={0}
            value={delay}
            onChange={(e) => setDelay(Number(e.target.value))}
            className="w-28 rounded-lg border border-border bg-[#F5F5F7] px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground"
          />
        </div>
        <div className="flex gap-2 mt-5">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-[#1D1D1F] px-4 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
          >
            {isPending ? "Adding…" : "Add"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-1.5 text-[13px] text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
