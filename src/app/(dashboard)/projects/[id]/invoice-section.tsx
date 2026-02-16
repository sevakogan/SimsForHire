"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { InvoiceInfoCard } from "./invoice-info-card";
import { InvoiceSummaryFooter } from "@/components/invoice/invoice-summary-footer";
import type { DiscountState } from "./invoice-info-card";
import type { DiscountType } from "@/types";

/* ── Context for live discount/tax state ──────────────── */

const DiscountContext = createContext<DiscountState | null>(null);

function useDiscountState() {
  return useContext(DiscountContext);
}

/* ── Provider wraps the whole page section ────────────── */

interface InvoiceDiscountProviderProps {
  discountType: DiscountType;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  children: ReactNode;
}

export function InvoiceDiscountProvider({
  discountType,
  discountPercent,
  discountAmount,
  taxPercent,
  children,
}: InvoiceDiscountProviderProps) {
  const [liveDiscount, setLiveDiscount] = useState<DiscountState>({
    discountType,
    discountPercent,
    discountAmount,
    taxPercent,
  });

  return (
    <DiscountContext.Provider value={liveDiscount}>
      {/* Expose setter via a hidden context — we pass it via the InvoiceInfoCardWrapper */}
      <SetterContext.Provider value={setLiveDiscount}>
        {children}
      </SetterContext.Provider>
    </DiscountContext.Provider>
  );
}

const SetterContext = createContext<((s: DiscountState) => void) | null>(null);

/* ── InvoiceInfoCard that auto-wires to context ──────── */

interface InvoiceSectionProps {
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
}

export function InvoiceSection(props: InvoiceSectionProps) {
  const setter = useContext(SetterContext);

  return (
    <InvoiceInfoCard
      {...props}
      onDiscountChange={setter ?? undefined}
    />
  );
}

/* ── Footer that reads live discount from context ─────── */

interface LiveFooterProps {
  itemsTotal: number;
  deliveryTotal: number;
  /** Fallback values (from server) used if context is not available */
  discountType: DiscountType;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  myCost?: number;
  myShipping?: number;
}

export function LiveInvoiceFooter({
  itemsTotal,
  deliveryTotal,
  discountType,
  discountPercent,
  discountAmount,
  taxPercent,
  myCost,
  myShipping,
}: LiveFooterProps) {
  const live = useDiscountState();

  return (
    <InvoiceSummaryFooter
      itemsTotal={itemsTotal}
      deliveryTotal={deliveryTotal}
      discountType={live?.discountType ?? discountType}
      discountPercent={live?.discountPercent ?? discountPercent}
      discountAmount={live?.discountAmount ?? discountAmount}
      taxPercent={live?.taxPercent ?? taxPercent}
      myCost={myCost}
      myShipping={myShipping}
    />
  );
}
