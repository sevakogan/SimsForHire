"use client";

import { useState } from "react";
import {
  acceptAllItemsByShareToken,
  submitItemDecisions,
  saveClientNote,
  deleteItemByShareToken,
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
  items: initialItems,
  shareToken,
  projectStatus,
}: ShareActionsProps) {
  const [currentStatus, setCurrentStatus] = useState(projectStatus);
  const [visibleItems, setVisibleItems] = useState(initialItems);
  const [decisions, setDecisions] = useState<
    Record<string, AcceptanceStatus>
  >(() => {
    const initial: Record<string, AcceptanceStatus> = {};
    for (const item of initialItems) {
      initial[item.id] = item.acceptance_status ?? "pending";
    }
    return initial;
  });
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const item of initialItems) {
      initial[item.id] = item.client_note ?? "";
    }
    return initial;
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Note popup state
  const [noteItemId, setNoteItemId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  // Delete state
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isEditable =
    currentStatus !== "accepted" && currentStatus !== "completed";

  // Project-level acceptance — only project status matters.
  // Item-level statuses are reset when admin downgrades, but even if
  // they weren't, the customer should still see the review screen
  // when the project is in draft/quote.
  const alreadyAccepted =
    currentStatus === "accepted" || currentStatus === "completed";

  const activeDecisions = Object.fromEntries(
    Object.entries(decisions).filter(([id]) =>
      visibleItems.some((i) => i.id === id)
    )
  );
  const allItemsDecided = Object.values(activeDecisions).every(
    (d) => d === "accepted" || d === "rejected"
  );
  const allAccepted = Object.values(activeDecisions).every(
    (d) => d === "accepted"
  );
  const hasRejections = Object.values(activeDecisions).some(
    (d) => d === "rejected"
  );

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
        const allAcc: Record<string, AcceptanceStatus> = {};
        for (const item of visibleItems) {
          allAcc[item.id] = "accepted";
        }
        setDecisions(allAcc);
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
      const itemDecisions = Object.entries(activeDecisions)
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

  function openNotePopup(itemId: string) {
    setNoteItemId(itemId);
    setNoteDraft(notes[itemId] ?? "");
  }

  async function handleSaveNote() {
    if (!noteItemId) return;
    setNoteSaving(true);
    setError(null);
    try {
      const result = await saveClientNote(
        shareToken,
        noteItemId,
        noteDraft.trim() || null
      );
      if (result.error) {
        setError(result.error);
      } else {
        setNotes((prev) => ({ ...prev, [noteItemId]: noteDraft.trim() }));
        setNoteItemId(null);
      }
    } catch {
      setError("Failed to save note.");
    } finally {
      setNoteSaving(false);
    }
  }

  async function handleDeleteItem() {
    if (!deleteItemId) return;
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteItemByShareToken(shareToken, deleteItemId);
      if (result.error) {
        setError(result.error);
      } else {
        setVisibleItems((prev) => prev.filter((i) => i.id !== deleteItemId));
        setDeleteItemId(null);
      }
    } catch {
      setError("Failed to delete item.");
    } finally {
      setDeleting(false);
    }
  }

  // Displayed status
  const displayStatus = submitted && allAccepted ? "accepted" : currentStatus;

  // Already submitted or project already accepted
  if (submitted || alreadyAccepted) {
    const isAllAccepted = alreadyAccepted || allAccepted;

    return (
      <>
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
            {isAllAccepted ? "Invoice Accepted" : "Response Submitted"}
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
          <h3 className="text-sm font-semibold text-gray-700">Review Items</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Accept or reject each item, leave notes, or remove items you don&apos;t need
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {visibleItems.map((item, index) => {
            const status = decisions[item.id];
            const hasNote = !!(notes[item.id]?.trim());
            const rowBg = status === "accepted"
              ? "bg-green-50/50"
              : status === "rejected"
                ? "bg-red-50/50"
                : index % 2 === 0
                  ? "bg-white"
                  : "bg-gray-50/60";
            return (
              <div
                key={item.id}
                className={`px-4 py-3 transition-colors ${rowBg}`}
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.description || item.item_type || "Item"}
                    </p>
                    {item.item_type && (
                      <span className="text-[10px] text-gray-500">
                        {item.item_type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Note button */}
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => openNotePopup(item.id)}
                        className={`relative rounded-lg p-1.5 text-xs transition-all ${
                          hasNote
                            ? "bg-blue-50 text-blue-600 border border-blue-200"
                            : "border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                        title={hasNote ? "Edit note" : "Add note"}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                        </svg>
                        {hasNote && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-blue-500" />
                        )}
                      </button>
                    )}

                    {/* Accept button */}
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

                    {/* Reject button */}
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

                    {/* Delete button */}
                    {isEditable && (
                      <button
                        type="button"
                        onClick={() => setDeleteItemId(item.id)}
                        className="rounded-lg p-1.5 border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all"
                        title="Remove item"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                {/* Show note preview */}
                {hasNote && (
                  <p className="mt-1.5 text-xs text-blue-600 bg-blue-50 rounded px-2 py-1 italic">
                    &ldquo;{notes[item.id]}&rdquo;
                  </p>
                )}
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

      {/* Note popup overlay */}
      {noteItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Leave a Note
            </h3>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Add a note for the team..."
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <div className="mt-3 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setNoteItemId(null)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={noteSaving}
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {noteSaving ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation overlay */}
      {deleteItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xs rounded-xl bg-white p-5 shadow-xl text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900">
              Remove this item?
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              This item will be permanently removed from the invoice.
            </p>
            <div className="mt-4 flex gap-2 justify-center">
              <button
                type="button"
                onClick={() => setDeleteItemId(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteItem}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Removing..." : "Remove Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Updates the server-rendered header badge via DOM */
function StatusBadgeUpdater({ status }: { status: string }) {
  if (typeof window === "undefined") return null;

  const badge = document.getElementById("share-status-badge");
  if (badge) {
    const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";
    badge.className = `inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${style}`;
    badge.textContent = status;
  }

  return null;
}
