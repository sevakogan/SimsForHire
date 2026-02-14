"use client";

import { useState } from "react";
import {
  acceptAllItemsByShareToken,
  submitItemDecisions,
} from "@/lib/actions/projects";
import type { ClientItem, AcceptanceStatus } from "@/types";

interface ShareActionsProps {
  items: ClientItem[];
  shareToken: string;
  projectStatus: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  quote: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  completed: "bg-purple-100 text-purple-700",
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span
      id="share-status-badge"
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${style}`}
    >
      {status}
    </span>
  );
}

export { StatusBadge };

export function ShareActions({
  items,
  shareToken,
  projectStatus,
}: ShareActionsProps) {
  const [currentStatus, setCurrentStatus] = useState(projectStatus);
  const [decisions, setDecisions] = useState<
    Record<string, AcceptanceStatus>
  >(() => {
    const initial: Record<string, AcceptanceStatus> = {};
    for (const item of items) {
      initial[item.id] = item.acceptance_status ?? "pending";
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already fully accepted (project promoted by admin, or all items already accepted by client)
  const allItemsAlreadyAccepted = items.every(
    (i) => i.acceptance_status === "accepted"
  );
  const alreadyAccepted =
    currentStatus === "accepted" ||
    currentStatus === "completed" ||
    allItemsAlreadyAccepted;
  const allItemsDecided = Object.values(decisions).every(
    (d) => d === "accepted" || d === "rejected"
  );
  const allAccepted = Object.values(decisions).every((d) => d === "accepted");
  const hasRejections = Object.values(decisions).some((d) => d === "rejected");

  function toggleItem(itemId: string, status: AcceptanceStatus) {
    setDecisions((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === status ? "pending" : status,
    }));
  }

  async function handleAcceptAll() {
    setSubmitting(true);
    setError(null);
    try {
      const result = await acceptAllItemsByShareToken(shareToken);
      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
        setCurrentStatus("accepted");
        const allAccepted: Record<string, AcceptanceStatus> = {};
        for (const item of items) {
          allAccepted[item.id] = "accepted";
        }
        setDecisions(allAccepted);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmitDecisions() {
    setSubmitting(true);
    setError(null);
    try {
      const itemDecisions = Object.entries(decisions)
        .filter(([, status]) => status !== "pending")
        .map(([itemId, status]) => ({ itemId, status }));

      const result = await submitItemDecisions(shareToken, itemDecisions);
      if (result.error) {
        setError(result.error);
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Compute the displayed status: if user just accepted all, show "accepted"
  const displayStatus = submitted && allAccepted ? "accepted" : currentStatus;

  // Already submitted or project already accepted
  if (submitted || alreadyAccepted) {
    const isAllAccepted = alreadyAccepted || allAccepted;

    return (
      <>
        {/* Reactive status badge */}
        <StatusBadgeUpdater status={displayStatus} />

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-center">
          <div
            className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
              isAllAccepted ? "bg-green-100" : "bg-amber-100"
            }`}
          >
            {isAllAccepted ? (
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            )}
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            {isAllAccepted
              ? "Invoice Accepted"
              : "Response Submitted"}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isAllAccepted
              ? "Thank you! All items have been accepted."
              : "Thank you! Your selections have been submitted. The team will review rejected items."}
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Per-item decision toggles */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/80 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-700">
            Review Items
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Accept or reject each item, or accept all at once
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {items.map((item) => {
            const status = decisions[item.id];
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between px-4 py-3 transition-colors ${
                  status === "accepted"
                    ? "bg-green-50/50"
                    : status === "rejected"
                      ? "bg-red-50/50"
                      : ""
                }`}
              >
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.description || item.item_type || "Item"}
                  </p>
                  {item.item_type && (
                    <span className="text-[10px] text-gray-500">
                      {item.item_type}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id, "accepted")}
                    disabled={submitting}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      status === "accepted"
                        ? "bg-green-600 text-white shadow-sm"
                        : "border border-gray-200 text-gray-500 hover:border-green-300 hover:text-green-600 hover:bg-green-50"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      Accept
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id, "rejected")}
                    disabled={submitting}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      status === "rejected"
                        ? "bg-red-600 text-white shadow-sm"
                        : "border border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                      Reject
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={handleAcceptAll}
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? (
            "Submitting..."
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Accept All Items
            </>
          )}
        </button>

        {allItemsDecided && !allAccepted && (
          <button
            type="button"
            onClick={handleSubmitDecisions}
            disabled={submitting}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold shadow-sm transition-all disabled:opacity-50 ${
              hasRejections
                ? "bg-amber-600 text-white hover:bg-amber-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {submitting ? "Submitting..." : "Submit My Selections"}
          </button>
        )}

        {!allItemsDecided && (
          <p className="text-xs text-gray-400 self-center">
            Select accept or reject for each item, or use &quot;Accept All&quot;
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Hidden component that updates the header status badge via DOM.
 * This bridges the client-side state change to the server-rendered header badge.
 */
function StatusBadgeUpdater({ status }: { status: string }) {
  if (typeof window === "undefined") return null;

  // Update the server-rendered badge in the header
  const badge = document.getElementById("share-status-badge");
  if (badge) {
    const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";
    badge.className = `inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${style}`;
    badge.textContent = status;
  }

  return null;
}
