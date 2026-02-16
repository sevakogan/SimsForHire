"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateProject } from "@/lib/actions/projects";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/invoice-calculations";
import type { DiscountType, FulfillmentType } from "@/types";

export interface DiscountState {
  discountType: DiscountType;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
}

interface InvoiceInfoCardProps {
  projectId: string;
  invoiceNumber: string | null;
  dateRequired: string | null;
  fulfillmentType: string;
  notes: string;
  taxPercent: number;
  discountPercent: number;
  discountType: DiscountType;
  discountAmount: number;
  itemsTotal: number;
  deliveryTotal: number;
  /** Admin cost data for profit display */
  myCost?: number;
  myShipping?: number;
  /** Callback when discount/tax values change locally (before server save) */
  onDiscountChange?: (state: DiscountState) => void;
  /** When true, all fields are locked except invoice notes */
  readOnly?: boolean;
}

type SaveableField =
  | "invoice_number"
  | "notes"
  | "tax_percent"
  | "discount_percent"
  | "discount_type"
  | "discount_amount"
  | "fulfillment_type"
  | "date_required";

/* ── Tiny save / cancel icons ──────────────────────────── */

function CheckIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function XIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function SaveCancelButtons({
  onSave,
  onCancel,
  saving,
}: {
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-0.5 ml-1 animate-fade-in">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-md p-1 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
        title="Save"
      >
        <CheckIcon />
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
        title="Cancel"
      >
        <XIcon />
      </button>
    </span>
  );
}

