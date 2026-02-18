"use client";

import { useState, useRef, useCallback } from "react";
import { formatCurrency } from "@/lib/invoice-calculations";
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

interface DownloadPdfButtonProps {
  /** Ref to the signed contract DOM element to capture */
  contractRef: React.RefObject<HTMLDivElement | null>;
  /** Data for building the invoice page in the PDF */
  invoiceData: {
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
  };
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
   Component
   ──────────────────────────────────────────────── */

export function DownloadPdfButton({ contractRef, invoiceData }: DownloadPdfButtonProps) {
  const [generating, setGenerating] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(async () => {
    if (generating) return;
    setGenerating(true);

    try {
      // Dynamic imports to avoid SSR issues
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pdfWidth - margin * 2;

      // ── Page 1+: Invoice ──
      if (invoiceRef.current) {
        const invoiceCanvas = await html2canvas(invoiceRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
        const invoiceImgData = invoiceCanvas.toDataURL("image/png");
        const imgWidth = contentWidth;
        const imgHeight = (invoiceCanvas.height * imgWidth) / invoiceCanvas.width;

        // If invoice is taller than one page, split across pages
        let remainingHeight = imgHeight;
        let yOffset = 0;

        while (remainingHeight > 0) {
          const pageContentHeight = pdfHeight - margin * 2;
          const sliceHeight = Math.min(remainingHeight, pageContentHeight);

          if (yOffset > 0) pdf.addPage();

          // Use clipping to show only the portion that fits on this page
          pdf.addImage(
            invoiceImgData,
            "PNG",
            margin,
            margin - yOffset,
            imgWidth,
            imgHeight,
          );

          yOffset += pageContentHeight;
          remainingHeight -= pageContentHeight;
        }
      }

      // ── Next pages: Contract ──
      if (contractRef.current) {
        pdf.addPage();
        const contractCanvas = await html2canvas(contractRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
        const contractImgData = contractCanvas.toDataURL("image/png");
        const imgWidth = contentWidth;
        const imgHeight = (contractCanvas.height * imgWidth) / contractCanvas.width;

        let remainingHeight = imgHeight;
        let yOffset = 0;
        let isFirstContractPage = true;

        while (remainingHeight > 0) {
          const pageContentHeight = pdfHeight - margin * 2;
          const sliceHeight = Math.min(remainingHeight, pageContentHeight);

          if (!isFirstContractPage) pdf.addPage();
          isFirstContractPage = false;

          pdf.addImage(
            contractImgData,
            "PNG",
            margin,
            margin - yOffset,
            imgWidth,
            imgHeight,
          );

          yOffset += pageContentHeight;
          remainingHeight -= pageContentHeight;
        }
      }

      // Download
      const filename = invoiceData.invoiceNumber
        ? `Invoice-${invoiceData.invoiceNumber}.pdf`
        : `Invoice-${invoiceData.buyerName.replace(/\s+/g, "-")}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("[DownloadPdfButton] PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }, [generating, contractRef, invoiceData]);

  const d = invoiceData;
  const showShippingAddress =
    d.fulfillmentType !== "pickup" && d.shippingAddress;

  return (
    <>
      {/* Download button */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={generating}
        className={`inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {generating ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating PDF...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download PDF
          </>
        )}
      </button>

      {/* Hidden invoice rendering for PDF capture */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "800px",
          background: "#fff",
        }}
      >
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
        </div>
      </div>
    </>
  );
}
