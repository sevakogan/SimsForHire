"use client";

import { useEffect, useState, useTransition } from "react";
import { setCampaignAdded } from "@/lib/actions/waiver-events";

export interface SignatureModalSigner {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  event_name?: string;
  marketing_opt_in?: boolean;
  waiver_version: number | null;
  waiver_accepted_at: string | null;
  waiver_accepted_ip: string | null;
  waiver_accepted_user_agent?: string | null;
  waiver_accepted_isp?: string | null;
  signature_data_url: string | null;
  // Email delivery + engagement
  email_sent_at?: string | null;
  email_opened_at?: string | null;
  email_open_count?: number | null;
  email_open_user_agent?: string | null;
  // Campaign tracking
  campaign_added_at?: string | null;
}

interface Props {
  signer: SignatureModalSigner | null;
  onClose: () => void;
}

/** Returns a short human-readable device label from a User-Agent string. */
function parseUA(ua: string | null | undefined): string {
  if (!ua) return "Unknown device";
  const u = ua;
  // OS
  let os = "Unknown";
  if (/iPhone/.test(u)) os = "iPhone";
  else if (/iPad/.test(u)) os = "iPad";
  else if (/Android/.test(u)) os = "Android";
  else if (/Windows/.test(u)) os = "Windows";
  else if (/Macintosh|Mac OS X/.test(u)) os = "Mac";
  else if (/Linux/.test(u)) os = "Linux";
  // Browser
  let browser = "Browser";
  if (/CriOS/.test(u)) browser = "Chrome";
  else if (/FxiOS/.test(u)) browser = "Firefox";
  else if (/EdgA|EdgiOS|Edg\//.test(u)) browser = "Edge";
  else if (/OPR|OPiOS/.test(u)) browser = "Opera";
  else if (/Chrome/.test(u)) browser = "Chrome";
  else if (/Firefox/.test(u)) browser = "Firefox";
  else if (/Safari/.test(u)) browser = "Safari";
  return `${os} · ${browser}`;
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export function SignatureModal({ signer, onClose }: Props) {
  const [campaignAddedAt, setCampaignAddedAt] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sync local campaign state when signer changes
  useEffect(() => {
    setCampaignAddedAt(signer?.campaign_added_at ?? null);
  }, [signer?.id, signer?.campaign_added_at]);

  useEffect(() => {
    if (!signer) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [signer, onClose]);

  if (!signer) return null;

  function toggleCampaign() {
    if (!signer) return;
    const next = !campaignAddedAt;
    setCampaignAddedAt(next ? new Date().toISOString() : null);
    startTransition(async () => {
      await setCampaignAdded(signer.id, next);
    });
  }

  const hasEmail = Boolean(signer.email);
  const isSent = Boolean(signer.email_sent_at);
  const isOpened = Boolean(signer.email_opened_at);
  const openCount = signer.email_open_count ?? 0;

  // Timeline step states: 0=future, 1=current, 2=done
  const stepQueued = hasEmail ? 2 : 0;
  const stepSent = isSent ? 2 : hasEmail ? 1 : 0;
  const stepOpened = isOpened ? 2 : isSent ? 1 : 0;

  function stepColor(state: number) {
    if (state === 2) return "bg-green-500 border-green-500 text-white";
    if (state === 1) return "bg-amber-400 border-amber-400 text-white";
    return "bg-white border-border text-muted-foreground";
  }
  function lineColor(active: boolean) {
    return active ? "bg-green-400" : "bg-border";
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border bg-[#F5F5F7] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{signer.name}</h2>
            {signer.event_name && (
              <p className="text-[12px] text-muted-foreground mt-0.5">{signer.event_name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-white hover:text-foreground transition-colors shrink-0"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          <div className="p-5 space-y-5">

            {/* Quick actions */}
            <div className="flex flex-wrap items-center gap-2">
              {signer.email && (
                <a
                  href={`mailto:${signer.email}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-[12px] font-medium text-foreground hover:border-foreground/40 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </a>
              )}
              {signer.phone && (
                <a
                  href={`tel:${signer.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-[12px] font-medium text-foreground hover:border-foreground/40 transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {signer.phone}
                </a>
              )}
              {signer.marketing_opt_in !== undefined && (
                <span className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${signer.marketing_opt_in ? "bg-green-50 text-green-700 border border-green-200" : "bg-[#F5F5F7] text-muted-foreground border border-border"}`}>
                  {signer.marketing_opt_in ? "✓ Marketing opt-in" : "No marketing"}
                </span>
              )}
            </div>

            {/* Email journey */}
            <div className="rounded-xl border border-border bg-[#F5F5F7] p-4">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-4">
                Email Journey
              </p>
              {!hasEmail ? (
                <p className="text-[13px] text-muted-foreground">No email address captured.</p>
              ) : (
                <>
                  {/* Timeline dots + lines */}
                  <div className="flex items-center gap-0">
                    {/* Queued */}
                    <div className="flex flex-col items-center gap-1 min-w-[72px]">
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${stepColor(stepQueued)}`}>
                        {stepQueued === 2 ? "✓" : "1"}
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">Queued</span>
                    </div>
                    <div className={`h-0.5 flex-1 mb-4 ${lineColor(stepSent >= 2)}`} />
                    {/* Sent */}
                    <div className="flex flex-col items-center gap-1 min-w-[80px]">
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${stepColor(stepSent)}`}>
                        {stepSent === 2 ? "✓" : "2"}
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">Sent</span>
                      {signer.email_sent_at && (
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">
                          {fmt(signer.email_sent_at)}
                        </span>
                      )}
                    </div>
                    <div className={`h-0.5 flex-1 mb-4 ${lineColor(stepOpened >= 2)}`} />
                    {/* Opened */}
                    <div className="flex flex-col items-center gap-1 min-w-[80px]">
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${stepColor(stepOpened)}`}>
                        {stepOpened === 2 ? "✓" : "3"}
                      </div>
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        Opened{openCount > 1 ? ` (${openCount}×)` : ""}
                      </span>
                      {signer.email_opened_at && (
                        <span className="text-[10px] text-muted-foreground text-center leading-tight">
                          {fmt(signer.email_opened_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Open device */}
                  {signer.email_open_user_agent && (
                    <p className="mt-3 text-[11px] text-muted-foreground">
                      Opened on: <span className="font-medium text-foreground">{parseUA(signer.email_open_user_agent)}</span>
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Waiver details */}
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
              <div>
                <dt className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Signed</dt>
                <dd className="mt-0.5 text-foreground">{fmt(signer.waiver_accepted_at)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Waiver Version</dt>
                <dd className="mt-0.5 text-foreground">v{signer.waiver_version ?? "?"}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">IP Address</dt>
                <dd className="mt-0.5 font-mono text-[12px] text-foreground">{signer.waiver_accepted_ip ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Carrier / ISP</dt>
                <dd className="mt-0.5 text-foreground">{signer.waiver_accepted_isp ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Signed On</dt>
                <dd className="mt-0.5 text-foreground">{parseUA(signer.waiver_accepted_user_agent)}</dd>
              </div>
            </dl>

            {/* Campaign status */}
            <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${campaignAddedAt ? "border-purple-200 bg-purple-50" : "border-border bg-[#F5F5F7]"}`}>
              <div>
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Ad Campaign</p>
                {campaignAddedAt ? (
                  <p className="mt-0.5 text-[12px] font-medium text-purple-700">
                    Added {fmt(campaignAddedAt)}
                  </p>
                ) : (
                  <p className="mt-0.5 text-[12px] text-muted-foreground">Not yet added to a campaign</p>
                )}
              </div>
              <button
                type="button"
                onClick={toggleCampaign}
                disabled={isPending}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-50 ${
                  campaignAddedAt
                    ? "border border-purple-300 bg-white text-purple-700 hover:bg-purple-50"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {isPending ? "…" : campaignAddedAt ? "Undo" : "Mark added"}
              </button>
            </div>

            {/* Signature image */}
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                Drawn Signature
              </p>
              {signer.signature_data_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signer.signature_data_url}
                  alt={`${signer.name} signature`}
                  className="w-full rounded-lg border-2 border-dashed border-border bg-white p-2"
                />
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-[#F5F5F7] p-6 text-center text-[12px] text-muted-foreground">
                  No drawn signature on file
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