export function InvoiceInfoCard({
  projectId,
  invoiceNumber,
  dateRequired,
  fulfillmentType,
  notes,
  taxPercent,
  discountPercent,
  discountType,
  discountAmount,
  itemsTotal,
  deliveryTotal,
  myCost,
  myShipping,
  onDiscountChange,
  readOnly = false,
}: InvoiceInfoCardProps) {
  const router = useRouter();

  // "Saved" values — the server-side truth
  const savedInvoice = invoiceNumber ?? "";
  const savedNotes = notes;
  const savedTax = String(taxPercent || "");
  const savedDiscountPercent = String(discountPercent || "");
  const savedDiscountAmount = String(discountAmount || "");
  const savedDate = dateRequired ? dateRequired.slice(0, 10) : "";

  // Local editing state
  const [localInvoice, setLocalInvoice] = useState(savedInvoice);
  const [localNotes, setLocalNotes] = useState(savedNotes);
  const [localTax, setLocalTax] = useState(savedTax);
  const [localDate, setLocalDate] = useState(savedDate);
  const [localDiscountType, setLocalDiscountType] = useState<DiscountType>(discountType);
  const [localDiscountPercent, setLocalDiscountPercent] = useState(savedDiscountPercent);
  const [localDiscountAmount, setLocalDiscountAmount] = useState(savedDiscountAmount);
  const [localFulfillment, setLocalFulfillment] = useState<FulfillmentType>(
    (fulfillmentType as FulfillmentType) || "delivery"
  );
  const [saving, setSaving] = useState(false);

  // Dirty checks
  const invoiceDirty = localInvoice !== savedInvoice;
  const notesDirty = localNotes !== savedNotes;
  const taxDirty = localTax !== savedTax;
  const dateDirty = localDate !== savedDate;
  const discountPercentDirty = localDiscountPercent !== savedDiscountPercent;
  const discountAmountDirty = localDiscountAmount !== savedDiscountAmount;

  const saveField = useCallback(
    async (field: SaveableField, value: string | number) => {
      const payload: Record<string, string | number | null> = {};
      if (field === "invoice_number") {
        payload.invoice_number = (value as string) || null;
      } else if (field === "notes") {
        payload.notes = value as string;
      } else if (field === "tax_percent") {
        payload.tax_percent = Number(value) || 0;
      } else if (field === "discount_percent") {
        payload.discount_percent = Number(value) || 0;
      } else if (field === "discount_type") {
        payload.discount_type = value as string;
      } else if (field === "discount_amount") {
        payload.discount_amount = Number(value) || 0;
      } else if (field === "fulfillment_type") {
        payload.fulfillment_type = value as string;
      } else if (field === "date_required") {
        payload.date_required = (value as string) || null;
      }
      setSaving(true);
      await updateProject(projectId, payload);
      router.refresh();
      setSaving(false);
    },
    [projectId, router]
  );

  // Emit discount state changes to parent for live footer sync
  function emitDiscountChange(overrides: Partial<DiscountState> = {}) {
    onDiscountChange?.({
      discountType: overrides.discountType ?? localDiscountType,
      discountPercent: overrides.discountPercent ?? (parseFloat(localDiscountPercent) || 0),
      discountAmount: overrides.discountAmount ?? (parseFloat(localDiscountAmount) || 0),
      taxPercent: overrides.taxPercent ?? (parseFloat(localTax) || 0),
    });
  }

  /* ── Save/Cancel handlers ────────────────────────────── */

  function handleInvoiceSave() {
    saveField("invoice_number", localInvoice.trim());
  }
  function handleInvoiceCancel() {
    setLocalInvoice(savedInvoice);
  }

  function handleDateSave() {
    saveField("date_required", localDate);
  }
  function handleDateCancel() {
    setLocalDate(savedDate);
  }

  function handleNotesSave() {
    saveField("notes", localNotes);
  }
  function handleNotesCancel() {
    setLocalNotes(savedNotes);
  }

  function handleTaxSave() {
    const num = parseFloat(localTax) || 0;
    saveField("tax_percent", num);
    emitDiscountChange({ taxPercent: num });
  }
  function handleTaxCancel() {
    setLocalTax(savedTax);
    emitDiscountChange({ taxPercent: parseFloat(savedTax) || 0 });
  }

  function handleDiscountPercentSave() {
    const num = parseFloat(localDiscountPercent) || 0;
    saveField("discount_percent", num);
    emitDiscountChange({ discountPercent: num });
  }
  function handleDiscountPercentCancel() {
    setLocalDiscountPercent(savedDiscountPercent);
    emitDiscountChange({ discountPercent: parseFloat(savedDiscountPercent) || 0 });
  }

  function handleDiscountAmountSave() {
    const num = parseFloat(localDiscountAmount) || 0;
    saveField("discount_amount", num);
    emitDiscountChange({ discountAmount: num });
  }
  function handleDiscountAmountCancel() {
    setLocalDiscountAmount(savedDiscountAmount);
    emitDiscountChange({ discountAmount: parseFloat(savedDiscountAmount) || 0 });
  }

  /* ── Immediate-save toggles (no check/x needed) ──────── */

  function handleDiscountTypeToggle(type: DiscountType) {
    setLocalDiscountType(type);
    saveField("discount_type", type);
    emitDiscountChange({ discountType: type });
  }

  function handleFulfillmentToggle(type: FulfillmentType) {
    setLocalFulfillment(type);
    saveField("fulfillment_type", type);
  }

  /* ── Live-update discount for footer preview ─────────── */

  function handleTaxInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setLocalTax(val);
    const num = parseFloat(val);
    emitDiscountChange({ taxPercent: !isNaN(num) ? num : 0 });
  }

  function handleDiscountPercentInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setLocalDiscountPercent(val);
    const num = parseFloat(val);
    emitDiscountChange({ discountPercent: !isNaN(num) ? num : 0 });
  }

  function handleDiscountAmountInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setLocalDiscountAmount(val);
    const num = parseFloat(val);
    emitDiscountChange({ discountAmount: !isNaN(num) ? num : 0 });
  }

  // Calculate totals for display
  const totals = calculateInvoiceTotals({
    itemsTotal,
    deliveryTotal,
    discountType: localDiscountType,
    discountPercent: parseFloat(localDiscountPercent) || 0,
    discountValue: parseFloat(localDiscountAmount) || 0,
    taxPercent: parseFloat(localTax) || 0,
  });

  const profit = myCost !== undefined
    ? totals.grandTotal - ((myCost ?? 0) + (myShipping ?? 0))
    : undefined;

  const inputBase =
    "rounded-lg border border-gray-200 bg-white py-1.5 px-2.5 text-sm font-medium text-gray-900 tabular-nums placeholder:text-gray-400 hover:border-gray-300 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 transition-all";

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      {/* Row 1: Invoice # | Requested By */}
      <div className="flex gap-px bg-gray-100">
        {/* Invoice # */}
        <div className="bg-white px-3 py-3 min-w-0 flex-1">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Invoice #
          </label>
          <div className="flex items-center">
            <input
              type="text"
              value={localInvoice}
              onChange={(e) => setLocalInvoice(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && invoiceDirty) handleInvoiceSave(); if (e.key === "Escape") handleInvoiceCancel(); }}
              placeholder="—"
              disabled={readOnly}
              className={`${inputBase} w-full ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
            />
            {invoiceDirty && !readOnly && (
              <SaveCancelButtons onSave={handleInvoiceSave} onCancel={handleInvoiceCancel} saving={saving} />
            )}
          </div>
        </div>

        {/* Requested By — editable date picker */}
        <div className="bg-white px-3 py-3 min-w-0 flex-1">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Requested By
          </label>
          <div className="flex items-center">
            <input
              type="date"
              value={localDate}
              onChange={(e) => setLocalDate(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && dateDirty) handleDateSave(); if (e.key === "Escape") handleDateCancel(); }}
              disabled={readOnly}
              className={`${inputBase} w-full ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
            />
            {dateDirty && !readOnly && (
              <SaveCancelButtons onSave={handleDateSave} onCancel={handleDateCancel} saving={saving} />
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Fulfillment — Delivery | Pickup | White Glove */}
      <div className="border-t border-gray-100 px-4 py-3">
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Fulfillment
        </label>
        <div className={`grid grid-cols-3 gap-2 ${readOnly ? "opacity-60" : ""}`}>
          <button
            type="button"
            onClick={() => handleFulfillmentToggle("delivery")}
            disabled={readOnly}
            className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-all ${readOnly ? "cursor-not-allowed" : ""} ${
              localFulfillment === "delivery"
                ? "bg-blue-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            Delivery
          </button>
          <button
            type="button"
            onClick={() => handleFulfillmentToggle("pickup")}
            disabled={readOnly}
            className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-all ${readOnly ? "cursor-not-allowed" : ""} ${
              localFulfillment === "pickup"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            Pickup
          </button>
          <button
            type="button"
            onClick={() => handleFulfillmentToggle("white_glove")}
            disabled={readOnly}
            className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-semibold transition-all ${readOnly ? "cursor-not-allowed" : ""} ${
              localFulfillment === "white_glove"
                ? "bg-purple-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
            </svg>
            White Glove
          </button>
        </div>
      </div>

      {/* Row 2: Discount (left) + Tax (right) */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Discount section — left */}
          <div className="flex items-center gap-2 min-w-0">
            <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
            </svg>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 shrink-0">
              Discount
            </span>

            {/* % / $ toggle */}
            <div className={`inline-flex rounded-lg border border-gray-200 overflow-hidden ${readOnly ? "opacity-60" : ""}`}>
              <button
                type="button"
                onClick={() => handleDiscountTypeToggle("percent")}
                disabled={readOnly}
                className={`px-2.5 py-1 text-xs font-semibold transition-all ${readOnly ? "cursor-not-allowed" : ""} ${
                  localDiscountType === "percent"
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => handleDiscountTypeToggle("amount")}
                disabled={readOnly}
                className={`px-2.5 py-1 text-xs font-semibold transition-all border-l border-gray-200 ${readOnly ? "cursor-not-allowed" : ""} ${
                  localDiscountType === "amount"
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                }`}
              >
                $
              </button>
            </div>

            {/* Value input */}
            {localDiscountType === "percent" ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={localDiscountPercent}
                  onChange={handleDiscountPercentInput}
                  onKeyDown={(e) => { if (e.key === "Enter" && discountPercentDirty) handleDiscountPercentSave(); if (e.key === "Escape") handleDiscountPercentCancel(); }}
                  placeholder="0"
                  min={0}
                  max={100}
                  step="0.1"
                  disabled={readOnly}
                  className={`${inputBase} w-20 !border-emerald-200 focus:!border-emerald-400 focus:!ring-emerald-400/20 ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                />
                <span className="text-xs font-medium text-emerald-600">%</span>
                {discountPercentDirty && !readOnly && (
                  <SaveCancelButtons onSave={handleDiscountPercentSave} onCancel={handleDiscountPercentCancel} saving={saving} />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-emerald-600">$</span>
                <input
                  type="number"
                  value={localDiscountAmount}
                  onChange={handleDiscountAmountInput}
                  onKeyDown={(e) => { if (e.key === "Enter" && discountAmountDirty) handleDiscountAmountSave(); if (e.key === "Escape") handleDiscountAmountCancel(); }}
                  placeholder="0.00"
                  min={0}
                  step="0.01"
                  disabled={readOnly}
                  className={`${inputBase} w-24 !border-emerald-200 focus:!border-emerald-400 focus:!ring-emerald-400/20 ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                />
                {discountAmountDirty && !readOnly && (
                  <SaveCancelButtons onSave={handleDiscountAmountSave} onCancel={handleDiscountAmountCancel} saving={saving} />
                )}
              </div>
            )}

            {/* Info icon with tooltip — "Applies to items only" */}
            <div className="relative group hidden sm:block">
              <svg className="h-3.5 w-3.5 text-gray-300 cursor-help" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100 shadow-lg">
                Applies to items only
              </div>
            </div>
          </div>

          {/* Tax section — pushed right */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 shrink-0">
              Tax
            </span>
            <input
              type="number"
              value={localTax}
              onChange={handleTaxInput}
              onKeyDown={(e) => { if (e.key === "Enter" && taxDirty) handleTaxSave(); if (e.key === "Escape") handleTaxCancel(); }}
              placeholder="0"
              min={0}
              max={100}
              step="0.1"
              disabled={readOnly}
              className={`${inputBase} w-16 ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
            />
            <span className="text-xs font-medium text-gray-400">%</span>
            {taxDirty && !readOnly && (
              <SaveCancelButtons onSave={handleTaxSave} onCancel={handleTaxCancel} saving={saving} />
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Invoice Notes
          </label>
          {notesDirty && (
            <SaveCancelButtons onSave={handleNotesSave} onCancel={handleNotesCancel} saving={saving} />
          )}
        </div>
        <textarea
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          placeholder="Add notes visible to the customer..."
          rows={2}
          className="w-full rounded-lg border border-gray-200 bg-white py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 resize-y transition-all"
        />
      </div>

      {/* Summary bar */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: line items */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
            <span className="text-gray-400">
              Items{" "}
              <span className="font-semibold tabular-nums text-gray-700">
                {formatCurrency(totals.itemsTotal)}
              </span>
            </span>
            <span className="text-gray-400">
              Services{" "}
              <span className="font-semibold tabular-nums text-gray-700">
                {formatCurrency(totals.deliveryTotal)}
              </span>
            </span>
            {totals.taxAmount > 0 && (
              <span className="text-gray-400">
                Tax{" "}
                <span className="font-semibold tabular-nums text-gray-700">
                  {formatCurrency(totals.taxAmount)}
                </span>
              </span>
            )}
            {totals.discountAmount > 0 && (
              <span className="text-gray-400">
                Discount{" "}
                <span className="font-semibold tabular-nums text-emerald-600">
                  −{formatCurrency(totals.discountAmount)}
                </span>
              </span>
            )}
          </div>

          {/* Right: Total + Profit */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-baseline gap-1.5 pl-4 border-l border-gray-200">
              <span className="text-xs font-medium text-gray-500">Total</span>
              <span className="text-base font-black tabular-nums text-gray-900">
                {formatCurrency(totals.grandTotal)}
              </span>
            </div>
            {profit !== undefined && (
              <div className="flex items-baseline gap-1.5 pl-4 border-l border-gray-200">
                <span className="text-xs font-medium text-gray-400">Profit</span>
                <span className={`text-base font-black tabular-nums ${profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {formatCurrency(profit)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
