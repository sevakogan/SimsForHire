"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { InvoiceInfoCard } from "./invoice-info-card";
import { InvoiceSummaryFooter } from "@/components/invoice/invoice-summary-footer";
import type { DiscountState } from "./invoice-info-card";
import type { DiscountType, FulfillmentType } from "@/types";

/* ── Context for live discount/tax state ──────────────── */

const DiscountContext = createContext<DiscountState | null>(null);

function useDiscountState() {
  return useContext(DiscountContext);
}

/* ── Context for live fulfillment type ────────────────── */

const FulfillmentContext = createContext<FulfillmentType>("delivery");

export function useFulfillmentType() {
  return useContext(FulfillmentContext);
}

/* ── Provider wraps the whole page section ────────────── */

interface InvoiceDiscountProviderProps {
  discountType: DiscountType;
  discountPercent: number;
  discountAmount: number;
  additionalDiscount: number;
  taxPercent: number;
  fulfillmentType: FulfillmentType;
  children: ReactNode;
}

export function InvoiceDiscountProvider({
  discountType,
  discountPercent,
  discountAmount,
  additionalDiscount,
  taxPercent,
  fulfillmentType,
  children,
}: InvoiceDiscountProviderProps) {
  const [liveDiscount, setLiveDiscount] = useState<DiscountState>({
    discountType,
    discountPercent,
    discountAmount,
    additionalDiscount,
    taxPercent,
  });

  const [liveFulfillment, setLiveFulfillment] = useState<FulfillmentType>(fulfillmentType);

  return (
    <DiscountContext.Provider value={liveDiscount}>
      <FulfillmentContext.Provider value={liveFulfillment}>
        {/* Expose setters via hidden contexts */}
        <SetterContext.Provider value={setLiveDiscount}>
          <FulfillmentSetterContext.Provider value={setLiveFulfillment}>
            {children}
          </FulfillmentSetterContext.Provider>
        </SetterContext.Provider>
      </FulfillmentContext.Provider>
    </DiscountContext.Provider>
  );
}

const SetterContext = createContext<((s: DiscountState) => void) | null>(null);
const FulfillmentSetterContext = createContext<((f: FulfillmentType) => void) | null>(null);

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
  additionalDiscount: number;
  itemsTotal: number;
  deliveryTotal: number;
  myCost?: number;
  myShipping?: number;
  /** When true, all fields locked except invoice notes */
  readOnly?: boolean;
}

export function InvoiceSection(props: InvoiceSectionProps) {
  const setter = useContext(SetterContext);
  const fulfillmentSetter = useContext(FulfillmentSetterContext);

  return (
    <InvoiceInfoCard
      {...props}
      onDiscountChange={setter ?? undefined}
      onFulfillmentChange={fulfillmentSetter ?? undefined}
      readOnly={props.readOnly}
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
  additionalDiscount: number;
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
  additionalDiscount,
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
      additionalDiscount={live?.additionalDiscount ?? additionalDiscount}
      taxPercent={live?.taxPercent ?? taxPercent}
      myCost={myCost}
      myShipping={myShipping}
    />
  );
}
