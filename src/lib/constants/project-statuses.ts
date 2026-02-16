import type { ProjectStatus } from "@/types";

export interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  activeBg: string;
  activeText: string;
  /** Border color used when the status is NOT active */
  border: string;
}

/**
 * Ordered list of all project statuses.
 * Row 1: draft → accepted  (pre-fulfillment)
 * Row 2: paid → completed  (fulfillment + close)
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

export const STATUS_CONFIG: Record<ProjectStatus, StatusConfig> = {
  draft: {
    label: "Draft",
    bg: "bg-slate-100",
    text: "text-slate-600",
    activeBg: "bg-slate-500",
    activeText: "text-white",
    border: "border-slate-200",
  },
  quote: {
    label: "Quote",
    bg: "bg-blue-50",
    text: "text-blue-600",
    activeBg: "bg-blue-500",
    activeText: "text-white",
    border: "border-blue-200",
  },
  submitted: {
    label: "Submitted",
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    activeBg: "bg-indigo-500",
    activeText: "text-white",
    border: "border-indigo-200",
  },
  accepted: {
    label: "Accepted",
    bg: "bg-green-50",
    text: "text-green-600",
    activeBg: "bg-green-500",
    activeText: "text-white",
    border: "border-green-200",
  },
  paid: {
    label: "Paid",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    activeBg: "bg-emerald-500",
    activeText: "text-white",
    border: "border-emerald-200",
  },
  shipped: {
    label: "Shipped",
    bg: "bg-amber-50",
    text: "text-amber-600",
    activeBg: "bg-amber-500",
    activeText: "text-white",
    border: "border-amber-200",
  },
  received: {
    label: "Received",
    bg: "bg-orange-50",
    text: "text-orange-600",
    activeBg: "bg-orange-500",
    activeText: "text-white",
    border: "border-orange-200",
  },
  completed: {
    label: "Completed",
    bg: "bg-purple-50",
    text: "text-purple-600",
    activeBg: "bg-purple-500",
    activeText: "text-white",
    border: "border-purple-200",
  },
};

/** Get the config for a status, with a safe fallback */
export function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status as ProjectStatus] ?? STATUS_CONFIG.draft;
}
