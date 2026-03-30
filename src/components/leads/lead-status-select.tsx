"use client";

import { useTransition } from "react";
import { updateLeadStatus } from "@/lib/actions/leads";
import type { LeadStatus } from "@/types";

const statusStyles: Record<LeadStatus, { bg: string; color: string; border: string }> = {
  new:         { bg: "rgba(225,6,0,0.08)",    color: "#E10600",  border: "rgba(225,6,0,0.13)" },
  replied:     { bg: "rgba(10,132,255,0.08)",  color: "#0A84FF",  border: "rgba(10,132,255,0.13)" },
  in_progress: { bg: "rgba(255,159,10,0.08)", color: "#FF9F0A",  border: "rgba(255,159,10,0.13)" },
  booked:      { bg: "rgba(48,209,88,0.08)",  color: "#30D158",  border: "rgba(48,209,88,0.13)" },
  lost:        { bg: "rgba(120,120,128,0.1)",  color: "#6C6C70",  border: "rgba(120,120,128,0.15)" },
};

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  replied: "Replied",
  in_progress: "In Progress",
  booked: "Booked",
  lost: "Lost",
};

interface LeadStatusSelectProps {
  leadId: string;
  currentStatus: LeadStatus;
}

export function LeadStatusSelect({ leadId, currentStatus }: LeadStatusSelectProps) {
  const [isPending, startTransition] = useTransition();
  const s = statusStyles[currentStatus] ?? statusStyles.new;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as LeadStatus;
    if (newStatus === currentStatus) return;
    startTransition(() => {
      updateLeadStatus(leadId, newStatus);
    });
  }

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      disabled={isPending}
      style={{
        fontSize: "12px",
        fontWeight: 500,
        padding: "4px 8px",
        borderRadius: "6px",
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: s.color,
        fontFamily: "inherit",
        cursor: "pointer",
        appearance: "none",
        WebkitAppearance: "none",
        opacity: isPending ? 0.5 : 1,
        outline: "none",
      }}
    >
      {(Object.keys(STATUS_LABELS) as LeadStatus[]).map((v) => (
        <option key={v} value={v}>{STATUS_LABELS[v]}</option>
      ))}
    </select>
  );
}
