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

interface StripeData {
  paymentIntentId: string | null;
  sessionId: string | null;
  customerEmail: string | null;
  currency: string;
  status: string;
  createdAt: string;
}

interface DownloadPackageButtonProps {
  invoiceData: InvoiceData;
  receiptNumber: string | null;
  paymentDate: string | null;
  paymentAmount: string;
  grandTotal: string;
  contractData: ContractData;
  stripeData: StripeData;
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
   Shared PDF row helper
   ──────────────────────────────────────────────── */

function PdfRow({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6", fontSize: "14px" }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 600, color: color ?? "#111827" }}>{value}</span>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────── */

export function AdminDownloadPackageButton({
  invoiceData,
  receiptNumber,
  paymentDate,
  paymentAmount,
  grandTotal,
  contractData,
  stripeData,
}: DownloadPackageButtonProps) {
  const [generating, setGenerating] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<HTMLDivElement>(null);

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

      // Page 1: Contract
      if (contractRef.current) {
        const canvas = await captureElement(contractRef.current);
        addCanvasToPdf(canvas, isFirst);
        isFirst = false;
      }

      // Page 2+: Invoice
      if (invoiceRef.current) {
        const canvas = await captureElement(invoiceRef.current);
        addCanvasToPdf(canvas, isFirst);
        isFirst = false;
      }

      // Page 3: Receipt
      if (receiptRef.current) {
        const canvas = await captureElement(receiptRef.current);
        addCanvasToPdf(canvas, isFirst);
        isFirst = false;
      }

      // Page 4: Stripe Info
      if (stripeRef.current) {
        const canvas = await captureElement(stripeRef.current);
        addCanvasToPdf(canvas, isFirst);
      }

      const filename = d.invoiceNumber
        ? `Package-${d.invoiceNumber}.pdf`
        : `Package-${d.buyerName.replace(/\s+/g, "-")}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("[AdminDownloadPackageButton] PDF generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }, [generating, invoiceData, receiptNumber, contractData, stripeData]);

  const contractSignedDate = contractData.signedAt
    ? new Date(contractData.signedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;
  const contractSignedTime = contractData.signedAt
    ? new Date(contractData.signedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <>
      <button
        type="button"
        onClick={handleDownload}
        disabled={generating}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {generating ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download Package
          </>
        )}
      </button>

      {/* Hidden elements for PDF capture */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "800px", background: "#fff" }}>

        {/* ─── Page 1: Contract Summary ─── */}
        <div ref={contractRef} style={{ padding: "60px 40px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            {d.logoUrl && (
              <img src={d.logoUrl} alt={d.companyName} style={{ width: `${48 * (d.logoScale / 100)}px`, height: `${48 * (d.logoScale / 100)}px`, objectFit: "contain", margin: "0 auto 12px", display: "block", borderRadius: "8px" }} />
            )}
            <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, letterSpacing: "0.05em" }}>{d.companyName}</h1>
            <div style={{ margin: "16px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
              <div style={{ height: "1px", flex: 1, background: "#d1d5db" }} />
              <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "0.1em", color: "#7c3aed" }}>PURCHASE AGREEMENT</span>
              <div style={{ height: "1px", flex: 1, background: "#d1d5db" }} />
            </div>
          </div>

          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <PdfRow label="Buyer" value={d.buyerName} bold />
            {d.buyerEmail && <PdfRow label="Email" value={d.buyerEmail} />}
            {d.buyerPhone && <PdfRow label="Phone" value={d.buyerPhone} />}
            {d.buyerAddress && <PdfRow label="Address" value={d.buyerAddress} />}
            {d.invoiceNumber && <PdfRow label="Order Reference" value={d.invoiceNumber} bold />}
            <PdfRow label="Date" value={d.date} />
            <PdfRow label="Fulfillment" value={FULFILLMENT_LABELS[d.fulfillmentType]} />
            {showShippingAddress && <PdfRow label={`${FULFILLMENT_LABELS[d.fulfillmentType]} Address`} value={d.shippingAddress!} />}
            <PdfRow label="Order Total" value={formatCurrency(d.grandTotal)} bold />

            {/* Contract status */}
            <div style={{ marginTop: "32px", padding: "20px", border: "2px solid #7c3aed", borderRadius: "12px", background: "#f5f3ff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#7c3aed" }}>
                  {contractData.signedAt ? "✓ Contract Signed" : "Contract Pending"}
                </span>
              </div>
              {contractData.signedBy && <PdfRow label="Signed By" value={contractData.signedBy} bold />}
              {contractSignedDate && <PdfRow label="Date Signed" value={contractSignedDate} />}
              {contractSignedTime && <PdfRow label="Time" value={contractSignedTime} />}

              {/* Signature */}
              {contractData.signatureDataUrl && (
                <div style={{ marginTop: "16px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "8px" }}>SIGNATURE</p>
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px", display: "inline-block" }}>
                    <img src={contractData.signatureDataUrl} alt="Signature" style={{ height: "60px", objectFit: "contain" }} />
                  </div>
                </div>
              )}

              {/* Initials */}
              {contractData.initialsDataUrl && (
                <div style={{ marginTop: "12px" }}>
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", marginBottom: "8px" }}>INITIALS</p>
                  <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px", display: "inline-block" }}>
                    <img src={contractData.initialsDataUrl} alt="Initials" style={{ height: "40px", objectFit: "contain" }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Page 2: Invoice ─── */}
        <div ref={invoiceRef} style={{ padding: "40px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            {d.logoUrl && (
              <img src={d.logoUrl} alt={d.companyName} style={{ width: `${48 * (d.logoScale / 100)}px`, height: `${48 * (d.logoScale / 100)}px`, objectFit: "contain", margin: "0 auto 12px", display: "block", borderRadius: "8px" }} />
            )}
            <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, letterSpacing: "0.05em" }}>{d.companyName}</h1>
            <div style={{ margin: "16px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
              <div style={{ height: "1px", flex: 1, background: "#d1d5db" }} />
              <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "0.1em" }}>INVOICE</span>
              <div style={{ height: "1px", flex: 1, background: "#d1d5db" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px", fontSize: "13px" }}>
            <div><span style={{ fontWeight: 700, fontSize: "11px", color: "#111" }}>Buyer: </span><span style={{ color: "#374151" }}>{d.buyerName}</span></div>
            <div><span style={{ fontWeight: 700, fontSize: "11px", color: "#111" }}>Invoice #: </span><span style={{ color: "#374151" }}>{d.invoiceNumber ?? "—"}</span></div>
            {d.buyerEmail && <div><span style={{ fontWeight: 700, fontSize: "11px", color: "#111" }}>Email: </span><span style={{ color: "#374151" }}>{d.buyerEmail}</span></div>}
            <div><span style={{ fontWeight: 700, fontSize: "11px", color: "#111" }}>Date: </span><span style={{ color: "#374151" }}>{d.date}</span></div>
            {d.buyerPhone && <div><span style={{ fontWeight: 700, fontSize: "11px", color: "#111" }}>Phone: </span><span style={{ color: "#374151" }}>{d.buyerPhone}</span></div>}
            <div><span style={{ fontWeight: 700, fontSize: "11px", color: "#111" }}>Fulfillment: </span><span style={{ color: "#374151" }}>{FULFILLMENT_LABELS[d.fulfillmentType]}</span></div>
            {d.buyerAddress && <div><span style={{ fontWeight: 700, fontSize: "11px", color: "#111" }}>Address: </span><span style={{ color: "#374151" }}>{d.buyerAddress}</span></div>}
            {showShippingAddress && <div><span style={{ fontWeight: 700, fontSize: "11px", color: "#111" }}>{FULFILLMENT_LABELS[d.fulfillmentType]} Address: </span><span style={{ color: "#374151" }}>{d.shippingAddress}</span></div>}
          </div>

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
                      {item.category === "service" && <span style={{ marginLeft: "6px", fontSize: "10px", color: "#8b5cf6", fontWeight: 600 }}>SERVICE</span>}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center", color: "#374151" }}>{qty}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#374151" }}>{formatCurrency(price)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: "#111827", fontWeight: 600 }}>{formatCurrency(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginLeft: "auto", maxWidth: "280px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#6b7280" }}><span>Items Subtotal</span><span style={{ fontWeight: 600, color: "#111827" }}>{formatCurrency(d.itemsTotal)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#6b7280" }}><span>Services & Shipping</span><span style={{ fontWeight: 600, color: "#111827" }}>{formatCurrency(d.deliveryTotal)}</span></div>
            {d.discountAmount > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#059669" }}><span>Discount</span><span style={{ fontWeight: 600 }}>-{formatCurrency(d.discountAmount)}</span></div>}
            {d.taxAmount > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "13px", color: "#6b7280" }}><span>Tax</span><span style={{ fontWeight: 600, color: "#111827" }}>{formatCurrency(d.taxAmount)}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: "16px", borderTop: "2px solid #111827", marginTop: "8px" }}><span style={{ fontWeight: 700, color: "#111827" }}>Grand Total</span><span style={{ fontWeight: 900, color: "#111827" }}>{formatCurrency(d.grandTotal)}</span></div>
          </div>

          <div style={{ textAlign: "center", marginTop: "32px" }}>
            <span style={{ display: "inline-block", padding: "8px 32px", border: "3px solid #059669", borderRadius: "8px", color: "#059669", fontSize: "20px", fontWeight: 900, letterSpacing: "0.15em", transform: "rotate(-3deg)" }}>PAID</span>
          </div>
        </div>

        {/* ─── Page 3: Receipt ─── */}
        <div ref={receiptRef} style={{ padding: "60px 40px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            {d.logoUrl && (
              <img src={d.logoUrl} alt={d.companyName} style={{ width: `${48 * (d.logoScale / 100)}px`, height: `${48 * (d.logoScale / 100)}px`, objectFit: "contain", margin: "0 auto 12px", display: "block", borderRadius: "8px" }} />
            )}
            <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, letterSpacing: "0.05em" }}>{d.companyName}</h1>
            <div style={{ margin: "16px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
              <div style={{ height: "1px", flex: 1, background: "#d1d5db" }} />
              <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "0.1em", color: "#059669" }}>PAYMENT RECEIPT</span>
              <div style={{ height: "1px", flex: 1, background: "#d1d5db" }} />
            </div>
          </div>

          <div style={{ maxWidth: "500px", margin: "0 auto" }}>
            {shortReceipt && <PdfRow label="Receipt #" value={shortReceipt} bold />}
            {d.invoiceNumber && <PdfRow label="Invoice #" value={d.invoiceNumber} bold />}
            {paymentDate && <PdfRow label="Date" value={paymentDate} bold />}
            <PdfRow label="Paid By" value={d.buyerName} bold />
            <PdfRow label="Paid To" value={d.companyName} bold />
            <PdfRow label="Amount Paid" value={paymentAmount} bold color="#059669" />
            <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", fontSize: "18px", borderTop: "2px solid #111827", marginTop: "12px" }}>
              <span style={{ fontWeight: 700, color: "#111827" }}>Total</span>
              <span style={{ fontWeight: 900, color: "#111827" }}>{grandTotal}</span>
            </div>
            <div style={{ textAlign: "center", marginTop: "24px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 20px", borderRadius: "9999px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em" }}>✓ Payment Confirmed</span>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: "40px", paddingTop: "20px", borderTop: "1px dashed #e5e7eb" }}>
            <p style={{ fontSize: "12px", color: "#9ca3af" }}>Thank you for your business</p>
          </div>
        </div>

        {/* ─── Page 4: Stripe Information (Admin Only) ─── */}
        <div ref={stripeRef} style={{ padding: "60px 40px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 style={{ fontSize: "24px", fontWeight: 900, margin: 0, letterSpacing: "0.05em" }}>{d.companyName}</h1>
            <div style={{ margin: "16px 0", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
              <div style={{ height: "1px", flex: 1, background: "#d1d5db" }} />
              <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "0.1em", color: "#6366f1" }}>STRIPE PAYMENT DETAILS</span>
              <div style={{ height: "1px", flex: 1, background: "#d1d5db" }} />
            </div>
            <p style={{ fontSize: "11px", color: "#9ca3af", marginTop: "8px" }}>Internal use only — not shared with customer</p>
          </div>

          <div style={{ maxWidth: "600px", margin: "0 auto" }}>
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Payment Information</p>
              <PdfRow label="Status" value={stripeData.status.toUpperCase()} bold color={stripeData.status === "succeeded" ? "#059669" : "#d97706"} />
              <PdfRow label="Amount" value={paymentAmount} bold />
              <PdfRow label="Currency" value={stripeData.currency.toUpperCase()} />
              {paymentDate && <PdfRow label="Payment Date" value={paymentDate} />}
              {stripeData.customerEmail && <PdfRow label="Customer Email" value={stripeData.customerEmail} />}
            </div>

            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Stripe Identifiers</p>
              {stripeData.paymentIntentId && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6", fontSize: "13px" }}>
                  <span style={{ color: "#6b7280" }}>Payment Intent ID</span>
                  <span style={{ fontWeight: 600, fontFamily: "monospace", fontSize: "11px", color: "#111827" }}>{stripeData.paymentIntentId}</span>
                </div>
              )}
              {stripeData.sessionId && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6", fontSize: "13px" }}>
                  <span style={{ color: "#6b7280" }}>Checkout Session ID</span>
                  <span style={{ fontWeight: 600, fontFamily: "monospace", fontSize: "11px", color: "#111827" }}>{stripeData.sessionId}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f3f4f6", fontSize: "13px" }}>
                <span style={{ color: "#6b7280" }}>Transaction Timestamp</span>
                <span style={{ fontWeight: 600, fontSize: "12px", color: "#111827" }}>{new Date(stripeData.createdAt).toLocaleString("en-US")}</span>
              </div>
            </div>

            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Order Reference</p>
              {d.invoiceNumber && <PdfRow label="Invoice #" value={d.invoiceNumber} bold />}
              <PdfRow label="Customer" value={d.buyerName} />
              {d.buyerEmail && <PdfRow label="Email" value={d.buyerEmail} />}
              <PdfRow label="Grand Total" value={grandTotal} bold />
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "40px", paddingTop: "20px", borderTop: "1px dashed #e5e7eb" }}>
            <p style={{ fontSize: "11px", color: "#9ca3af" }}>Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} — Confidential</p>
          </div>
        </div>
      </div>
    </>
  );
}
