"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { isExternalImage } from "@/lib/parse-images";
import {
  acceptAllItemsByShareToken,
  submitItemDecisions,
  saveClientNote,
  deleteItemByShareToken,
} from "@/lib/actions/projects";
import type { ClientItem, AcceptanceStatus } from "@/types";

interface ItemDisplayData {
  id: string;
  thumb: string | null;
  name: string;
  itemType: string | null;
  qty: number;
  price: number;
  shipping: number;
  total: number;
}

interface ShareActionsProps {
  items: ClientItem[];
  itemDisplayData: ItemDisplayData[];
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function ShareActions({
  items: initialItems,
  itemDisplayData: initialDisplayData,
  shareToken,
  projectStatus,
}: ShareActionsProps) {
  const [currentStatus, setCurrentStatus] = useState(projectStatus);
  const [visibleItems, setVisibleItems] = useState(initialItems);
  const [visibleDisplayData, setVisibleDisplayData] = useState(initialDisplayData);
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

  // Image lightbox state — click any thumbnail to enlarge
  const [lightboxItem, setLightboxItem] = useState<ItemDisplayData | null>(null);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
    console.log("[ShareActions] hydrated, items:", visibleDisplayData.length, "status:", currentStatus);
  }, []);

  const isEditable =
    currentStatus !== "accepted" && currentStatus !== "completed";

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
        setVisibleDisplayData((prev) => prev.filter((d) => d.id !== deleteItemId));
        setDeleteItemId(null);
      }
    } catch {
      setError("Failed to delete item.");
    } finally {
      setDeleting(false);
    }
  }

  // Totals from visible items
  const totalSelling = visibleDisplayData.reduce((sum, d) => sum + d.price * d.qty, 0);
  const totalShipping = visibleDisplayData.reduce((sum, d) => sum + d.shipping * d.qty, 0);
  const grandTotal = totalSelling + totalShipping;

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
    <div className="space-y-4">
      {/* Temporary debug: shows if React hydrated */}
      {!hydrated && (
        <div className="rounded-lg bg-yellow-50 p-2 text-xs text-yellow-700">
          ⏳ Loading interactive features...
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Combined items table — desktop */}
      <div className="hidden sm:block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-sm table-fixed">
          <thead className="border-b border-gray-200 bg-gray-50/80">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 w-10">
                #
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                Item
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 w-14">
                Qty
              </th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 w-24">
                Price
              </th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 w-40">
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibleDisplayData.map((display, index) => {
              const status = decisions[display.id];
              const hasNote = !!(notes[display.id]?.trim());
              const rowBg = status === "accepted"
                ? "bg-green-50/50"
                : status === "rejected"
                  ? "bg-red-50/50"
                  : index % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50/40";

              return (
                <tr key={display.id} className={`transition-colors ${rowBg}`}>
                  <td className="px-3 py-2.5 text-gray-400 tabular-nums text-xs">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2.5 overflow-hidden">
                    <div className="flex items-center gap-2.5">
                      {display.thumb ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("[ShareActions] lightbox click desktop:", display.id, display.thumb);
                            setLightboxItem(display);
                          }}
                          className="shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                        >
                          <Image
                            src={display.thumb}
                            alt=""
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-lg object-cover"
                            unoptimized={isExternalImage(display.thumb)}
                          />
                        </button>
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                          </svg>
                        </div>
                      )}
                      <div className="min-w-0 overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {display.name}
                        </p>
                        {hasNote && (
                          <p className="mt-0.5 text-[10px] text-blue-600 truncate" title={notes[display.id]}>
                            &ldquo;{notes[display.id]}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums text-gray-700 text-xs">
                    {display.qty}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-gray-900 text-xs font-medium">
                    {formatCurrency(display.price)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      {/* Note */}
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => openNotePopup(display.id)}
                          className={`rounded-md p-1.5 transition-colors ${
                            hasNote
                              ? "text-blue-600 bg-blue-50"
                              : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                          }`}
                          title={hasNote ? "Edit note" : "Add note"}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                          </svg>
                        </button>
                      )}

                      {/* Accept */}
                      <button
                        type="button"
                        onClick={() => toggleItem(display.id, "accepted")}
                        disabled={submitting}
                        className={`rounded-md p-1.5 transition-colors ${
                          status === "accepted"
                            ? "text-white bg-green-600"
                            : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                        }`}
                        title="Accept"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      </button>

                      {/* Reject */}
                      <button
                        type="button"
                        onClick={() => toggleItem(display.id, "rejected")}
                        disabled={submitting}
                        className={`rounded-md p-1.5 transition-colors ${
                          status === "rejected"
                            ? "text-white bg-blue-600"
                            : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                        }`}
                        title="Reject"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Delete */}
                      {isEditable && (
                        <button
                          type="button"
                          onClick={() => setDeleteItemId(display.id)}
                          className="rounded-md p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Remove item"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Combined items — mobile cards */}
      <div className="space-y-3 sm:hidden">
        {visibleDisplayData.map((display, index) => {
          const status = decisions[display.id];
          const hasNote = !!(notes[display.id]?.trim());
          const cardBorder = status === "accepted"
            ? "border-green-200"
            : status === "rejected"
              ? "border-red-200"
              : "border-gray-200";
          const cardBg = status === "accepted"
            ? "bg-green-50/30"
            : status === "rejected"
              ? "bg-red-50/30"
              : index % 2 === 0
                ? "bg-white"
                : "bg-gray-50/60";

          return (
            <div
              key={display.id}
              className={`rounded-xl border p-3 shadow-sm ${cardBorder} ${cardBg}`}
            >
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 text-xs font-medium text-gray-400">
                  {index + 1}.
                </span>
                {display.thumb ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("[ShareActions] lightbox click mobile:", display.id, display.thumb);
                      setLightboxItem(display);
                    }}
                    className="shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                  >
                    <Image
                      src={display.thumb}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-lg object-cover"
                      unoptimized={isExternalImage(display.thumb)}
                    />
                  </button>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {display.name}
                  </p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span>Qty: {display.qty}</span>
                    <span className="font-medium text-gray-900">{formatCurrency(display.price)}</span>
                  </div>
                </div>
              </div>

              {/* Note preview */}
              {hasNote && (
                <p className="mt-2 text-[10px] text-blue-600 bg-blue-50 rounded px-2 py-1 italic">
                  &ldquo;{notes[display.id]}&rdquo;
                </p>
              )}

              {/* Action buttons */}
              <div className="mt-2.5 flex items-center justify-end gap-1 border-t border-gray-100 pt-2">
                {isEditable && (
                  <button
                    type="button"
                    onClick={() => openNotePopup(display.id)}
                    className={`rounded-md p-1.5 transition-colors ${
                      hasNote
                        ? "text-blue-600 bg-blue-50"
                        : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    }`}
                    title={hasNote ? "Edit note" : "Add note"}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => toggleItem(display.id, "accepted")}
                  disabled={submitting}
                  className={`rounded-md p-1.5 transition-colors ${
                    status === "accepted"
                      ? "text-white bg-green-600"
                      : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                  }`}
                  title="Accept"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => toggleItem(display.id, "rejected")}
                  disabled={submitting}
                  className={`rounded-md p-1.5 transition-colors ${
                    status === "rejected"
                      ? "text-white bg-blue-600"
                      : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                  title="Reject"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>

                {isEditable && (
                  <button
                    type="button"
                    onClick={() => setDeleteItemId(display.id)}
                    className="rounded-md p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove item"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <span className="text-sm text-gray-500">Subtotal</span>
          <span className="text-sm tabular-nums text-gray-900">
            {formatCurrency(totalSelling)}
          </span>
        </div>
        <div className="flex items-center justify-between border-b border-gray-100 py-3">
          <span className="text-sm text-gray-500">Shipping &amp; Handling</span>
          <span className="text-sm tabular-nums text-gray-900">
            {formatCurrency(totalShipping)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-3">
          <span className="text-base font-semibold text-gray-900">Total</span>
          <span className="text-lg font-bold tabular-nums text-gray-900">
            {formatCurrency(grandTotal)}
          </span>
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

      {/* Image lightbox overlay */}
      {lightboxItem && lightboxItem.thumb && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setLightboxItem(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-1.5 text-white/90 backdrop-blur-sm transition-colors hover:bg-black/60"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Large image */}
            <div className="relative aspect-square w-full bg-gray-100">
              <Image
                src={lightboxItem.thumb}
                alt={lightboxItem.name}
                fill
                className="object-contain"
                sizes="(max-width: 448px) 100vw, 448px"
                unoptimized={isExternalImage(lightboxItem.thumb)}
              />
            </div>

            {/* Item details */}
            <div className="px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">
                {lightboxItem.name}
              </h3>
              {lightboxItem.itemType && (
                <p className="mt-0.5 text-xs font-medium text-primary">
                  {lightboxItem.itemType}
                </p>
              )}
              <p className="mt-2 text-lg font-bold text-gray-900 tabular-nums">
                {formatCurrency(lightboxItem.price)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Updates the server-rendered header badge via DOM */
function StatusBadgeUpdater({ status }: { status: string }) {
  useEffect(() => {
    const badge = document.getElementById("share-status-badge");
    if (badge) {
      const style = STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600";
      badge.className = `inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${style}`;
      badge.textContent = status;
    }
  }, [status]);

  return null;
}
