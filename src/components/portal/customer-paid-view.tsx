"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/invoice-calculations";
import { FullContractPdf } from "@/components/pdf/full-contract-pdf";
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

interface InvoiceData {
  companyName: string;
  logoUrl: string | null;
  logoScale: number;
  buyerName: string;
  buyerEmail: string | null;
  buyerPhone: string | null;
  buyerAddress: string | null;
  invoiceNumber: string | null;
  date: string;
  items: ClientSafeItem[];
  itemsTotal: number;
  deliveryTotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  fulfillmentType: FulfillmentType;
  shippingAddress: string | null;
}

interface ContractData {
  signedBy: string | null;
  signedAt: string | null;
  signatureDataUrl: string | null;
  initialsDataUrl: string | null;
}

interface CustomerPaidViewProps {
  token: string;
  buyerName: string;
  companyName: string;
  invoiceNumber: string | null;
  receiptNumber: string | null;
  paymentDate: string | null;
  paymentAmount: string;
  grandTotal: string;
  invoiceData: InvoiceData;
  contractData: ContractData;
}

/* ────────────────────────────────────────────────
   Fulfillment labels
   ──────────────────────────────────────────────── */

const FULFILLMENT_LABELS: Record<FulfillmentType, string> = {
  pickup: "Pickup",
  delivery: "Delivery",
  white_glove: "White Glove Delivery",
};

/* ────────────────────────────────────────────────
   Receipt Popup
   ──────────────────────────────────────────────── */

