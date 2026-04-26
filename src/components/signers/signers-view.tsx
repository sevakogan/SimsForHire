"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { SignatureModal, type SignatureModalSigner } from "@/components/signers/signature-modal";
import type { SignerWithEvent } from "@/lib/actions/waiver-events";

interface Props {
  signers: SignerWithEvent[];
}

export function SignersView({ signers }: Props) {
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("");
  const [activeSigner, setActiveSigner] = useState<SignatureModalSigner | null>(null);

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
    return signers.filter((s) => {
      if (eventFilter && s.event_slug !== eventFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.email ?? "").toLowerCase().includes(q) ||
        (s.phone ?? "").toLowerCase().includes(q) ||
        s.event_name.toLowerCase().includes(q)
      );
    });
  }, [signers, query, eventFilter]);

  function handleDownloadXlsx() {
    if (filtered.length === 0) return;
    const rows = filtered.map((s) => ({
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
    const header = ["Name", "Email", "Phone", "Event", "Marketing", "Version", "Signed At", "IP"];
    const csvRows = filtered.map((s) =>
      [
        s.name,
        s.email ?? "",
        s.phone ?? "",
        s.event_name,
        s.marketing_opt_in ? "Yes" : "No",
        s.waiver_version ?? "",
        s.waiver_accepted_at ?? "",
        s.waiver_accepted_ip ?? "",
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
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Email</th>
              <th className="px-3 py-2 font-semibold">Phone</th>
              <th className="px-3 py-2 font-semibold">Event</th>
              <th className="px-3 py-2 font-semibold">Sig</th>
              <th className="px-3 py-2 font-semibold">Mkt</th>
              <th className="px-3 py-2 font-semibold">Signed</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
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
                          signature_data_url: s.signature_data_url,
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
                <td className="px-3 py-2 text-muted-foreground">
                  {s.waiver_accepted_at
                    ? new Date(s.waiver_accepted_at).toLocaleString()
                    : "—"}
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
