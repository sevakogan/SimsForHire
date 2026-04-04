"use client";

import { useState, useTransition, useCallback } from "react";
import {
  updateEventConfig,
  getRacers,
  enterRacerTime,
  deleteRacer,
  resetEventRacers,
} from "@/lib/actions/events";
import type { EventWithConfig, Racer, EventStats } from "@/types/events";

type Tab = "queue" | "results" | "settings" | "export";

interface Props {
  event: EventWithConfig;
  racers: Racer[];
  stats: EventStats;
}

function timeToMs(lapTime: string): number {
  const match = lapTime.match(/^(\d+):(\d{2})\.(\d{3})$/);
  if (!match) return 0;
  return parseInt(match[1]) * 60000 + parseInt(match[2]) * 1000 + parseInt(match[3]);
}

function formatGap(leaderMs: number, racerMs: number): string {
  const diff = racerMs - leaderMs;
  if (diff <= 0) return "Leader";
  if (diff < 1000) return `+${(diff / 1000).toFixed(3)}s`;
  return `+${(diff / 1000).toFixed(2)}s`;
}

function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(-6).padStart(6, "0");
  if (!digits.replace(/0/g, "")) return "";
  return `${parseInt(digits[0])}:${digits.slice(1, 3)}.${digits.slice(3)}`;
}

export function EventDetailView({ event, racers: initial, stats: initialStats }: Props) {
  const [tab, setTab] = useState<Tab>("queue");
  const [racers, setRacers] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const queue = racers.filter((r) => !r.lap_time).sort((a, b) => (a.queue_pos ?? 999) - (b.queue_pos ?? 999));
  const results = racers.filter((r) => r.lap_time).sort((a, b) => (a.lap_time_ms ?? 0) - (b.lap_time_ms ?? 0));

  async function refetchRacers() {
    const data = await getRacers(event.slug);
    setRacers(data);
  }

  async function handleEnterTime(racerId: string, lapTime: string) {
    await enterRacerTime(event.slug, racerId, lapTime);
    await refetchRacers();
  }

  async function handleDeleteRacer(racerId: string) {
    await deleteRacer(racerId);
    setRacers((prev) => prev.filter((r) => r.id !== racerId));
  }

  async function handleReset(pin: string) {
    const result = await resetEventRacers(event.slug, pin);
    if (result.success) setRacers([]);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "queue", label: `Queue (${queue.length})` },
    { id: "results", label: `Results (${results.length})` },
    { id: "settings", label: "Settings" },
    { id: "export", label: "Export" },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid #E5E5E7", paddingBottom: 0 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 18px",
              fontSize: 14,
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? "#1D1D1F" : "#86868B",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              borderBottom: tab === t.id ? "2px solid #E10600" : "2px solid transparent",
              marginBottom: -1,
              fontFamily: "inherit",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "queue" && (
        <QueueTab queue={queue} slug={event.slug} onEnterTime={handleEnterTime} onDelete={handleDeleteRacer} />
      )}
      {tab === "results" && (
        <ResultsTab results={results} slug={event.slug} onDelete={handleDeleteRacer} onReset={handleReset} />
      )}
      {tab === "settings" && <SettingsTab event={event} />}
      {tab === "export" && <ExportTab racers={racers} eventName={event.config?.event_name ?? event.name} />}
    </div>
  );
}

/* ── Queue Tab ──────────────────────────────────────────────── */