function ReceiptPopup({
  open,
  onClose,
  companyName,
  buyerName,
  invoiceNumber,
  receiptNumber,
  paymentDate,
  paymentAmount,
  grandTotal,
  invoiceData,
}: {
  open: boolean;
  onClose: () => void;
  companyName: string;
  buyerName: string;
  invoiceNumber: string | null;
  receiptNumber: string | null;
  paymentDate: string | null;
  paymentAmount: string;
  grandTotal: string;
  invoiceData: InvoiceData;
}) {
  if (!open) return null;

  const shortReceipt = receiptNumber
    ? receiptNumber.replace("pi_", "").slice(0, 12).toUpperCase()
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Receipt card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top decorative strip */}
        <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-6 py-8 sm:px-8">
          {/* Company header */}
          <div className="text-center mb-6">
            {invoiceData.logoUrl && (
              <img
                src={invoiceData.logoUrl}
                alt={companyName}
                className="mx-auto mb-3 rounded-lg object-contain"
                style={{
                  width: `${40 * (invoiceData.logoScale / 100)}px`,
                  height: `${40 * (invoiceData.logoScale / 100)}px`,
                }}
              />
            )}
            <h2 className="text-lg font-bold text-gray-900 tracking-wide">
              {companyName}
            </h2>
            <div className="mt-2 flex items-center justify-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                Payment Receipt
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          </div>

          {/* Receipt details */}
          <div className="space-y-0 divide-y divide-gray-100">
            {shortReceipt && (
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">Receipt #</span>
                <span className="text-sm font-mono font-semibold text-gray-900">
                  {shortReceipt}
                </span>
              </div>
            )}

            {invoiceNumber && (
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">Invoice #</span>
                <span className="text-sm font-semibold tabular-nums text-gray-900">
                  {invoiceNumber}
                </span>
              </div>
            )}

            {paymentDate && (
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-sm font-semibold text-gray-900">
                  {paymentDate}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-500">Paid By</span>
              <span className="text-sm font-semibold text-gray-900">
                {buyerName}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-500">Paid To</span>
              <span className="text-sm font-semibold text-gray-900">
                {companyName}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-500">Amount Paid</span>
              <span className="text-sm font-bold tabular-nums text-green-600">
                {paymentAmount}
              </span>
            </div>
          </div>

          {/* Grand total */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3.5">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-xl font-black tabular-nums text-gray-900">
              {grandTotal}
            </span>
          </div>

          {/* Status badge */}
          <div className="mt-5 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-4 py-1.5 text-xs font-semibold text-green-700 uppercase tracking-wider">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Payment Confirmed
            </span>
          </div>
        </div>

        {/* Bottom dashed tear edge */}
        <div className="border-t border-dashed border-gray-200 px-6 py-4 bg-gray-50/50 text-center">
          <p className="text-[11px] text-gray-400">
            Thank you for your business
          </p>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Download Package (Receipt + Invoice + Contract)
   ──────────────────────────────────────────────── */

function DownloadPackageButton({
  invoiceData,
  companyName,
  buyerName,
  invoiceNumber,
  receiptNumber,
  paymentDate,
  paymentAmount,
  grandTotal,
  contractData,
}: {
  invoiceData: InvoiceData;
  companyName: string;
  buyerName: string;
  invoiceNumber: string | null;
  receiptNumber: string | null;
  paymentDate: string | null;
  paymentAmount: string;
  grandTotal: string;
  contractData: ContractData;
}) {
  const [generating, setGenerating] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const shortReceipt = receiptNumber
    ? receiptNumber.replace("pi_", "").slice(0, 12).toUpperCase()
    : null;

  const d = invoiceData;
  const showShippingAddress =
    d.fulfillmentType !== "pickup" && d.shippingAddress;

  const handleDownload = useCallback(async () => {
    if (generating) return;
    setGenerating(true);

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;

      const captureElement = async (el: HTMLElement) => {
        return html2canvas(el, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
      };

      const addCanvasToPdf = (canvas: HTMLCanvasElement, isFirst: boolean) => {
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let remainingHeight = imgHeight;
        let yOffset = 0;
        let first = isFirst;

        while (remainingHeight > 0) {
          const pageContentHeight = pdfHeight - margin * 2;

          if (!first) pdf.addPage();
          first = false;

          pdf.addImage(imgData, "PNG", margin, margin - yOffset, imgWidth, imgHeight);

          yOffset += pageContentHeight;
          remainingHeight -= pageContentHeight;
        }
      };

      let isFirst = true;

      // ── Page 1: Contract ──
      if (contractRef.current) {
        const canvas = await captureElement(contractRef.current);
        addCanvasToPdf(canvas, isFirst);
        isFirst = false;
      }

      // ── Page 2+: Invoice ──
      if (invoiceRef.current) {
        const canvas = await captureElement(invoiceRef.current);
        addCanvasToPdf(canvas, isFirst);
        isFirst = false;
      }

      // ── Page 3: Receipt ──
      if (receiptRef.current) {
        const canvas = await captureElement(receiptRef.current);
        addCanvasToPdf(canvas, isFirst);
      }

      const filename = invoiceNumber
        ? `Package-${invoiceNumber}.pdf`
        : `Package-${buyerName.replace(/\s+/g, "-")}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("[DownloadPackageButton] PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }, [generating, invoiceData, invoiceNumber, buyerName, receiptNumber, contractData]);

  return (
    <>
      <button
        type="button"
        onClick={handleDownload}
        disabled={generating}
        className="group flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3.5 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-sm w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
          {generating ? (
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          )}
        </div>
        <div className="min-w-0 text-left">
          <p className="text-sm font-semibold text-gray-900">
            {generating ? "Generating PDF..." : "Download Package"}
          </p>
          <p className="text-xs text-gray-500">
            Receipt, invoice & contract
          </p>
        </div>
        {!generating && (
          <svg
            className="ml-auto h-4 w-4 shrink-0 text-gray-300 group-hover:text-emerald-400 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        )}
      </button>

      {/* Hidden elements for PDF capture */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "800px",
          background: "#fff",
        }}
      >
        {/* Full Purchase Agreement */}
        <div ref={contractRef}>
          <FullContractPdf
            companyName={companyName}
            logoUrl={d.logoUrl}
            logoScale={d.logoScale}
            buyer={{
              name: d.buyerName,
              email: d.buyerEmail,
              phone: d.buyerPhone,
              address: d.buyerAddress,
            }}
            order={{
              orderRef: d.invoiceNumber,
              date: d.date,
              total: d.grandTotal,
            }}
            fulfillmentType={d.fulfillmentType}
            shippingAddress={d.shippingAddress}
            signedBy={contractData.signedBy}
            signedAt={contractData.signedAt}
            signatureDataUrl={contractData.signatureDataUrl}
            initialsDataUrl={contractData.initialsDataUrl}
          />
        </div>

        {/* Receipt page */}
        <div ref={receiptRef} style={{ padding: "60px 40px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
          {/* Receipt Header */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            {d.logoUrl && (
              <img
                src={d.logoUrl}
                alt={companyName}
                style={{
                  width: `${48 * (d.logoScale / 100)}px`,
                  height: `${48 * (d.logoScale / 100)}px`,
                  objectFit: "contain",
                  margin: "0 auto 12px",
                  display: "block",
                  borderRadius: "8px",
                }}
              />
            )}
            <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, letterSpacing: "0.05em" }}>
              {companyName}
            </h1>
            <div style={{ margin: "16px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
              <div style={{ height: "1px", flex: 1, background: "#d1d5db" }} />
              <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "0.1em", color: "#059669" }}>PAYMENT RECEIPT</span>
              <div style={{ height: "1px", flex: 1, background: "#d1d5db" }} />
            </div>
          </div>

          {/* Receipt details */}
          <div style={{ maxWidth: "500px", margin: "0 auto" }}>
            {shortReceipt && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6", fontSize: "14px" }}>
                <span style={{ color: "#6b7280" }}>Receipt #</span>
                <span style={{ fontWeight: 700, fontFamily: "monospace", color: "#111827" }}>{shortReceipt}</span>
              </div>
            )}
            {invoiceNumber && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6", fontSize: "14px" }}>
                <span style={{ color: "#6b7280" }}>Invoice #</span>
                <span style={{ fontWeight: 700, color: "#111827" }}>{invoiceNumber}</span>
              </div>
            )}
            {paymentDate && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6", fontSize: "14px" }}>
                <span style={{ color: "#6b7280" }}>Date</span>
                <span style={{ fontWeight: 700, color: "#111827" }}>{paymentDate}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6", fontSize: "14px" }}>
              <span style={{ color: "#6b7280" }}>Paid By</span>
              <span style={{ fontWeight: 700, color: "#111827" }}>{buyerName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6", fontSize: "14px" }}>
              <span style={{ color: "#6b7280" }}>Paid To</span>
              <span style={{ fontWeight: 700, color: "#111827" }}>{companyName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6", fontSize: "14px" }}>
              <span style={{ color: "#6b7280" }}>Amount Paid</span>
              <span style={{ fontWeight: 700, color: "#059669" }}>{paymentAmount}</span>
            </div>

            {/* Grand Total */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", fontSize: "18px", borderTop: "2px solid #111827", marginTop: "12px" }}>
              <span style={{ fontWeight: 700, color: "#111827" }}>Total</span>
              <span style={{ fontWeight: 900, color: "#111827" }}>{grandTotal}</span>
            </div>

            {/* Status */}
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 20px",
                borderRadius: "9999px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#15803d",
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase" as const,
                letterSpacing: "0.1em",
              }}>
                ✓ Payment Confirmed
              </span>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: "40px", paddingTop: "20px", borderTop: "1px dashed #e5e7eb" }}>
            <p style={{ fontSize: "12px", color: "#9ca3af" }}>Thank you for your business</p>
          </div>
        </div>

        {/* Invoice page */}
        <div ref={invoiceRef} style={{ padding: "40px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
          {/* Invoice Header */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            {d.logoUrl && (
              <img
                src={d.logoUrl}
                alt={d.companyName}
                style={{
                  width: `${48 * (d.logoScale / 100)}px`,
                  height: `${48 * (d.logoScale / 100)}px`,
                  objectFit: "contain",
                  margin: "0 auto 12px",
                  display: "block",
                  borderRadius: "8px",
                }}
              />
            )}
            <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, letterSpacing: "0.05em" }}>
              {d.companyName}
            </h1>
            <div style={{ margin: "16px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
              <div style={{ height: "1px", flex: 1, background: "#d1d5db" }} />
              <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "0.1em" }}>INVOICE</span>
              <div style={{ height: "1px", flex: 1, background: "#d1d5db" }} />
            </div>
          </div>

          {/* Buyer & Order Info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px", fontSize: "13px" }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: "11px", color: "#111" }}>Buyer: </span>
              <span style={{ color: "#374151" }}>{d.buyerName}</span>
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: "11px", color: "#111" }}>Invoice #: </span>
              <span style={{ color: "#374151" }}>{d.invoiceNumber ?? "—"}</span>
            </div>
            {d.buyerEmail && (
              <div>
                <span style={{ fontWeight: 700, fontSize: "11px", color: "#111" }}>Email: </span>
                <span style={{ color: "#374151" }}>{d.buyerEmail}</span>
              </div>
            )}
            <div>
              <span style={{ fontWeight: 700, fontSize: "11px", color: "#111" }}>Date: </span>
              <span style={{ color: "#374151" }}>{d.date}</span>
            </div>
            {d.buyerPhone && (
              <div>
                <span style={{ fontWeight: 700, fontSize: "11px", color: "#111" }}>Phone: </span>
                <span style={{ color: "#374151" }}>{d.buyerPhone}</span>
              </div>
            )}
            <div>
              <span style={{ fontWeight: 700, fontSize: "11px", color: "#111" }}>Fulfillment: </span>
              <span style={{ color: "#374151" }}>{FULFILLMENT_LABELS[d.fulfillmentType]}</span>
            </div>
            {d.buyerAddress && (
              <div>
                <span style={{ fontWeight: 700, fontSize: "11px", color: "#111" }}>Address: </span>
                <span style={{ color: "#374151" }}>{d.buyerAddress}</span>
              </div>
            )}
            {showShippingAddress && (
              <div>
                <span style={{ fontWeight: 700, fontSize: "11px", color: "#111" }}>
                  {FULFILLMENT_LABELS[d.fulfillmentType]} Address:{" "}
                </span>
                <span style={{ color: "#374151" }}>{d.shippingAddress}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", marginBottom: "24px" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>#</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>Description</th>
                <th style={{ textAlign: "center", padding: "10px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>Price</th>
                <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {d.items.map((item, idx) => {
                const price = Number(item.price_sold_for ?? item.retail_price);
                const qty = item.quantity ?? 1;
                const total = price * qty;
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={{ padding: "10px 12px", color: "#9ca3af" }}>{idx + 1}</td>
                    <td style={{ padding: "10px 12px", color: "#111827", fontWeight: 500 }}>
                      {item.description}
                      {item.category === "service" && (
                        <span style={{ marginLeft: "6px", fontSize: "10px", color: "#8b5cf6", fontWeight: 600 }}>SERVICE</span>
                      )}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: "#374151" }}>{qty}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#374151" }}>{formatCurrency(price)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#111827", fontWeight: 600 }}>{formatCurrency(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ marginLeft: "auto", maxWidth: "280px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#6b7280" }}>
              <span>Items Subtotal</span>
              <span style={{ fontWeight: 600, color: "#111827" }}>{formatCurrency(d.itemsTotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#6b7280" }}>
              <span>Services & Shipping</span>
              <span style={{ fontWeight: 600, color: "#111827" }}>{formatCurrency(d.deliveryTotal)}</span>
            </div>
            {d.discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#059669" }}>
                <span>Discount</span>
                <span style={{ fontWeight: 600 }}>-{formatCurrency(d.discountAmount)}</span>
              </div>
            )}
            {d.taxAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#6b7280" }}>
                <span>Tax</span>
                <span style={{ fontWeight: 600, color: "#111827" }}>{formatCurrency(d.taxAmount)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: "16px", borderTop: "2px solid #111827", marginTop: "8px" }}>
              <span style={{ fontWeight: 700, color: "#111827" }}>Grand Total</span>
              <span style={{ fontWeight: 900, color: "#111827" }}>{formatCurrency(d.grandTotal)}</span>
            </div>
          </div>

          {/* Paid stamp */}
          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <span style={{
              display: "inline-block",
              padding: "8px 32px",
              border: "3px solid #059669",
              borderRadius: "8px",
              color: "#059669",
              fontSize: "20px",
              fontWeight: 900,
              letterSpacing: "0.15em",
              transform: "rotate(-3deg)",
            }}>
              PAID
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────── */

export function CustomerPaidView({
  token,
  buyerName,
  companyName,
  invoiceNumber,
  receiptNumber,
  paymentDate,
  paymentAmount,
  grandTotal,
  invoiceData,
  contractData,
}: CustomerPaidViewProps) {
  const [receiptOpen, setReceiptOpen] = useState(false);

  const shortReceipt = receiptNumber
    ? receiptNumber.replace("pi_", "").slice(0, 12).toUpperCase()
    : null;

  return (
    <div className="space-y-6">
      {/* ── Payment Receipt ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.746 3.746 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
              />
            </svg>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Payment Receipt
            </h3>
          </div>
        </div>

        <div className="p-5 space-y-0 divide-y divide-gray-100">
          {/* Receipt Number */}
          {shortReceipt && (
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-gray-500">Receipt #</span>
              <span className="text-sm font-mono font-semibold text-gray-900">
                {shortReceipt}
              </span>
            </div>
          )}

          {/* Paid To */}
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-gray-500">Paid To</span>
            <span className="text-sm font-semibold text-gray-900">
              {companyName}
            </span>
          </div>

          {/* Invoice Number */}
          {invoiceNumber && (
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-gray-500">Invoice #</span>
              <span className="text-sm font-semibold tabular-nums text-gray-900">
                {invoiceNumber}
              </span>
            </div>
          )}

          {/* Payment Date */}
          {paymentDate && (
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-gray-500">Payment Date</span>
              <span className="text-sm font-semibold text-gray-900">
                {paymentDate}
              </span>
            </div>
          )}

          {/* Amount Paid */}
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm text-gray-500">Amount Paid</span>
            <span className="text-sm font-bold tabular-nums text-green-600">
              {paymentAmount}
            </span>
          </div>

          {/* Invoice Total */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-base font-bold text-gray-900">
              Invoice Total
            </span>
            <span className="text-xl font-black tabular-nums text-gray-900">
              {grandTotal}
            </span>
          </div>
        </div>
      </div>

      {/* ── Document Actions ── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Your Documents
            </h3>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            Access your receipt, signed contract, and invoice anytime.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* View Invoice */}
            <Link
              href={`/share/${token}`}
              className="group flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3.5 transition-all hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">View Invoice</p>
                <p className="text-xs text-gray-500">Full order details & items</p>
              </div>
              <svg className="ml-auto h-4 w-4 shrink-0 text-gray-300 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>

            {/* View Contract */}
            <Link
              href={`/share/${token}/contract`}
              className="group flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3.5 transition-all hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 group-hover:bg-violet-100 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">View Contract</p>
                <p className="text-xs text-gray-500">Signed agreement & PDF download</p>
              </div>
              <svg className="ml-auto h-4 w-4 shrink-0 text-gray-300 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>

            {/* View Receipt (popup) */}
            <button
              type="button"
              onClick={() => setReceiptOpen(true)}
              className="group flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3.5 transition-all hover:border-green-300 hover:bg-green-50/50 hover:shadow-sm text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 group-hover:bg-green-100 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.746 3.746 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">View Receipt</p>
                <p className="text-xs text-gray-500">Payment confirmation details</p>
              </div>
              <svg className="ml-auto h-4 w-4 shrink-0 text-gray-300 group-hover:text-green-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            {/* Download Package */}
            <DownloadPackageButton
              invoiceData={invoiceData}
              companyName={companyName}
              buyerName={buyerName}
              invoiceNumber={invoiceNumber}
              receiptNumber={receiptNumber}
              paymentDate={paymentDate}
              paymentAmount={paymentAmount}
              grandTotal={grandTotal}
              contractData={contractData}
            />
          </div>
        </div>
      </div>

      {/* ── Support Note ── */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/50 px-5 py-4 text-center">
        <p className="text-xs text-gray-400 leading-relaxed">
          Questions about your order? Use the{" "}
          <Link
            href={`/share/${token}/contact`}
            className="font-medium text-primary hover:underline"
          >
            contact form
          </Link>{" "}
          to get in touch.
        </p>
      </div>

      {/* Receipt Popup Modal */}
      <ReceiptPopup
        open={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        companyName={companyName}
        buyerName={buyerName}
        invoiceNumber={invoiceNumber}
        receiptNumber={receiptNumber}
        paymentDate={paymentDate}
        paymentAmount={paymentAmount}
        grandTotal={grandTotal}
        invoiceData={invoiceData}
      />
    </div>
  );
}
