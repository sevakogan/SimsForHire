"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createQrRedirect,
  deleteQrRedirect,
  updateQrRedirect,
  type QrRedirectWithEvent,
} from "@/lib/actions/qr-redirects";
import QrGenerator from "@/components/qr/QrGenerator";

type QrRow = QrRedirectWithEvent & { tokenUrl: string };

interface Props {
  initial: QrRow[];
}

export function QrCodesView({ initial }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [editingDest, setEditingDest] = useState<string | null>(null);
  const [destDraft, setDestDraft] = useState("");
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [labelDraft, setLabelDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newDest, setNewDest] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [pending, startTransition] = useTransition();
  const [expandedToken, setExpandedToken] = useState<string | null>(null);

  const visible = rows.filter((r) => !removed.has(r.token));

  function startEditDest(row: QrRow) {
    setEditingDest(row.token);
    setDestDraft(row.destination_url);
    setError(null);
  }

  function saveDest(token: string) {
    setError(null);
    startTransition(async () => {
      const r = await updateQrRedirect(token, { destinationUrl: destDraft });
      if (r.ok) {
        setRows((prev) =>
          prev.map((x) => (x.token === token ? { ...x, destination_url: destDraft.trim() } : x))
        );
        setEditingDest(null);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  function startEditLabel(row: QrRow) {
    setEditingLabel(row.token);
    setLabelDraft(row.label ?? "");
    setError(null);
  }

  function saveLabel(token: string) {
    setError(null);
    startTransition(async () => {
      const r = await updateQrRedirect(token, { label: labelDraft.trim() || null });
      if (r.ok) {
        setRows((prev) =>
          prev.map((x) =>
            x.token === token ? { ...x, label: labelDraft.trim() || null } : x
          )
        );
        setEditingLabel(null);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  function commitDelete(token: string) {
    setError(null);
    startTransition(async () => {
      const r = await deleteQrRedirect(token);
      if (r.ok) {
        setRemoved((prev) => new Set(prev).add(token));
        setConfirmingDelete(null);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  function handleCreate() {
    if (!newDest.trim()) {
      setError("Destination URL is required");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const created = await createQrRedirect({
          destinationUrl: newDest,
          label: newLabel.trim() || null,
        });
        // Optimistically add — page refresh will replace with canonical row
        setRows((prev) => [
          {
            ...created,
            event_name: null,
            event_slug: null,
            tokenUrl: `${typeof window !== "undefined" ? window.location.origin : ""}/qr/${created.token}`,
          },
          ...prev,
        ]);
        setNewDest("");
        setNewLabel("");
        setShowCreate(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create");
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {/* Create new */}
      <div className="rounded-xl border border-border bg-white p-4">
        {showCreate ? (
          <div className="space-y-3">
            <p className="text-[12px] font-semibold text-foreground">New QR Redirect</p>
            <input
              type="text"
              value={newDest}
              onChange={(e) => setNewDest(e.target.value)}
              placeholder="Destination URL (e.g. /waiver/spring-2026 or https://example.com)"
              className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FF5BA7]/30 focus:border-[#FF5BA7]"
            />
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Optional label (admin-only nickname)"
              className="w-full rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FF5BA7]/30 focus:border-[#FF5BA7]"
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={pending}
                className="rounded-lg bg-[#FF5BA7] px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {pending ? "Creating…" : "Create QR"}
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewDest("");
                  setNewLabel("");
                  setError(null);
                }}
                className="rounded-lg border border-border px-4 py-2 text-[13px] text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-[#FF5BA7] px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90"
          >
            + New QR Redirect
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {visible.map((row) => (
          <div
            key={row.token}
            className={`rounded-xl border bg-white p-4 ${
              row.is_universal ? "border-[#FF5BA7]/50 bg-[#FF5BA7]/[0.03]" : "border-border"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {row.is_universal && (
                    <span className="rounded-full bg-[#FF5BA7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      ★ General
                    </span>
                  )}
                  {editingLabel === row.token ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={labelDraft}
                        onChange={(e) => setLabelDraft(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveLabel(row.token);
                          if (e.key === "Escape") setEditingLabel(null);
                        }}
                        className="flex-1 rounded-md border border-border px-2 py-1 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#FF5BA7]/30"
                      />
                      <button
                        onClick={() => saveLabel(row.token)}
                        disabled={pending}
                        className="rounded-md bg-[#FF5BA7] px-2 py-1 text-[11px] font-bold text-white"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingLabel(null)}
                        className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-semibold text-foreground">
                        {row.label ?? "(no label)"}
                      </span>
                      <button
                        onClick={() => startEditLabel(row)}
                        className="text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        ✎
                      </button>
                    </>
                  )}
                </div>

                <div className="mt-1 text-[11px] text-muted-foreground">
                  Token <span className="font-mono">{row.token}</span> · {row.scan_count} scans
                  {row.event_name && (
                    <>
                      {" · "}
                      <a className="underline" href={`/events/${row.event_slug}`}>
                        {row.event_name}
                      </a>
                    </>
                  )}
                </div>

                {/* Destination */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground shrink-0">
                    →
                  </span>
                  {editingDest === row.token ? (
                    <>
                      <input
                        type="text"
                        value={destDraft}
                        onChange={(e) => setDestDraft(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveDest(row.token);
                          if (e.key === "Escape") setEditingDest(null);
                        }}
                        className="flex-1 rounded-md border border-border bg-white px-2 py-1.5 text-[13px] font-mono focus:outline-none focus:ring-2 focus:ring-[#FF5BA7]/30 focus:border-[#FF5BA7]"
                      />
                      <button
                        onClick={() => saveDest(row.token)}
                        disabled={pending}
                        className="rounded-md bg-[#FF5BA7] px-2.5 py-1.5 text-[12px] font-bold text-white"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingDest(null)}
                        className="rounded-md border border-border px-2.5 py-1.5 text-[12px] text-muted-foreground"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <code className="flex-1 truncate text-[13px] font-mono text-foreground">
                        {row.destination_url}
                      </code>
                      <button
                        onClick={() => startEditDest(row)}
                        className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        ✎ Edit
                      </button>
                    </>
                  )}
                </div>

                <p className="mt-2 text-[11px] text-muted-foreground font-mono break-all">
                  QR encodes: {row.tokenUrl}
                </p>
              </div>

              {/* Actions */}
              <div className="shrink-0 flex flex-col items-end gap-1">
                <button
                  onClick={() =>
                    setExpandedToken(expandedToken === row.token ? null : row.token)
                  }
                  className="rounded-md border border-border bg-white px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  {expandedToken === row.token ? "Hide QR" : "Show QR"}
                </button>
                {!row.is_universal && (
                  confirmingDelete === row.token ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => commitDelete(row.token)}
                        disabled={pending}
                        className="rounded-md bg-red-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {pending ? "…" : "Delete?"}
                      </button>
                      <button
                        onClick={() => setConfirmingDelete(null)}
                        className="rounded-md border border-border px-1.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setConfirmingDelete(row.token);
                        window.setTimeout(
                          () =>
                            setConfirmingDelete((cur) =>
                              cur === row.token ? null : cur
                            ),
                          5000
                        );
                      }}
                      className="rounded-md border border-border bg-white px-2 py-1 text-[11px] text-muted-foreground hover:text-red-600 hover:border-red-200"
                    >
                      Delete
                    </button>
                  )
                )}
              </div>
            </div>

            {expandedToken === row.token && (
              <div className="mt-4 pt-4 border-t border-border">
                <QrGenerator
                  url={row.tokenUrl}
                  logoSrcDark="/sims-logo-black.png"
                  logoSrcLight="/sims-logo-white.png"
                  filenamePrefix={`qr-${row.label?.replace(/\s+/g, "-").toLowerCase() ?? row.token}`}
                  brandDark="#FF5BA7"
                  brandLight="#0a0a12"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-white py-16 text-center text-[13px] text-muted-foreground">
          No QR redirects yet. Click &ldquo;+ New QR Redirect&rdquo; to create one.
        </div>
      )}
    </div>
  );
}
