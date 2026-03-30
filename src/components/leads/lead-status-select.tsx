"use client";

import { useTransition } from "react";
import { updateLeadStatus } from "@/lib/actions/leads";
import type { LeadStatus } from "@/types";

// Matches production Astro admin colors
const statusStyles: Record<LeadStatus, { bg: string; color: string; border: string }> = {
  new:       { bg: "rgba(225,6,0,0.08)",   color: "#E10600", border: "rgba(225,6,0,0.13)" },
  contacted: { bg: "rgba(255,159,10,0.08)", color: "#FF9F0A", border: "rgba(255,159,10,0.13)" },
  closed:    { bg: "rgba(48,209,88,0.08)", color: "#30D158", border: "rgba(48,209,88,0.13)" },
};

interface LeadStatusSelectProps {
  leadId: string;
  currentStatus: LeadStatus;
}

export function LeadStatusSelect({ leadId, currentStatus }: LeadStatusSelectProps) {
  const [isPending, startTransition] = useTransition();
  const s = statusStyles[currentStatus];

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
      <option value="new">New</option>
      <option value="contacted">Contacted</option>
      <option value="closed">Closed</option>
    </select>
  );
}
