"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import QrGenerator from "@/components/qr/QrGenerator";
import { SignatureModal, type SignatureModalSigner } from "@/components/signers/signature-modal";
import { deleteSigner, publishWaiverVersion } from "@/lib/actions/waiver-events";
import {
  pointUniversalAtEvent,
  updateQrRedirect,
  type QrRedirect,
  type QrRedirectWithEvent,
} from "@/lib/actions/qr-redirects";
import type {
  EventWithConfig,
  EventWaiverVersion,
  Racer,
} from "@/types/events";

type LeadSortKey = "event_date" | "name" | "email" | "phone" | "signed";
type LeadSortDir = "asc" | "desc";

function formatEventDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface Props {
  event: EventWithConfig;
  activeWaiver: EventWaiverVersion | null;
  versions: EventWaiverVersion[];
  signers: Racer[];
  /** Direct, non-redirected URL to the public sign page (used as default QR destination). */
  signUrl: string;
  /** The dedicated QR redirect for this event, or null if none yet exists. */
  primaryQr: QrRedirect | null;
  /** Absolute URL the dedicated QR encodes (https://.../qr/<token>). */
  primaryQrUrl: string | null;
  /** The universal General QR. */
  universalQr: QrRedirectWithEvent;
  universalQrUrl: string;
}