function QueueTab({
  queue,
  slug,
  onEnterTime,
  onDelete,
}: {
  queue: Racer[];
  slug: string;
  onEnterTime: (id: string, time: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [timeInput, setTimeInput] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(racerId: string) {
    const formatted = formatTimeInput(timeInput);
    if (!formatted.match(/^\d+:\d{2}\.\d{3}$/)) return;
    setSaving(true);
    await onEnterTime(racerId, formatted);
    setSaving(false);
    setActiveId(null);
    setTimeInput("");
  }

  if (queue.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#AEAEB2", fontSize: 14 }}>
        Queue is empty
      </div>
    );
  }

  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #E5E5E7" }}>
            {["#", "Name", "Phone", "Registered", ""].map((h) => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#AEAEB2", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {queue.map((racer, i) => (
            <>
              <tr
                key={racer.id}
                style={{ borderBottom: "1px solid #F5F5F7" }}
              >
                <td style={{ padding: "12px", fontSize: 13, color: "#86868B", fontWeight: 600 }}>
                  {racer.queue_pos ?? i + 1}
                </td>
                <td style={{ padding: "12px", fontSize: 14, color: "#1D1D1F", fontWeight: 500 }}>
                  {racer.name}
                </td>
                <td style={{ padding: "12px", fontSize: 13, color: "#86868B" }}>{racer.phone}</td>
                <td style={{ padding: "12px", fontSize: 12, color: "#AEAEB2" }}>
                  {new Date(racer.registered_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </td>
                <td style={{ padding: "12px", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => { setActiveId(racer.id); setTimeInput(""); }}
                      style={{ padding: "6px 14px", background: "#E10600", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Enter Time
                    </button>
                    <button
                      onClick={() => onDelete(racer.id)}
                      style={{ padding: "6px 10px", background: "transparent", color: "#AEAEB2", border: "1px solid #E5E5E7", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
              {activeId === racer.id && (
                <tr key={`${racer.id}-input`} style={{ background: "#F5F5F7" }}>
                  <td colSpan={5} style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 13, color: "#86868B" }}>Lap time for {racer.name}:</span>
                      <input
                        value={timeInput}
                        onChange={(e) => setTimeInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && submit(racer.id)}
                        placeholder="0:00.000"
                        autoFocus
                        style={{
                          padding: "8px 14px",
                          border: "1px solid #E5E5E7",
                          borderRadius: 8,
                          fontSize: 15,
                          fontFamily: "monospace",
                          width: 120,
                          background: "white",
                          color: "#1D1D1F",
                        }}
                      />
                      <button
                        onClick={() => submit(racer.id)}
                        disabled={saving}
                        style={{ padding: "8px 18px", background: "#1D1D1F", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setActiveId(null)}
                        style={{ padding: "8px 12px", background: "transparent", color: "#86868B", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Results Tab ──────────────────────────────────────────────── */

function ResultsTab({
  results,
  slug,
  onDelete,
  onReset,
}: {
  results: Racer[];
  slug: string;
  onDelete: (id: string) => Promise<void>;
  onReset: (pin: string) => Promise<void>;
}) {
  const [resetOpen, setResetOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");

  async function confirmReset() {
    setResetting(true);
    setError("");
    const result = await resetEventRacers(slug, pin);
    if (result.success) {
      await onReset(pin);
      setResetOpen(false);
      setPin("");
    } else {
      setError("Invalid PIN");
    }
    setResetting(false);
  }

  const leaderMs = results[0]?.lap_time_ms ?? 0;

  if (results.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#AEAEB2", fontSize: 14 }}>
        No results yet
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button
          onClick={() => setResetOpen(true)}
          style={{ padding: "8px 16px", background: "transparent", border: "1px solid #E5E5E7", borderRadius: 8, fontSize: 13, color: "#86868B", cursor: "pointer", fontFamily: "inherit" }}
        >
          Reset All Data
        </button>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #E5E5E7" }}>
            {["Pos", "Name", "Lap Time", "Gap", "Phone", ""].map((h) => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#AEAEB2", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((racer, i) => (
            <tr key={racer.id} style={{ borderBottom: "1px solid #F5F5F7" }}>
              <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: i === 0 ? "#E10600" : "#86868B" }}>
                P{i + 1}
              </td>
              <td style={{ padding: "12px", fontSize: 14, color: "#1D1D1F", fontWeight: 500 }}>
                {racer.name}
              </td>
              <td style={{ padding: "12px", fontSize: 14, fontFamily: "monospace", color: "#1D1D1F", fontWeight: 600 }}>
                {racer.lap_time}
              </td>
              <td style={{ padding: "12px", fontSize: 13, color: "#86868B" }}>
                {formatGap(leaderMs, racer.lap_time_ms ?? 0)}
              </td>
              <td style={{ padding: "12px", fontSize: 13, color: "#86868B" }}>{racer.phone}</td>
              <td style={{ padding: "12px", textAlign: "right" }}>
                <button
                  onClick={() => onDelete(racer.id)}
                  style={{ padding: "5px 10px", background: "transparent", color: "#AEAEB2", border: "1px solid #E5E5E7", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {resetOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "white", borderRadius: 16, padding: 32, width: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: "#1D1D1F", marginBottom: 8 }}>Reset All Data</h3>
            <p style={{ fontSize: 14, color: "#86868B", marginBottom: 20 }}>
              This will permanently delete all racers and times. Enter your admin PIN to confirm.
            </p>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmReset()}
              placeholder="Admin PIN"
              autoFocus
              style={{ width: "100%", padding: "10px 14px", border: "1px solid #E5E5E7", borderRadius: 10, fontSize: 15, marginBottom: 8, boxSizing: "border-box", fontFamily: "inherit" }}
            />
            {error && <p style={{ fontSize: 13, color: "#E10600", marginBottom: 12 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={confirmReset}
                disabled={resetting}
                style={{ flex: 1, padding: "10px", background: "#E10600", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
              >
                {resetting ? "Resetting…" : "Reset All"}
              </button>
              <button
                onClick={() => { setResetOpen(false); setPin(""); setError(""); }}
                style={{ flex: 1, padding: "10px", background: "transparent", border: "1px solid #E5E5E7", borderRadius: 10, fontSize: 14, color: "#86868B", cursor: "pointer", fontFamily: "inherit" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Settings Tab ──────────────────────────────────────────────── */

function SettingsTab({ event }: { event: EventWithConfig }) {
  const config = event.config;
  const [fields, setFields] = useState({
    event_name: config?.event_name ?? "",
    dealer_name: config?.dealer_name ?? "",
    track_name: config?.track_name ?? "",
    event_date: config?.event_date ?? "",
    event_time: config?.event_time ?? "",
    admin_pin: config?.admin_pin ?? "",
    employee_pin: config?.employee_pin ?? "",
    sms_enabled: config?.sms_enabled ?? false,
    logo_left: config?.logo_left ?? "",
    logo_right: config?.logo_right ?? "",
    waiver_text: config?.waiver_text ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSave() {
    setSaving(true);
    startTransition(async () => {
      await updateEventConfig(event.id, fields);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function field(label: string, key: keyof typeof fields, type = "text") {
    return (
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#1D1D1F", marginBottom: 6 }}>
          {label}
        </label>
        <input
          type={type}
          value={String(fields[key])}
          onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
          style={{ width: "100%", padding: "10px 14px", border: "1px solid #E5E5E7", borderRadius: 10, fontSize: 14, background: "white", color: "#1D1D1F", boxSizing: "border-box", fontFamily: "inherit" }}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
        <div>{field("Event Name", "event_name")}</div>
        <div>{field("Dealer / Client", "dealer_name")}</div>
        <div>{field("Track Name", "track_name")}</div>
        <div>{field("Date (YYYY-MM-DD)", "event_date")}</div>
        <div>{field("Time (HH:mm)", "event_time")}</div>
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#1D1D1F", marginBottom: 6 }}>
            SMS Enabled
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, height: 44 }}>
            <input
              type="checkbox"
              checked={fields.sms_enabled}
              onChange={(e) => setFields((f) => ({ ...f, sms_enabled: e.target.checked }))}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            <span style={{ fontSize: 14, color: "#86868B" }}>Send SMS on register & result</span>
          </div>
        </div>
        <div>{field("Admin PIN", "admin_pin")}</div>
        <div>{field("Employee PIN (optional)", "employee_pin")}</div>
        <div>{field("Logo Left (URL)", "logo_left")}</div>
        <div>{field("Logo Right (URL)", "logo_right")}</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#1D1D1F", marginBottom: 6 }}>
          Waiver Text (HTML)
        </label>
        <textarea
          value={fields.waiver_text}
          onChange={(e) => setFields((f) => ({ ...f, waiver_text: e.target.value }))}
          rows={6}
          style={{ width: "100%", padding: "10px 14px", border: "1px solid #E5E5E7", borderRadius: 10, fontSize: 13, background: "white", color: "#1D1D1F", boxSizing: "border-box", fontFamily: "monospace", resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "10px 24px", background: "#1D1D1F", color: "white", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
        {saved && (
          <span style={{ fontSize: 13, color: "#30D158", fontWeight: 500 }}>Saved!</span>
        )}
      </div>

      {/* Live event links */}
      <div style={{ marginTop: 40, padding: 20, background: "#F5F5F7", borderRadius: 12 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#1D1D1F", marginBottom: 12 }}>Live Event Links</p>
        {[
          { label: "Registration", path: `https://simsforhire.com/live/${event.slug}/register` },
          { label: "Leaderboard", path: `https://simsforhire.com/live/${event.slug}/leaderboard` },
          { label: "Admin Panel", path: `https://simsforhire.com/live/${event.slug}/admin` },
        ].map(({ label, path }) => (
          <div key={path} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "#86868B", width: 110 }}>{label}</span>
            <code style={{ fontSize: 12, color: "#1D1D1F", background: "white", padding: "4px 10px", borderRadius: 6, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {path}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(path)}
              style={{ padding: "4px 10px", background: "transparent", border: "1px solid #E5E5E7", borderRadius: 6, fontSize: 12, color: "#86868B", cursor: "pointer", fontFamily: "inherit" }}
            >
              Copy
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Export Tab ──────────────────────────────────────────────── */

function ExportTab({ racers, eventName }: { racers: Racer[]; eventName: string }) {
  function downloadCsv() {
    const headers = ["Name", "Phone", "Email", "Lap Time", "Position", "Registered At"];
    const sorted = [...racers].sort((a, b) => (a.lap_time_ms ?? 999999) - (b.lap_time_ms ?? 999999));
    const rows = sorted.map((r, i) => [
      r.name,
      r.phone,
      r.email ?? "",
      r.lap_time ?? "",
      r.lap_time ? String(i + 1) : "",
      new Date(r.registered_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventName.replace(/[^a-z0-9]/gi, "-")}-racers.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
        <button
          onClick={downloadCsv}
          style={{ padding: "8px 18px", background: "#1D1D1F", color: "white", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
        >
          Download CSV
        </button>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #E5E5E7" }}>
            {["Name", "Phone", "Email", "Lap Time", "Pos", "Registered"].map((h) => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#AEAEB2", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {racers.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #F5F5F7" }}>
              <td style={{ padding: "10px 12px", fontSize: 14, color: "#1D1D1F" }}>{r.name}</td>
              <td style={{ padding: "10px 12px", fontSize: 13, color: "#86868B" }}>{r.phone}</td>
              <td style={{ padding: "10px 12px", fontSize: 13, color: "#86868B" }}>{r.email ?? "—"}</td>
              <td style={{ padding: "10px 12px", fontSize: 13, fontFamily: "monospace", color: "#1D1D1F" }}>{r.lap_time ?? "—"}</td>
              <td style={{ padding: "10px 12px", fontSize: 13, color: "#86868B" }}>
                {r.lap_time ? `P${[...racers].filter((x) => x.lap_time).sort((a, b) => (a.lap_time_ms ?? 0) - (b.lap_time_ms ?? 0)).findIndex((x) => x.id === r.id) + 1}` : "—"}
              </td>
              <td style={{ padding: "10px 12px", fontSize: 12, color: "#AEAEB2" }}>
                {new Date(r.registered_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
