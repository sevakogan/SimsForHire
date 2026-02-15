"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateProject } from "@/lib/actions/projects";

interface InvoiceInfoCardProps {
  projectId: string;
  invoiceNumber: string | null;
  dateRequired: string | null;
  fulfillmentType: string;
  notes: string;
  taxPercent: number;
  discountPercent: number;
}

type FieldName = "invoice_number" | "notes" | "tax_percent" | "discount_percent";

export function InvoiceInfoCard({
  projectId,
  invoiceNumber,
  dateRequired,
  fulfillmentType,
  notes,
  taxPercent,
  discountPercent,
}: InvoiceInfoCardProps) {
  const router = useRouter();
  const [localInvoice, setLocalInvoice] = useState(invoiceNumber ?? "");
  const [localNotes, setLocalNotes] = useState(notes);
  const [localTax, setLocalTax] = useState(String(taxPercent || ""));
  const [localDiscount, setLocalDiscount] = useState(String(discountPercent || ""));
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const saveField = useCallback(
    (field: FieldName, value: string | number) => {
      const payload: Record<string, string | number | null> = {};
      if (field === "invoice_number") {
        payload.invoice_number = (value as string) || null;
      } else if (field === "notes") {
        payload.notes = value as string;
      } else if (field === "tax_percent") {
        payload.tax_percent = Number(value) || 0;
      } else if (field === "discount_percent") {
        payload.discount_percent = Number(value) || 0;
      }
      updateProject(projectId, payload).then(() => router.refresh());
    },
    [projectId, router]
  );

  function debouncedSave(field: FieldName, value: string | number) {
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

  const handleDiscountChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalDiscount(val);
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

  const inlineInput =
    "mt-0.5 w-full rounded-md border border-transparent bg-transparent py-0.5 px-1.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground/40 hover:border-border/60 focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/40";

  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm sm:p-5 space-y-4">
      {/* Top row: Invoice #, Required By, Fulfillment */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
            Invoice Number
          </p>
          <input
            type="text"
            value={localInvoice}
            onChange={handleInvoiceChange}
            placeholder="Not set"
            className={`${inlineInput} max-w-[160px]`}
          />
        </div>
        {dateRequired && (
          <div className="text-right shrink-0">
            <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
              Required By
            </p>
            <p className="text-sm text-foreground mt-0.5">
              {new Date(dateRequired).toLocaleDateString()}
            </p>
          </div>
        )}
        <div className="text-right shrink-0">
          <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
            Fulfillment
          </p>
          <p className="text-sm text-foreground mt-0.5 capitalize">
            {fulfillmentType}
          </p>
        </div>
      </div>

      {/* Tax & Discount row */}
      <div className="flex items-center gap-4">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
            Tax %
          </p>
          <div className="flex items-center gap-1 mt-0.5">
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
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground">
            Discount %
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <input
              type="number"
              value={localDiscount}
              onChange={handleDiscountChange}
              placeholder="0"
              min={0}
              max={100}
              step="0.1"
              className={`${inlineInput} max-w-[80px] tabular-nums`}
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      {/* Notes textarea */}
      <div>
        <p className="text-[10px] sm:text-xs font-medium uppercase text-muted-foreground mb-1">
          Invoice Notes
        </p>
        <textarea
          value={localNotes}
          onChange={handleNotesChange}
          placeholder="Add notes visible to the customer..."
          rows={2}
          className="w-full rounded-md border border-border/40 bg-transparent py-2 px-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 hover:border-border focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/40 resize-y"
        />
      </div>
    </div>
  );
}
