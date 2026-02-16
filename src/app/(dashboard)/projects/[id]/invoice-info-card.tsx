"use client";

import { useState, useRef, useTransition } from "react";
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
  myCost?: number;
  myShipping?: number;
  onDiscountChange?: (state: DiscountState) => void;
  readOnly?: boolean;
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
  const [, startTransition] = useTransition();

  // "Saved" values — the server-side truth
  const savedInvoice = invoiceNumber ?? "";
  const savedNotes = notes;
  const savedTax = String(taxPercent || "");
  const savedDate = dateRequired ? dateRequired.slice(0, 10) : "";
  const savedDiscountPercent = String(discountPercent || "");
  const savedDiscountAmount = String(discountAmount || "");

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

  // Refs for blur handlers to read latest values
  const invoiceRef = useRef(localInvoice);
  invoiceRef.current = localInvoice;
  const notesRef = useRef(localNotes);
  notesRef.current = localNotes;
  const taxRef = useRef(localTax);
  taxRef.current = localTax;
  const discountPctRef = useRef(localDiscountPercent);
  discountPctRef.current = localDiscountPercent;
  const discountAmtRef = useRef(localDiscountAmount);
  discountAmtRef.current = localDiscountAmount;

  // Emit discount state changes to parent for live footer sync
  function emitDiscountChange(overrides: Partial<DiscountState> = {}) {
    onDiscountChange?.({
      discountType: overrides.discountType ?? localDiscountType,
      discountPercent: overrides.discountPercent ?? (parseFloat(discountPctRef.current) || 0),
      discountAmount: overrides.discountAmount ?? (parseFloat(discountAmtRef.current) || 0),
      taxPercent: overrides.taxPercent ?? (parseFloat(taxRef.current) || 0),
    });
  }

  /**
   * Persist a field via server action inside startTransition.
   * This is the correct Next.js pattern — ensures the action runs
   * through React's server-action channel and refreshes data after.
   */
  function persist(field: string, value: string | number | null) {
    startTransition(async () => {
      await updateProject(projectId, { [field]: value });
      router.refresh();
    });
  }

  /* ── Blur auto-save handlers ───────────────────────────── */

  function handleInvoiceBlur() {
    const trimmed = invoiceRef.current.trim();
    setLocalInvoice(trimmed);
    persist("invoice_number", trimmed || null);
  }

  function handleDateChange(newDate: string) {
    setLocalDate(newDate);
    persist("date_required", newDate || null);
  }

  function handleNotesBlur() {
    persist("notes", notesRef.current);
  }

  function handleTaxBlur() {
    const num = parseFloat(taxRef.current) || 0;
    setLocalTax(String(num || ""));
    emitDiscountChange({ taxPercent: num });
    persist("tax_percent", num);
  }

  function handleDiscountPercentBlur() {
    const num = parseFloat(discountPctRef.current) || 0;
    setLocalDiscountPercent(String(num || ""));
    emitDiscountChange({ discountPercent: num });
    persist("discount_percent", num);
  }

  function handleDiscountAmountBlur() {
    const num = parseFloat(discountAmtRef.current) || 0;
    setLocalDiscountAmount(String(num || ""));
    emitDiscountChange({ discountAmount: num });
    persist("discount_amount", num);
  }

  /* ── Immediate-save toggles ────────────────────────────── */

  function handleDiscountTypeToggle(type: DiscountType) {
    setLocalDiscountType(type);
    emitDiscountChange({ discountType: type });
    persist("discount_type", type);
  }

  function handleFulfillmentToggle(type: FulfillmentType) {
    setLocalFulfillment(type);
    persist("fulfillment_type", type);
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
          <input
            type="text"
            value={localInvoice}
            onChange={(e) => setLocalInvoice(e.target.value)}
            onBlur={handleInvoiceBlur}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
            placeholder="—"
            disabled={readOnly}
            className={`${inputBase} w-full ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
          />
        </div>

        {/* Requested By — auto-saves on change */}
        <div className="bg-white px-3 py-3 min-w-0 flex-1">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Requested By
          </label>
          <input
            type="date"
            value={localDate}
            onChange={(e) => handleDateChange(e.target.value)}
            disabled={readOnly}
            className={`${inputBase} w-full ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
          />
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

      {/* Row 3: Discount (left) + Tax (right) */}
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
                  onBlur={handleDiscountPercentBlur}
                  onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                  placeholder="0"
                  min={0}
                  max={100}
                  step="0.1"
                  disabled={readOnly}
                  className={`${inputBase} w-20 !border-emerald-200 focus:!border-emerald-400 focus:!ring-emerald-400/20 ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                />
                <span className="text-xs font-medium text-emerald-600">%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-emerald-600">$</span>
                <input
                  type="number"
                  value={localDiscountAmount}
                  onChange={handleDiscountAmountInput}
                  onBlur={handleDiscountAmountBlur}
                  onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
                  placeholder="0.00"
                  min={0}
                  step="0.01"
                  disabled={readOnly}
                  className={`${inputBase} w-24 !border-emerald-200 focus:!border-emerald-400 focus:!ring-emerald-400/20 ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                />
              </div>
            )}

            {/* Info icon with tooltip */}
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
              onBlur={handleTaxBlur}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
              placeholder="0"
              min={0}
              max={100}
              step="0.1"
              disabled={readOnly}
              className={`${inputBase} w-16 ${readOnly ? "opacity-60 cursor-not-allowed" : ""}`}
            />
            <span className="text-xs font-medium text-gray-400">%</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="border-t border-gray-100 px-4 py-3">
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
          Invoice Notes
        </label>
        <textarea
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          onBlur={handleNotesBlur}
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
