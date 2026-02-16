"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateProject } from "@/lib/actions/projects";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/invoice-calculations";
import type { DiscountType, FulfillmentType } from "@/types";

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
      } else if (val === "") {
        debouncedSave("tax_percent", 0);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [saveField]
  );

  function handleDiscountTypeToggle(type: DiscountType) {
    setLocalDiscountType(type);
    saveField("discount_type", type);
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
      } else if (val === "") {
        debouncedSave("discount_percent", 0);
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
      } else if (val === "") {
        debouncedSave("discount_amount", 0);
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

  const inlineInput =
    "w-full rounded-lg border border-gray-200 bg-white/80 py-1.5 px-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 transition-all";

  const labelClass =
    "text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400";

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 shadow-sm overflow-hidden">
      {/* Header accent bar */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      {/* Top row: Invoice details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
        {/* Invoice Number */}
        <div className="p-3 sm:p-4">
          <p className={labelClass}>Invoice #</p>
          <input
            type="text"
            value={localInvoice}
            onChange={handleInvoiceChange}
            placeholder="Not set"
            className={`${inlineInput} mt-1.5`}
          />
        </div>

        {/* Required By */}
        <div className="p-3 sm:p-4">
          <p className={labelClass}>Required By</p>
          <p className="text-sm font-medium text-gray-900 mt-2.5 px-1">
            {dateRequired
              ? new Date(dateRequired).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>

        {/* Fulfillment Toggle */}
        <div className="p-3 sm:p-4">
          <p className={labelClass}>Fulfillment</p>
          <div className="mt-1.5 inline-flex rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => handleFulfillmentToggle("delivery")}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition-all ${
                localFulfillment === "delivery"
                  ? "bg-blue-500 text-white shadow-inner"
                  : "bg-white text-gray-500 hover:bg-gray-50"
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
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold transition-all border-l border-gray-200 ${
                localFulfillment === "pickup"
                  ? "bg-amber-500 text-white shadow-inner"
                  : "bg-white text-gray-500 hover:bg-gray-50"
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
        <div className="p-3 sm:p-4">
          <p className={labelClass}>Tax</p>
          <div className="flex items-center gap-1 mt-1.5">
            <input
              type="number"
              value={localTax}
              onChange={handleTaxChange}
              placeholder="0"
              min={0}
              max={100}
              step="0.1"
              className={`${inlineInput} max-w-[80px] tabular-nums`}
            />
            <span className="text-xs font-medium text-gray-400">%</span>
          </div>
        </div>
      </div>

      {/* Discount row */}
      <div className="border-t border-gray-100 bg-gradient-to-r from-emerald-50/40 to-transparent p-3 sm:p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
            </div>
            <p className={`${labelClass} !text-emerald-700`}>Discount</p>
          </div>

          {/* Toggle: % or $ */}
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => handleDiscountTypeToggle("percent")}
              className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                localDiscountType === "percent"
                  ? "bg-emerald-500 text-white shadow-inner"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              %
            </button>
            <button
              type="button"
              onClick={() => handleDiscountTypeToggle("amount")}
              className={`px-3 py-1.5 text-xs font-semibold transition-all border-l border-gray-200 ${
                localDiscountType === "amount"
                  ? "bg-emerald-500 text-white shadow-inner"
                  : "bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              $
            </button>
          </div>

          {/* Discount input */}
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
                className={`${inlineInput} max-w-[80px] tabular-nums !border-emerald-200 focus:!border-emerald-400 focus:!ring-emerald-400/20`}
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
                className={`${inlineInput} max-w-[100px] tabular-nums !border-emerald-200 focus:!border-emerald-400 focus:!ring-emerald-400/20`}
              />
            </div>
          )}

          <span className="text-[10px] text-gray-400 ml-auto hidden sm:inline italic">
            Applied to items only
          </span>
        </div>
      </div>

      {/* Notes */}
      <div className="border-t border-gray-100 p-3 sm:p-4">
        <p className={`${labelClass} mb-1.5`}>Invoice Notes</p>
        <textarea
          value={localNotes}
          onChange={handleNotesChange}
          placeholder="Add notes visible to the customer..."
          rows={2}
          className="w-full rounded-lg border border-gray-200 bg-white/80 py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 resize-y transition-all"
        />
      </div>

      {/* Totals preview — Items → Services → Tax → Discount → Total → Profit */}
      <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50 px-4 sm:px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-2 w-2 rounded-full bg-indigo-400" />
            <span className="text-gray-500">Items</span>
            <span className="font-bold tabular-nums text-gray-900">
              {formatCurrency(totals.itemsTotal)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-gray-500">Services</span>
            <span className="font-bold tabular-nums text-gray-900">
              {formatCurrency(totals.deliveryTotal)}
            </span>
          </div>
          {totals.taxAmount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-gray-500">Tax</span>
              <span className="font-bold tabular-nums text-gray-900">
                {formatCurrency(totals.taxAmount)}
              </span>
            </div>
          )}
          {totals.discountAmount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-gray-500">Discount</span>
              <span className="font-bold tabular-nums text-emerald-600">
                −{formatCurrency(totals.discountAmount)}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
            <span className="text-gray-500 font-medium">Total</span>
            <span className="font-black tabular-nums text-gray-900 text-base">
              {formatCurrency(totals.grandTotal)}
            </span>
          </div>
          {myCost !== undefined && (
            <div className="flex items-center gap-2 pl-3 border-l border-dashed border-gray-300">
              <span className="text-gray-400 font-medium">Profit</span>
              {(() => {
                const totalMyCostCalc = (myCost ?? 0) + (myShipping ?? 0);
                const profit = totals.grandTotal - totalMyCostCalc;
                return (
                  <span className={`font-black tabular-nums text-base ${profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {formatCurrency(profit)}
                  </span>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
