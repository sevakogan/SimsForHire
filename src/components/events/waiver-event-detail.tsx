"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import QrGenerator from "@/components/qr/QrGenerator";
import { publishWaiverVersion } from "@/lib/actions/waiver-events";
import type {
  EventWithConfig,
  EventWaiverVersion,
  Racer,
} from "@/types/events";

interface Props {
  event: EventWithConfig;
  activeWaiver: EventWaiverVersion | null;
  versions: EventWaiverVersion[];
  signers: Racer[];
  signUrl: string;
}

export function WaiverEventDetail({
  event,
  activeWaiver,
  versions,
  signers,
  signUrl,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState(activeWaiver?.body ?? "");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handlePublish() {
    if (!confirm("Publish a new version of the waiver? Existing signatures keep their old version on record.")) return;
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        await publishWaiverVersion(event.id, draft);
        setSuccess(true);
        setEditing(false);
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
          <p className="mt-0.5 text-xs text-muted-foreground">Signatures</p>
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

      {/* QR + Sign URL */}
      <section className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">QR Code</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Print and place at your event entrance. Scanning opens the waiver-sign page.
            </p>
          </div>
          <a
            href={signUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            Open ↗
          </a>
        </div>
        <QrGenerator
          url={signUrl}
          filenamePrefix={`qr-waiver-${event.slug}`}
          brandDark="#E10600"
          brandLight="#0a0a12"
        />
      </section>

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
                onClick={handlePublish}
                disabled={pending || draft.trim() === (activeWaiver?.body ?? "").trim() || !draft.trim()}
                className="rounded-lg bg-[#E10600] px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
              >
                {pending ? "Publishing…" : "Save & Publish"}
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
          <div className="rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[12px] font-mono leading-relaxed whitespace-pre-wrap max-h-[480px] overflow-y-auto">
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

      {/* Signers list */}
      <section className="rounded-xl border border-border bg-white p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">Signatures</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Every row includes IP, user-agent, and the exact waiver version accepted — full legal audit trail.
          </p>
        </div>

        {signers.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center text-[13px] text-muted-foreground">
            No signatures yet. Share the QR code or this URL:
            <br />
            <code className="text-[11px]">{signUrl}</code>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground text-[11px] uppercase tracking-wide">
                  <th className="py-2 pr-3 font-semibold">Name</th>
                  <th className="py-2 pr-3 font-semibold">Email</th>
                  <th className="py-2 pr-3 font-semibold">Phone</th>
                  <th className="py-2 pr-3 font-semibold">Signature</th>
                  <th className="py-2 pr-3 font-semibold">Mkt</th>
                  <th className="py-2 pr-3 font-semibold">Ver</th>
                  <th className="py-2 pr-3 font-semibold">Signed</th>
                  <th className="py-2 pr-3 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody>
                {signers.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 last:border-0">
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
                    <td className="py-2 pr-3 text-muted-foreground">v{s.waiver_version}</td>
                    <td className="py-2 pr-3 text-muted-foreground">
                      {s.waiver_accepted_at
                        ? new Date(s.waiver_accepted_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground font-mono text-[11px]">
                      {s.waiver_accepted_ip ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
