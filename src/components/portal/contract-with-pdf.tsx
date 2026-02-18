"use client";

import { useRef } from "react";
import { SignedAgreementView } from "@/components/portal/signed-agreement-view";
import { DownloadPdfButton } from "@/components/portal/download-pdf-button";
import type { FulfillmentType } from "@/types";

/* ────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────── */

interface ClientSafeItem {
  description: string;
  retail_price: number | string;
  price_sold_for?: number | string | null;
  retail_shipping: number | string;
  quantity: number | null;
  category?: string;
  item_type?: string;
  image_url?: string | null;
}

interface BuyerInfo {
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface OrderInfo {
  orderRef: string | null;
  date: string;
  total: number;
}

interface ContractWithPdfProps {
  buyer: BuyerInfo;
  order: OrderInfo;
  companyName: string;
  signedBy: string;
  signedAt: string;
  signatureDataUrl: string | null;
  initialsDataUrl: string | null;
  logoUrl: string | null;
  logoScale: number;
  fulfillmentType: FulfillmentType;
  shippingAddress: string | null;
  /** Items list for the invoice page */
  items: ClientSafeItem[];
  /** Pre-calculated totals */
  itemsTotal: number;
  deliveryTotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  /** Portal-only props */
  shareToken?: string | null;
  contractSignedAt?: string | null;
}

/* ────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────── */

export function ContractWithPdf({
  buyer,
  order,
  companyName,
  signedBy,
  signedAt,
  signatureDataUrl,
  initialsDataUrl,
  logoUrl,
  logoScale,
  fulfillmentType,
  shippingAddress,
  items,
  itemsTotal,
  deliveryTotal,
  discountAmount,
  taxAmount,
  grandTotal,
  shareToken,
  contractSignedAt,
}: ContractWithPdfProps) {
  const contractRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-4">
      {/* Download PDF button */}
      <div className="flex justify-end">
        <DownloadPdfButton
          contractRef={contractRef}
          invoiceData={{
            companyName,
            logoUrl,
            logoScale,
            buyerName: buyer.name,
            buyerEmail: buyer.email,
            buyerPhone: buyer.phone,
            buyerAddress: buyer.address,
            invoiceNumber: order.orderRef,
            date: order.date,
            items,
            itemsTotal,
            deliveryTotal,
            discountAmount,
            taxAmount,
            grandTotal,
            fulfillmentType,
            shippingAddress,
          }}
        />
      </div>

      {/* Signed contract (captured by PDF button) */}
      <div ref={contractRef}>
        <SignedAgreementView
          buyer={buyer}
          order={order}
          companyName={companyName}
          signedBy={signedBy}
          signedAt={signedAt}
          signatureDataUrl={signatureDataUrl}
          initialsDataUrl={initialsDataUrl}
          logoUrl={logoUrl}
          logoScale={logoScale}
          fulfillmentType={fulfillmentType}
          shippingAddress={shippingAddress}
          shareToken={shareToken}
          contractSignedAt={contractSignedAt}
        />
      </div>
    </div>
  );
}