export function WaiverEventDetail({
  event,
  activeWaiver,
  versions,
  signers,
  signUrl,
  primaryQr,
  primaryQrUrl,
  universalQr,
  universalQrUrl,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState(activeWaiver?.body ?? "");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeSigner, setActiveSigner] = useState<SignatureModalSigner | null>(null);
  const [sortKey, setSortKey] = useState<LeadSortKey>("signed");
  const [sortDir, setSortDir] = useState<LeadSortDir>("desc");

  function toggleSort(key: LeadSortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "signed" ? "desc" : "asc");
    }
  }
  function indicator(key: LeadSortKey) {
    if (sortKey !== key) return <span className="opacity-30">↕</span>;
    return <span>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  // Optimistic local copy so a successful delete vanishes immediately.
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  // Inline two-stage confirm: first click stages, second commits, auto-clears in 5s.
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function stageDelete(id: string) {
    setConfirmingId(id);
    setDeleteError(null);
    window.setTimeout(() => {
      setConfirmingId((cur) => (cur === id ? null : cur));
    }, 5000);
  }

  async function commitDelete(id: string) {
    setDeleting(id);
    setDeleteError(null);
    try {
      const r = await deleteSigner(id);
      if (r.ok) {
        setRemoved((prev) => new Set(prev).add(id));
        setConfirmingId(null);
        router.refresh();
      } else {
        setDeleteError(`Couldn't delete: ${r.error}`);
      }
    } finally {
      setDeleting(null);
    }
  }

  const sortedSigners = useMemo(() => {
    const visible = signers.filter((s) => !removed.has(s.id));
    const dir = sortDir === "asc" ? 1 : -1;
    const collator = new Intl.Collator("en", { sensitivity: "base" });
    return [...visible].sort((a, b) => {
      switch (sortKey) {
        case "event_date":
        case "signed": {
          const av = a.waiver_accepted_at ? Date.parse(a.waiver_accepted_at) : 0;
          const bv = b.waiver_accepted_at ? Date.parse(b.waiver_accepted_at) : 0;
          return (av - bv) * dir;
        }
        case "name":
          return collator.compare(a.name, b.name) * dir;
        case "email":
          return collator.compare(a.email ?? "", b.email ?? "") * dir;
        case "phone":
          return collator.compare(a.phone ?? "", b.phone ?? "") * dir;
      }
    });
  }, [signers, sortKey, sortDir, removed]);

  function handleDownloadXlsx() {
    if (sortedSigners.length === 0) return;
    const rows = sortedSigners.map((s) => ({
      "Event Date": formatEventDate(s.waiver_accepted_at),
      Name: s.name,
      Email: s.email ?? "",
      Phone: s.phone ?? "",
      Event: event.name,
      "Marketing Opt-In": s.marketing_opt_in ? "Yes" : "No",
      "Waiver Version": s.waiver_version ?? "",
      "Signed At": s.waiver_accepted_at
        ? new Date(s.waiver_accepted_at).toISOString()
        : "",
      IP: s.waiver_accepted_ip ?? "",
      "Carrier / ISP": s.waiver_accepted_isp ?? "",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const cols = Object.keys(rows[0]);
    sheet["!cols"] = cols.map((c) => ({
      wch: Math.min(
        50,
        Math.max(
          c.length,
          ...rows.map((r) => String(r[c as keyof typeof r] ?? "").length)
        ) + 2
      ),
    }));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Leads");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(book, `leads-${event.slug}-${stamp}.xlsx`);
  }

  // Two-stage publish: first click arms, second click within 5s commits.
  const [confirmingPublish, setConfirmingPublish] = useState(false);

  function armPublish() {
    setConfirmingPublish(true);
    window.setTimeout(() => setConfirmingPublish(false), 5000);
  }

  function handlePublish() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        await publishWaiverVersion(event.id, draft);
        setSuccess(true);
        setEditing(false);
        setConfirmingPublish(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to publish");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-2xl font-bold text-foreground">{signers.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Leads</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-2xl font-bold text-foreground">v{activeWaiver?.version ?? "—"}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Active waiver version</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4">
          <p className="text-2xl font-bold text-foreground">{versions.length}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Total versions</p>
        </div>
      </div>

      {/* QR section */}
      <QrSection
        event={event}
        signUrl={signUrl}
        primaryQr={primaryQr}
        primaryQrUrl={primaryQrUrl}
        universalQr={universalQr}
        universalQrUrl={universalQrUrl}
      />

      {/* Waiver editor */}
      <section className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Waiver Text</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Currently active: v{activeWaiver?.version ?? "—"}. Editing creates a new version — old ones stay on record for audit.
            </p>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg bg-[#1D1D1F] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-80 transition-opacity"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDraft(activeWaiver?.body ?? "");
                  setEditing(false);
                  setError(null);
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmingPublish ? handlePublish : armPublish}
                disabled={pending || draft.trim() === (activeWaiver?.body ?? "").trim() || !draft.trim()}
                className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                style={{ backgroundColor: confirmingPublish ? "#9c1010" : "#E10600" }}
              >
                {pending
                  ? "Publishing…"
                  : confirmingPublish
                    ? "Click again to confirm"
                    : "Save & Publish"}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-700">
            {error}
          </div>
        )}
        {success && !editing && (
          <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-[12px] text-green-700">
            New version published.
          </div>
        )}

        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={20}
            className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[12px] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#E10600]/30 focus:border-[#E10600]"
          />
        ) : (
          <div className="rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[11px] font-mono leading-snug whitespace-pre-wrap max-h-24 overflow-y-auto text-muted-foreground">
            {activeWaiver?.body ?? "(No waiver versions yet)"}
          </div>
        )}

        {versions.length > 1 && (
          <details className="mt-4">
            <summary className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground cursor-pointer">
              Version History ({versions.length})
            </summary>
            <ul className="mt-3 space-y-1.5 text-[12px]">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between border-b border-border/50 pb-1.5 last:border-0"
                >
                  <span>
                    v{v.version}
                    {activeWaiver?.id === v.id && (
                      <span className="ml-2 text-green-600">● ACTIVE</span>
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(v.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* Leads list */}
      <section className="rounded-xl border border-border bg-white p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Leads</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Every row includes IP, user-agent, and the exact waiver version accepted — full legal audit trail.
            </p>
          </div>
          {sortedSigners.length > 0 && (
            <button
              onClick={handleDownloadXlsx}
              className="shrink-0 rounded-lg bg-[#1D7A3A] px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 transition-opacity"
              title="Download all leads as Excel (.xlsx)"
            >
              ↓ Excel ({sortedSigners.length})
            </button>
          )}
        </div>

        {deleteError && (
          <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-700">
            {deleteError}
          </div>
        )}

        {sortedSigners.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center text-[13px] text-muted-foreground">
            No leads yet. Share the QR code or this URL:
            <br />
            <code className="text-[11px]">{signUrl}</code>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground text-[11px] uppercase tracking-wide">
                  <th className="py-2 pr-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort("event_date")}
                      className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                    >
                      Event Date {indicator("event_date")}
                    </button>
                  </th>
                  <th className="py-2 pr-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort("name")}
                      className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                    >
                      Name {indicator("name")}
                    </button>
                  </th>
                  <th className="py-2 pr-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort("email")}
                      className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                    >
                      Email {indicator("email")}
                    </button>
                  </th>
                  <th className="py-2 pr-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort("phone")}
                      className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                    >
                      Phone {indicator("phone")}
                    </button>
                  </th>
                  <th className="py-2 pr-3 font-semibold">Signature</th>
                  <th className="py-2 pr-3 font-semibold">Mkt</th>
                  <th className="py-2 pr-3 font-semibold" title="Confirmation email open status">Email</th>
                  <th className="py-2 pr-3 font-semibold">Ver</th>
                  <th className="py-2 pr-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort("signed")}
                      className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                    >
                      Signed {indicator("signed")}
                    </button>
                  </th>
                  <th className="py-2 pr-3 font-semibold" title="Hover IP/Carrier cell to see IP">Carrier</th>
                  <th className="py-2 pr-3 font-semibold w-8"></th>
                </tr>
              </thead>
              <tbody>
                {sortedSigners.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() =>
                      setActiveSigner({
                        id: s.id,
                        name: s.name,
                        email: s.email,
                        phone: s.phone,
                        event_name: event.name,
                        marketing_opt_in: s.marketing_opt_in,
                        waiver_version: s.waiver_version,
                        waiver_accepted_at: s.waiver_accepted_at,
                        waiver_accepted_ip: s.waiver_accepted_ip,
                        waiver_accepted_user_agent: s.waiver_accepted_user_agent,
                        waiver_accepted_isp: s.waiver_accepted_isp,
                        signature_data_url: s.signature_data_url,
                        email_sent_at: s.email_sent_at,
                        email_opened_at: s.email_opened_at,
                        email_open_count: s.email_open_count,
                        email_open_user_agent: s.email_open_user_agent,
                        campaign_added_at: s.campaign_added_at,
                      })
                    }
                  >
                    <td className="py-2 pr-3 whitespace-nowrap font-semibold text-foreground">
                      {formatEventDate(s.waiver_accepted_at)}
                    </td>
                    <td className="py-2 pr-3 font-medium text-foreground">{s.name}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{s.email}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{s.phone || "—"}</td>
                    <td className="py-2 pr-3">
                      {s.signature_data_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.signature_data_url}
                          alt="signature"
                          className="h-8 w-20 object-contain bg-white rounded border border-border"
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      {s.marketing_opt_in ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {!s.email ? (
                        <span className="text-muted-foreground" title="No email captured">—</span>
                      ) : s.email_opened_at ? (
                        <span
                          className="text-green-600"
                          title={`Opened ${new Date(s.email_opened_at).toLocaleString()}${(s.email_open_count ?? 0) > 1 ? ` · ${s.email_open_count} times` : ""}`}
                        >
                          ✓ Opened{(s.email_open_count ?? 0) > 1 ? ` (${s.email_open_count})` : ""}
                        </span>
                      ) : s.email_sent_at ? (
                        <span className="text-amber-600" title={`Sent ${new Date(s.email_sent_at).toLocaleString()} — not yet opened`}>○ Sent</span>
                      ) : (
                        <span className="text-blue-500" title="Queued — will be sent by daily drainer">⏳ Queued</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">v{s.waiver_version}</td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {s.waiver_accepted_at
                        ? new Date(s.waiver_accepted_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground text-[12px]" title={s.waiver_accepted_ip ?? ""}>
                      {s.waiver_accepted_isp ?? (
                        <span className="font-mono text-[11px]">{s.waiver_accepted_ip ?? "—"}</span>
                      )}
                    </td>
                    <td className="py-2 pr-3" onClick={(e) => e.stopPropagation()}>
                      {confirmingId === s.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => commitDelete(s.id)}
                            disabled={deleting === s.id}
                            className="rounded-md bg-red-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                            aria-label={`Confirm delete ${s.name}`}
                          >
                            {deleting === s.id ? "…" : "Delete?"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingId(null)}
                            disabled={deleting === s.id}
                            className="rounded-md border border-border p-1 text-muted-foreground hover:text-foreground"
                            aria-label="Cancel delete"
                            title="Cancel"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => stageDelete(s.id)}
                          className="rounded-md p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete this lead"
                          aria-label={`Delete ${s.name}`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <SignatureModal signer={activeSigner} onClose={() => setActiveSigner(null)} />
    </div>
  );
}

/* ── QR sub-section ─────────────────────────────────────────── */

function QrSection({
  event,
  signUrl,
  primaryQr,
  primaryQrUrl,
  universalQr,
  universalQrUrl,
}: {
  event: EventWithConfig;
  signUrl: string;
  primaryQr: QrRedirect | null;
  primaryQrUrl: string | null;
  universalQr: QrRedirectWithEvent;
  universalQrUrl: string;
}) {
  const router = useRouter();
  const [pending, startQrTransition] = useTransition();
  const [editingDest, setEditingDest] = useState(false);
  const [destDraft, setDestDraft] = useState(
    primaryQr?.destination_url ?? `/waiver/${event.slug}`
  );
  const [confirmingPoint, setConfirmingPoint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const universalPointsHere =
    universalQr.event_id === event.id ||
    universalQr.destination_url === `/waiver/${event.slug}`;

  function saveDest() {
    if (!primaryQr) return;
    setError(null);
    startQrTransition(async () => {
      const r = await updateQrRedirect(primaryQr.token, {
        destinationUrl: destDraft,
      });
      if (r.ok) {
        setEditingDest(false);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  function pointGeneralHere() {
    setError(null);
    setConfirmingPoint(false);
    startQrTransition(async () => {
      const r = await pointUniversalAtEvent(event.id);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-border bg-white p-6 space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-700">
          {error}
        </div>
      )}

      {/* General QR control */}
      <div className="rounded-lg border-2 border-dashed border-[#FF5BA7]/40 bg-[#FF5BA7]/[0.04] p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#FF5BA7]">
              General QR (universal)
            </p>
            <p className="mt-1 text-[13px] font-semibold text-foreground">
              Currently points to:{" "}
              <span className="font-mono text-[12px] text-muted-foreground">
                {universalQr.destination_url}
              </span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Token <span className="font-mono">{universalQr.token}</span> · {universalQr.scan_count} scans
            </p>
          </div>
          {universalPointsHere ? (
            <span className="shrink-0 rounded-full bg-green-50 text-green-700 border border-green-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
              ✓ Pointed Here
            </span>
          ) : confirmingPoint ? (
            <div className="flex gap-1">
              <button
                onClick={pointGeneralHere}
                disabled={pending}
                className="rounded-md bg-[#FF5BA7] px-3 py-1.5 text-[11px] font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "…" : "Confirm"}
              </button>
              <button
                onClick={() => setConfirmingPoint(false)}
                disabled={pending}
                className="rounded-md border border-border px-2 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingPoint(true)}
              className="shrink-0 rounded-lg bg-[#FF5BA7] px-3 py-1.5 text-[12px] font-bold text-white hover:opacity-90 transition-opacity"
              title="Re-point the General QR to this event"
            >
              Point General QR Here
            </button>
          )}
        </div>
      </div>

      {/* Per-event dedicated QR */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Event QR{primaryQr ? "" : " (not yet created)"}
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              {primaryQr
                ? "Dedicated to this event. The QR pattern stays the same — only the destination is editable."
                : "Will be auto-created on first save."}
            </p>
          </div>
          {primaryQrUrl && (
            <a
              href={primaryQrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              Test ↗
            </a>
          )}
        </div>

        {primaryQr && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 mb-5 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                Destination URL
              </span>
              <span className="text-[11px] text-muted-foreground">
                {primaryQr.scan_count} scans · token{" "}
                <span className="font-mono">{primaryQr.token}</span>
              </span>
            </div>
            {editingDest ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={destDraft}
                  onChange={(e) => setDestDraft(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveDest();
                    if (e.key === "Escape") {
                      setDestDraft(primaryQr.destination_url);
                      setEditingDest(false);
                    }
                  }}
                  className="flex-1 rounded-md border border-border bg-white px-2 py-1.5 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5BA7]/40 focus:border-[#FF5BA7]"
                />
                <button
                  onClick={saveDest}
                  disabled={pending}
                  className="rounded-md bg-[#FF5BA7] px-3 py-1.5 text-[12px] font-bold text-white hover:opacity-90 disabled:opacity-50"
                >
                  {pending ? "…" : "Save"}
                </button>
                <button
                  onClick={() => {
                    setDestDraft(primaryQr.destination_url);
                    setEditingDest(false);
                  }}
                  disabled={pending}
                  className="rounded-md border border-border px-2 py-1.5 text-[12px] text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <code className="flex-1 truncate text-[13px] text-foreground font-mono">
                  {primaryQr.destination_url}
                </code>
                <button
                  onClick={() => setEditingDest(true)}
                  className="shrink-0 rounded-md border border-border bg-white px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  ✎ Edit
                </button>
              </div>
            )}
          </div>
        )}

        <QrGenerator
          url={primaryQrUrl ?? signUrl}
          logoSrcDark="/sims-logo-black.png"
          logoSrcLight="/sims-logo-white.png"
          filenamePrefix={`qr-waiver-${event.slug}`}
          brandDark="#FF5BA7"
          brandLight="#0a0a12"
        />
      </div>
    </section>
  );
}
