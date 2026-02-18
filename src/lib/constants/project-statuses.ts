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
 * Row 1: draft → paid  (pre-fulfillment) — grey theme, accepted & paid are green
 * Row 2: preparing → completed  (fulfillment + close) — blue theme, completed is green
 */
export const PROJECT_STATUSES: ProjectStatus[] = [
  "draft",
  "quote",
  "submitted",
  "accepted",
  "paid",
  "preparing",
  "shipped",
  "received",
  "completed",
];

export const STATUS_ROW_1: ProjectStatus[] = ["draft", "quote", "submitted", "accepted", "paid"];
export const STATUS_ROW_2: ProjectStatus[] = ["preparing", "shipped", "received", "completed"];

/* ── Row 1: grey theme (default) ──────────────────────── */
const ROW1_GREY_INACTIVE = { bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200" };
const ROW1_GREY_ACTIVE   = { activeBg: "bg-gray-700", activeText: "text-white" };

/* ── Row 1: green theme (accepted, paid) ──────────────── */
const ROW1_GREEN_INACTIVE = { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" };
const ROW1_GREEN_ACTIVE   = { activeBg: "bg-green-600", activeText: "text-white" };

/* ── Row 2: light blue theme (default) ────────────────── */
const ROW2_BLUE_INACTIVE = { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200" };
const ROW2_BLUE_ACTIVE   = { activeBg: "bg-sky-600", activeText: "text-white" };

/* ── Row 2: green theme (completed) ───────────────────── */
const ROW2_GREEN_INACTIVE = { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" };
const ROW2_GREEN_ACTIVE   = { activeBg: "bg-green-600", activeText: "text-white" };

export const STATUS_CONFIG: Record<ProjectStatus, StatusConfig> = {
  draft:     { label: "Draft",       ...ROW1_GREY_INACTIVE,  ...ROW1_GREY_ACTIVE },
  quote:     { label: "Quote",       ...ROW1_GREY_INACTIVE,  ...ROW1_GREY_ACTIVE },
  submitted: { label: "Submitted",   ...ROW1_GREY_INACTIVE,  ...ROW1_GREY_ACTIVE },
  accepted:  { label: "Accepted",    ...ROW1_GREEN_INACTIVE, ...ROW1_GREEN_ACTIVE },
  paid:      { label: "Paid",        ...ROW1_GREEN_INACTIVE, ...ROW1_GREEN_ACTIVE },
  preparing: { label: "Preparing",   ...ROW2_BLUE_INACTIVE,  ...ROW2_BLUE_ACTIVE },
  shipped:   { label: "Shipped",     ...ROW2_BLUE_INACTIVE,  ...ROW2_BLUE_ACTIVE },
  received:  { label: "Received",    ...ROW2_BLUE_INACTIVE,  ...ROW2_BLUE_ACTIVE },
  completed: { label: "Completed",   ...ROW2_GREEN_INACTIVE, ...ROW2_GREEN_ACTIVE },
};

/** Get the config for a status, with a safe fallback */
export function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status as ProjectStatus] ?? STATUS_CONFIG.draft;
}

/**
 * Statuses at "submitted" or beyond lock all editing on the project page
 * except invoice notes. The customer is viewing the invoice at this point.
 */
const EDIT_LOCKED_STATUSES: ReadonlySet<ProjectStatus> = new Set([
  "submitted",
  "accepted",
  "paid",
  "preparing",
  "shipped",
  "received",
  "completed",
]);

export function isEditLocked(status: string): boolean {
  return EDIT_LOCKED_STATUSES.has(status as ProjectStatus);
}

/**
 * Once the contract is signed the invoice is permanently locked.
 * The "Edit The Invoice" escape-hatch is NOT available when the contract
 * is signed — fields cannot be changed without voiding the contract.
 */
export function isContractLocked(contractSignedAt: string | null): boolean {
  return contractSignedAt !== null;
}

/* ── Contract step row (between Row 1 and Row 2) ──── */

export type ContractStep = "contract_viewed" | "contract_signed";

export const CONTRACT_ROW: ContractStep[] = ["contract_viewed", "contract_signed"];

const CONTRACT_INACTIVE = { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200" };
const CONTRACT_ACTIVE   = { activeBg: "bg-violet-600", activeText: "text-white" };

export const CONTRACT_CONFIG: Record<ContractStep, StatusConfig> = {
  contract_viewed: { label: "Contract Viewed", ...CONTRACT_INACTIVE, ...CONTRACT_ACTIVE },
  contract_signed: { label: "Contract Signed", ...CONTRACT_INACTIVE, ...CONTRACT_ACTIVE },
};
