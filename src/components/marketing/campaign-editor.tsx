"use client";

import { useState, useTransition, useCallback } from "react";
import type { CampaignWithSteps } from "@/lib/actions/campaigns";
import type { CampaignStep } from "@/types";
import {
  updateCampaignStep,
  updateCampaign,
  deleteCampaignStep,
  addCampaignStep,
  reorderCampaignSteps,
} from "@/lib/actions/campaigns";

interface CampaignEditorProps {
  campaign: CampaignWithSteps;
  onUpdate?: (updated: Partial<CampaignWithSteps>) => void;
}

function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<p[^>]*>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function textToHtml(text: string): string {
  if (!text.trim()) return "";
  return text
    .split(/\n\n+/)
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("");
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
  return `${days % 1 === 0 ? days : days.toFixed(1)}d after previous`;
}

export function CampaignEditor({ campaign, onUpdate }: CampaignEditorProps) {
  const [steps, setSteps] = useState<CampaignStep[]>(
    [...campaign.steps].sort((a, b) => a.step_number - b.step_number)
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Plain-text drafts for body fields — avoids HTML round-trip on every keystroke
  const [bodyDrafts, setBodyDrafts] = useState<Record<string, string>>(
    () => Object.fromEntries(campaign.steps.map((s) => [s.id, htmlToText(s.body_html)]))
  );

  // Inline name/description editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(campaign.name);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(campaign.description ?? "");

  async function handleSaveName() {
    setEditingName(false);
    if (nameValue.trim() === campaign.name) return;
    const trimmed = nameValue.trim() || campaign.name;
    setNameValue(trimmed);
    await updateCampaign(campaign.id, { name: trimmed });
    onUpdate?.({ id: campaign.id, name: trimmed });
  }

  async function handleSaveDesc() {
    setEditingDesc(false);
    if (descValue.trim() === (campaign.description ?? "")) return;
    await updateCampaign(campaign.id, { description: descValue.trim() || undefined });
    onUpdate?.({ id: campaign.id, description: descValue.trim() || undefined });
  }

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Update local state immediately (no server call)
  const handleFieldChange = useCallback(
    (stepId: string, field: "subject" | "body_html" | "delay_hours", value: string | number) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, [field]: value } : s))
      );
    },
    []
  );

  // Save to server on blur
  const handleFieldBlur = useCallback(
    (stepId: string, field: "subject" | "body_html" | "delay_hours", value: string | number) => {
      startTransition(() => {
        updateCampaignStep(stepId, { [field]: value });
      });
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

  // ── Drag-and-drop ──
  function handleDragStart(e: React.DragEvent, stepId: string) {
    setDraggedId(stepId);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent, stepId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (stepId !== draggedId) setDragOverId(stepId);
  }

  function handleDrop(e: React.DragEvent, targetId: string) {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    setSteps((prev) => {
      const fromIdx = prev.findIndex((s) => s.id === draggedId);
      const toIdx = prev.findIndex((s) => s.id === targetId);
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      const reordered = next.map((s, i) => ({ ...s, step_number: i + 1 }));

      startTransition(() => {
        reorderCampaignSteps(campaign.id, reordered.map((s) => s.id));
      });

      return reordered;
    });

    setDraggedId(null);
    setDragOverId(null);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverId(null);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-white px-5 py-4">
        <div className="min-w-0 flex-1 mr-4">
          {editingName ? (
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") { setNameValue(campaign.name); setEditingName(false); } }}
              className="w-full rounded-lg border border-foreground bg-[#F5F5F7] px-2 py-1 text-[15px] font-semibold text-foreground focus:outline-none"
            />
          ) : (
            <h2
              onClick={() => setEditingName(true)}
              className="text-[16px] font-semibold text-foreground cursor-text hover:text-foreground/70 transition-colors"
              title="Click to edit name"
            >
              {nameValue}
            </h2>
          )}
          {editingDesc ? (
            <input
              autoFocus
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              onBlur={handleSaveDesc}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveDesc(); if (e.key === "Escape") { setDescValue(campaign.description ?? ""); setEditingDesc(false); } }}
              placeholder="Add description…"
              className="mt-1 w-full rounded-lg border border-foreground bg-[#F5F5F7] px-2 py-0.5 text-[12px] text-muted-foreground focus:outline-none"
            />
          ) : (
            <p
              onClick={() => setEditingDesc(true)}
              className="mt-0.5 text-[13px] text-muted-foreground cursor-text hover:text-muted-foreground/70 transition-colors"
              title="Click to edit description"
            >
              {descValue || <span className="italic opacity-50">Add description…</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
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
        {steps.map((step) => {
          const isDragging = draggedId === step.id;
          const isDragOver = dragOverId === step.id;

          return (
            <div
              key={step.id}
              draggable
              onDragStart={(e) => handleDragStart(e, step.id)}
              onDragOver={(e) => handleDragOver(e, step.id)}
              onDrop={(e) => handleDrop(e, step.id)}
              onDragEnd={handleDragEnd}
              className={`rounded-xl border bg-white transition-all select-none ${
                isDragging ? "opacity-40 scale-[0.99]" : ""
              } ${isDragOver ? "border-foreground ring-1 ring-foreground/20" : step.is_active ? "border-border" : "border-border opacity-50"}`}
            >
              {/* Step header row */}
              <div className="flex items-center gap-2 px-3 py-3">
                {/* Drag handle */}
                <div className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground px-1 py-1 active:cursor-grabbing">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                  </svg>
                </div>

                {/* Step number */}
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                  {step.step_number}
                </span>

                {/* Channel badge */}
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${CHANNEL_COLOR[step.channel] ?? "bg-muted text-muted-foreground"}`}>
                  {CHANNEL_LABEL[step.channel] ?? step.channel}
                </span>

                {/* Subject / delay preview */}
                <button
                  onClick={() => setExpandedId(expandedId === step.id ? null : step.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="truncate text-[13px] font-medium text-foreground">
                    {step.subject || "(no subject)"}
                  </span>
                  <span className="ml-2 text-[11px] text-muted-foreground">
                    {delayLabel(step.delay_hours)}
                  </span>
                </button>

                {/* Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(step.id, step.is_active)}
                    disabled={isPending}
                    className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
                      step.is_active
                        ? "bg-[rgba(48,209,88,0.08)] text-[#30D158]"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.is_active ? "On" : "Off"}
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
                      Delay (hours from previous step)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={step.delay_hours}
                      onChange={(e) => handleFieldChange(step.id, "delay_hours", Number(e.target.value))}
                      onBlur={(e) => handleFieldBlur(step.id, "delay_hours", Number(e.target.value))}
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
                        onBlur={(e) => handleFieldBlur(step.id, "subject", e.target.value)}
                        className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground"
                        placeholder="Email subject line"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[12px] font-medium text-muted-foreground mb-1">Body</label>
                    <textarea
                      value={bodyDrafts[step.id] ?? ""}
                      onChange={(e) => setBodyDrafts((prev) => ({ ...prev, [step.id]: e.target.value }))}
                      onBlur={(e) => {
                        const html = textToHtml(e.target.value);
                        handleFieldChange(step.id, "body_html", html);
                        handleFieldBlur(step.id, "body_html", html);
                      }}
                      rows={8}
                      className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-foreground resize-y"
                      placeholder="Write your email here…"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
  const [body, setBody] = useState("");
  const [delay, setDelay] = useState(24);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await addCampaignStep(campaignId, { subject, body_html: textToHtml(body), delay_hours: delay });
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
        <label className="block text-[12px] font-medium text-muted-foreground mb-1">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-foreground resize-y"
          placeholder="Write your email here…"
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
