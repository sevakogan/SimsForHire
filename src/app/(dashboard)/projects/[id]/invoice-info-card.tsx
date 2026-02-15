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
}

export function InvoiceInfoCard({
  projectId,
  invoiceNumber,
  dateRequired,
  fulfillmentType,
  notes,
}: InvoiceInfoCardProps) {
  const router = useRouter();
  const [localInvoice, setLocalInvoice] = useState(invoiceNumber ?? "");
  const [localNotes, setLocalNotes] = useState(notes);
  const invoiceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveField = useCallback(
    (field: "invoice_number" | "notes", value: string) => {
      const payload =
        field === "invoice_number"
          ? { invoice_number: value || null }
          : { notes: value };
      updateProject(projectId, payload).then(() => router.refresh());
    },
    [projectId, router]
  );

  const handleInvoiceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalInvoice(val);
      if (invoiceTimer.current) clearTimeout(invoiceTimer.current);
      invoiceTimer.current = setTimeout(() => {
        saveField("invoice_number", val.trim());
      }, 800);
    },
    [saveField]
  );

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setLocalNotes(val);
      if (notesTimer.current) clearTimeout(notesTimer.current);
      notesTimer.current = setTimeout(() => {
        saveField("notes", val);
      }, 800);
    },
    [saveField]
  );

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
            className="mt-0.5 w-full max-w-[160px] rounded-md border border-transparent bg-transparent py-0.5 px-1.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground/40 hover:border-border/60 focus:border-primary/40 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/40"
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
