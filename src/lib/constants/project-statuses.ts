import type { ProjectStatus } from "@/types";

export interface StatusConfig {
  label: string;
  /** Row color theme — inactive bg */
  bg: string;
  /** Row color theme — inactive text */
  text: string;
  /** Active state background */
  activeBg: string;
  /** Active state text */
  activeText: string;
  /** Border color when NOT active */
  border: string;
}

/**
 * Ordered list of all project statuses.
 * Row 1: draft → accepted  (pre-fulfillment) — grey theme
 * Row 2: paid → completed  (fulfillment + close) — green theme
 */
export const PROJECT_STATUSES: ProjectStatus[] = [
  "draft",
  "quote",
  "submitted",
  "accepted",
  "paid",
  "shipped",
  "received",
  "completed",
];

export const STATUS_ROW_1: ProjectStatus[] = ["draft", "quote", "submitted", "accepted"];
export const STATUS_ROW_2: ProjectStatus[] = ["paid", "shipped", "received", "completed"];

/* ── Row 1: grey theme ─────────────────────────────────── */
const ROW1_INACTIVE = { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" };
const ROW1_ACTIVE   = { activeBg: "bg-gray-700", activeText: "text-white" };

/* ── Row 2: green theme ────────────────────────────────── */
const ROW2_INACTIVE = { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" };
const ROW2_ACTIVE   = { activeBg: "bg-emerald-600", activeText: "text-white" };

export const STATUS_CONFIG: Record<ProjectStatus, StatusConfig> = {
  draft:     { label: "Draft",     ...ROW1_INACTIVE, ...ROW1_ACTIVE },
  quote:     { label: "Quote",     ...ROW1_INACTIVE, ...ROW1_ACTIVE },
  submitted: { label: "Submitted", ...ROW1_INACTIVE, ...ROW1_ACTIVE },
  accepted:  { label: "Accepted",  ...ROW1_INACTIVE, ...ROW1_ACTIVE },
  paid:      { label: "Paid",      ...ROW2_INACTIVE, ...ROW2_ACTIVE },
  shipped:   { label: "Shipped",   ...ROW2_INACTIVE, ...ROW2_ACTIVE },
  received:  { label: "Received",  ...ROW2_INACTIVE, ...ROW2_ACTIVE },
  completed: { label: "Completed", ...ROW2_INACTIVE, ...ROW2_ACTIVE },
};

/** Get the config for a status, with a safe fallback */
export function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status as ProjectStatus] ?? STATUS_CONFIG.draft;
}
