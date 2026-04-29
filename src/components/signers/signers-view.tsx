"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { SignatureModal, type SignatureModalSigner } from "@/components/signers/signature-modal";
import { deleteSigner, type SignerWithEvent } from "@/lib/actions/waiver-events";

interface Props {
  signers: SignerWithEvent[];
}

type SortKey = "event_date" | "name" | "email" | "phone" | "signed";
type SortDir = "asc" | "desc";

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

export function SignersView({ signers }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("");
  const [activeSigner, setActiveSigner] = useState<SignatureModalSigner | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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
        startTransition(() => router.refresh());
      } else {
        setDeleteError(`Couldn't delete: ${r.error}`);
      }
    } finally {
      setDeleting(null);
    }
  }
  // Default: most recent signature first.
  const [sortKey, setSortKey] = useState<SortKey>("signed");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "signed" ? "desc" : "asc");
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return <span className="opacity-30">↕</span>;
    return <span>{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const eventOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of signers) {
      if (s.event_slug) map.set(s.event_slug, s.event_name);
    }
    return Array.from(map.entries())
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [signers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = signers.filter((s) => {
      if (removed.has(s.id)) return false;
      if (eventFilter && s.event_slug !== eventFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q) ||
        (s.phone ?? "").toLowerCase().includes(q) ||
        s.event_name.toLowerCase().includes(q)
      );
    });

    const dir = sortDir === "asc" ? 1 : -1;
    const collator = new Intl.Collator("en", { sensitivity: "base" });
    return [...matches].sort((a, b) => {
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
  }, [signers, query, eventFilter, sortKey, sortDir, removed]);

  function handleDownloadXlsx() {
    if (filtered.length === 0) return;
    const rows = filtered.map((s) => ({
      "Event Date": formatEventDate(s.waiver_accepted_at),
      Name: s.name,
      Email: s.email ?? "",
      Phone: s.phone ?? "",
      Event: s.event_name,
      "Event Slug": s.event_slug,
      "Marketing Opt-In": s.marketing_opt_in ? "Yes" : "No",
      "Waiver Version": s.waiver_version ?? "",
      "Signed At": s.waiver_accepted_at
        ? new Date(s.waiver_accepted_at).toISOString()
        : "",
      IP: s.waiver_accepted_ip ?? "",
      "Carrier / ISP": s.waiver_accepted_isp ?? "",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    // Auto-fit columns by max content length
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
    XLSX.utils.book_append_sheet(book, sheet, "Signers");
    const stamp = new Date().toISOString().slice(0, 10);
    const filename =
      eventFilter && eventOptions.length > 0
        ? `signers-${eventFilter}-${stamp}.xlsx`
        : `signers-all-${stamp}.xlsx`;
    XLSX.writeFile(book, filename);
  }

  function handleDownloadCsv() {
    if (filtered.length === 0) return;
    const header = [
      "Event Date",
      "Name",
      "Email",
      "Phone",
      "Event",
      "Marketing",
      "Version",
      "Signed At",
      "IP",
      "Carrier / ISP",
    ];
    const csvRows = filtered.map((s) =>
      [
        formatEventDate(s.waiver_accepted_at),
        s.name,
        s.email ?? "",
        s.phone ?? "",
        s.event_name,
        s.marketing_opt_in ? "Yes" : "No",
        s.waiver_version ?? "",
        s.waiver_accepted_at ?? "",
        s.waiver_accepted_ip ?? "",
        s.waiver_accepted_isp ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (signers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white py-20 text-center">
        <p className="text-sm font-medium text-foreground">No signatures yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create a waiver event and share its QR code to start collecting signatures.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deleteError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-700">
          {deleteError}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, phone, or event…"
          className="min-w-0 flex-1 rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E10600]/30 focus:border-[#E10600]"
        />
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="rounded-lg border border-border bg-[#F5F5F7] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#E10600]/30 focus:border-[#E10600]"
        >
          <option value="">All events ({signers.length})</option>
          {eventOptions.map((e) => (
            <option key={e.slug} value={e.slug}>
              {e.name}
            </option>
          ))}
        </select>
        <span className="text-[12px] text-muted-foreground">
          Showing {filtered.length}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleDownloadXlsx}
            disabled={filtered.length === 0}
            className="rounded-lg bg-[#1D7A3A] px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            title="Download as Excel (.xlsx)"
          >
            ↓ Excel
          </button>
          <button
            onClick={handleDownloadCsv}
            disabled={filtered.length === 0}
            className="rounded-lg border border-border bg-white px-3 py-1.5 text-[12px] text-foreground hover:border-foreground/30 transition-colors disabled:opacity-40"
            title="Download as CSV (universal — opens in Sheets, Excel, Numbers)"
          >
            ↓ CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground text-[11px] uppercase tracking-wide">
              <th className="px-3 py-2 font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort("event_date")}
                  className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                >
                  Event Date {sortIndicator("event_date")}
                </button>
              </th>
              <th className="px-3 py-2 font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort("name")}
                  className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                >
                  Name {sortIndicator("name")}
                </button>
              </th>
              <th className="px-3 py-2 font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort("email")}
                  className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                >
                  Email {sortIndicator("email")}
                </button>
              </th>
              <th className="px-3 py-2 font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort("phone")}
                  className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                >
                  Phone {sortIndicator("phone")}
                </button>
              </th>
              <th className="px-3 py-2 font-semibold">Event</th>
              <th className="px-3 py-2 font-semibold">Carrier</th>
              <th className="px-3 py-2 font-semibold">Sig</th>
              <th className="px-3 py-2 font-semibold">Mkt</th>
              <th className="px-3 py-2 font-semibold">Email</th>
              <th className="px-3 py-2 font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort("signed")}
                  className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                >
                  Signed {sortIndicator("signed")}
                </button>
              </th>
              <th className="px-3 py-2 font-semibold w-8"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                <td className="px-3 py-2 whitespace-nowrap font-semibold text-foreground">
                  {formatEventDate(s.waiver_accepted_at)}
                </td>
                <td className="px-3 py-2 font-medium text-foreground">{s.name}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {s.email ? (
                    <a className="hover:underline" href={`mailto:${s.email}`}>
                      {s.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{s.phone || "—"}</td>
                <td className="px-3 py-2 text-foreground">
                  {s.event_slug ? (
                    <a
                      href={`/events/${s.event_slug}`}
                      className="hover:underline"
                    >
                      {s.event_name}
                    </a>
                  ) : (
                    s.event_name
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap" title={s.waiver_accepted_ip ?? ""}>
                  {s.waiver_accepted_isp ?? "—"}
                </td>
                <td className="px-3 py-2">
                  {s.signature_data_url ? (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveSigner({
                          name: s.name,
                          email: s.email,
                          phone: s.phone,
                          event_name: s.event_name,
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
                        })
                      }
                      className="rounded border border-border bg-white p-0.5 hover:border-foreground/40 transition-colors"
                      title="View signature & full details"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.signature_data_url}
                        alt={`${s.name} signature`}
                        className="h-7 w-16 object-contain"
                      />
                    </button>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  {s.marketing_opt_in ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-[12px]">
                  {!s.email ? (
                    <span className="text-muted-foreground">—</span>
                  ) : s.email_opened_at ? (
                    <span
                      className="text-green-600"
                      title={`Opened ${new Date(s.email_opened_at).toLocaleString()}${(s.email_open_count ?? 0) > 1 ? ` · ${s.email_open_count}×` : ""}`}
                    >
                      ✓ Opened{(s.email_open_count ?? 0) > 1 ? ` (${s.email_open_count})` : ""}
                    </span>
                  ) : s.email_sent_at ? (
                    <span className="text-amber-600" title={`Sent ${new Date(s.email_sent_at).toLocaleString()} — not yet opened`}>
                      ○ Sent
                    </span>
                  ) : (
                    <span className="text-blue-500" title="Queued — will be sent by daily drainer">
                      ⏳ Queued
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {s.waiver_accepted_at
                    ? new Date(s.waiver_accepted_at).toLocaleString()
                    : "—"}
                </td>
                <td className="px-3 py-2">
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
        {filtered.length === 0 && (
          <div className="py-12 text-center text-[13px] text-muted-foreground">
            No matches.
          </div>
        )}
      </div>

      <SignatureModal signer={activeSigner} onClose={() => setActiveSigner(null)} />
    </div>
  );
}
