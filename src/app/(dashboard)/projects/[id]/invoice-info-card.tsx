"use client";

import { useState, useRef, useCallback } from "react";
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
}

type SaveableField =
  | "invoice_number"
  | "notes"
  | "tax_percent"
  | "discount_percent"
  | "discount_type"
  | "discount_amount"
  | "fulfillment_type";

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
}: InvoiceInfoCardProps) {
  const router = useRouter();
  const [localInvoice, setLocalInvoice] = useState(invoiceNumber ?? "");
  const [localNotes, setLocalNotes] = useState(notes);
  const [localTax, setLocalTax] = useState(String(taxPercent || ""));
  const [localDiscountType, setLocalDiscountType] = useState<DiscountType>(discountType);
  const [localDiscountPercent, setLocalDiscountPercent] = useState(String(discountPercent || ""));
  const [localDiscountAmount, setLocalDiscountAmount] = useState(String(discountAmount || ""));
  const [localFulfillment, setLocalFulfillment] = useState<FulfillmentType>(
    (fulfillmentType as FulfillmentType) || "delivery"
  );
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const saveField = useCallback(
    (field: SaveableField, value: string | number) => {
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
      }
      updateProject(projectId, payload).then(() => router.refresh());
    },
    [projectId, router]
  );

  function debouncedSave(field: SaveableField, value: string | number) {
    if (timers.current[field]) clearTimeout(timers.current[field]);
    timers.current[field] = setTimeout(() => {
      saveField(field, value);
      delete timers.current[field];
    }, 800);
  }

  const handleInvoiceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalInvoice(val);
      debouncedSave("invoice_number", val.trim());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saveField]
  );

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setLocalNotes(val);
      debouncedSave("notes", val);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saveField]
  );

  const handleTaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalTax(val);
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 0 && num <= 100) {
        debouncedSave("tax_percent", num);
        emitDiscountChange({ taxPercent: num });
      } else if (val === "") {
        debouncedSave("tax_percent", 0);
        emitDiscountChange({ taxPercent: 0 });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saveField]
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

  function handleDiscountTypeToggle(type: DiscountType) {
    setLocalDiscountType(type);
    saveField("discount_type", type);
    emitDiscountChange({ discountType: type });
  }

  function handleFulfillmentToggle(type: FulfillmentType) {
    setLocalFulfillment(type);
    saveField("fulfillment_type", type);
  }

  const handleDiscountPercentChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalDiscountPercent(val);
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 0 && num <= 100) {
        debouncedSave("discount_percent", num);
        emitDiscountChange({ discountPercent: num });
      } else if (val === "") {
        debouncedSave("discount_percent", 0);
        emitDiscountChange({ discountPercent: 0 });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saveField]
  );

  const handleDiscountAmountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalDiscountAmount(val);
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 0) {
        debouncedSave("discount_amount", num);
        emitDiscountChange({ discountAmount: num });
      } else if (val === "") {
        debouncedSave("discount_amount", 0);
        emitDiscountChange({ discountAmount: 0 });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saveField]
  );

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

      {/* Fields grid — consistent cell height */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-100">
        {/* Invoice # */}
        <div className="bg-white px-4 py-3.5">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Invoice #
          </label>
          <input
            type="text"
            value={localInvoice}
            onChange={handleInvoiceChange}
            placeholder="—"
            className={`${inputBase} w-full`}
          />
        </div>

        {/* Required By */}
        <div className="bg-white px-4 py-3.5">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Required By
          </label>
          <div className="flex h-[34px] items-center">
            <span className="text-sm font-medium text-gray-900">
              {dateRequired
                ? new Date(dateRequired).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </span>
          </div>
        </div>

        {/* Fulfillment */}
        <div className="bg-white px-4 py-3.5">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Fulfillment
          </label>
          <div className="inline-flex h-[34px] rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => handleFulfillmentToggle("delivery")}
              className={`flex items-center gap-1 px-2.5 text-xs font-semibold transition-all ${
                localFulfillment === "delivery"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
              </svg>
              Delivery
            </button>
            <button
              type="button"
              onClick={() => handleFulfillmentToggle("pickup")}
              className={`flex items-center gap-1 px-2.5 text-xs font-semibold transition-all border-l border-gray-200 ${
                localFulfillment === "pickup"
                  ? "bg-amber-500 text-white"
                  : "bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              }`}
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              Pickup
            </button>
          </div>
        </div>

        {/* Tax */}
        <div className="bg-white px-4 py-3.5">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Tax
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={localTax}
              onChange={handleTaxChange}
              placeholder="0"
              min={0}
              max={100}
              step="0.1"
              className={`${inputBase} w-20`}
            />
            <span className="text-xs font-medium text-gray-400">%</span>
          </div>
        </div>
      </div>

      {/* Discount row */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 shrink-0">
            Discount
          </span>

          {/* % / $ toggle */}
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => handleDiscountTypeToggle("percent")}
              className={`px-2.5 py-1 text-xs font-semibold transition-all ${
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
              className={`px-2.5 py-1 text-xs font-semibold transition-all border-l border-gray-200 ${
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
                onChange={handleDiscountPercentChange}
                placeholder="0"
                min={0}
                max={100}
                step="0.1"
                className={`${inputBase} w-20 !border-emerald-200 focus:!border-emerald-400 focus:!ring-emerald-400/20`}
              />
              <span className="text-xs font-medium text-emerald-600">%</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-emerald-600">$</span>
              <input
                type="number"
                value={localDiscountAmount}
                onChange={handleDiscountAmountChange}
                placeholder="0.00"
                min={0}
                step="0.01"
                className={`${inputBase} w-24 !border-emerald-200 focus:!border-emerald-400 focus:!ring-emerald-400/20`}
              />
            </div>
          )}

          <span className="text-[10px] text-gray-400 ml-auto hidden sm:inline">
            Items only
          </span>
        </div>
      </div>

      {/* Notes */}
      <div className="border-t border-gray-100 px-4 py-3">
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
          Invoice Notes
        </label>
        <textarea
          value={localNotes}
          onChange={handleNotesChange}
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
