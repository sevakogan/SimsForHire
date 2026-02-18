"use client";

import {
  CONTRACT_HEADER,
  CONTRACT_SECTIONS,
  BUYER_ACKNOWLEDGMENTS,
  CONTRACT_FOOTER,
} from "@/lib/constants/contract-content";
import type { ContractSection, ContractSubItem } from "@/lib/constants/contract-content";
import { formatCurrency } from "@/lib/invoice-calculations";
import type { FulfillmentType } from "@/types";

/* ────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────── */

export interface FullContractPdfProps {
  companyName: string;
  logoUrl: string | null;
  logoScale: number;
  buyer: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  order: {
    orderRef: string | null;
    date: string;
    total: number;
  };
  fulfillmentType: FulfillmentType;
  shippingAddress: string | null;
  signedBy: string | null;
  signedAt: string | null;
  signatureDataUrl: string | null;
  initialsDataUrl: string | null;
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
   Bold-text helper (inline-style version)
   ──────────────────────────────────────────────── */

function RichText({ text, bold }: { text: string; bold?: string }) {
  if (!bold) return <>{text}</>;
  const idx = text.indexOf(bold);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ fontWeight: 600 }}>{bold}</span>
      {text.slice(idx + bold.length)}
    </>
  );
}

/* ────────────────────────────────────────────────
   Sub-item renderer
   ──────────────────────────────────────────────── */

function SubItemBlock({ sub }: { sub: ContractSubItem }) {
  return (
    <p
      style={{
        fontSize: "12px",
        lineHeight: "1.7",
        color: "#374151",
        margin: "4px 0",
        paddingLeft: "20px",
      }}
    >
      <span style={{ fontWeight: 500, color: "#6b7280" }}>{sub.id})</span>{" "}
      <RichText text={sub.text} bold={sub.bold} />
    </p>
  );
}

/* ────────────────────────────────────────────────
   Section renderer
   ──────────────────────────────────────────────── */

function SectionBlock({
  section,
  initialsDataUrl,
}: {
  section: ContractSection;
  initialsDataUrl: string | null;
}) {
  return (
    <div style={{ marginTop: "20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        {/* Initials stamp */}
        <div style={{ flexShrink: 0, marginTop: "2px" }}>
          {initialsDataUrl ? (
            <div
              style={{
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                border: "1px solid #bbf7d0",
                background: "#f0fdf4",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={initialsDataUrl}
                alt="Initials"
                style={{ width: "20px", height: "20px", objectFit: "contain" }}
              />
            </div>
          ) : (
            <div
              style={{
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
              }}
            >
              <span style={{ fontSize: "8px", color: "#d1d5db" }}>—</span>
            </div>
          )}
        </div>

        {/* Section content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 8px 0",
            }}
          >
            {section.number}. {section.title}
          </h3>
          {section.clauses.map((clause) => (
            <div key={clause.id} style={{ marginBottom: "8px" }}>
              <p
                style={{
                  fontSize: "12px",
                  lineHeight: "1.7",
                  color: "#374151",
                  margin: 0,
                }}
              >
                <span style={{ fontWeight: 600, color: "#1f2937" }}>
                  {clause.id}
                </span>{" "}
                <RichText text={clause.text} bold={clause.bold} />
              </p>
              {clause.subItems?.map((sub) => (
                <SubItemBlock key={sub.id} sub={sub} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Main component — full contract for PDF capture
   ──────────────────────────────────────────────── */

export function FullContractPdf({
  companyName,
  logoUrl,
  logoScale,
  buyer,
  order,
  fulfillmentType,
  shippingAddress,
  signedBy,
  signedAt,
  signatureDataUrl,
  initialsDataUrl,
}: FullContractPdfProps) {
  const logoSize = 48 * (logoScale / 100);
  const showShippingAddress =
    fulfillmentType && fulfillmentType !== "pickup" && shippingAddress;

  const formattedDate = signedAt
    ? new Date(signedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const formattedTimestamp = signedAt
    ? new Date(signedAt).toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : null;

  return (
    <div
      style={{
        padding: "50px 40px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "#ffffff",
      }}
    >
      {/* ─── Header ─── */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        {logoUrl && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt={companyName}
              style={{
                width: `${logoSize}px`,
                height: `${logoSize}px`,
                objectFit: "contain",
                borderRadius: "8px",
              }}
            />
          </div>
        )}
        <h2
          style={{
            fontSize: "22px",
            fontWeight: 900,
            letterSpacing: "0.05em",
            color: "#111827",
            margin: 0,
          }}
        >
          {CONTRACT_HEADER.company}
        </h2>
        <p
          style={{
            marginTop: "2px",
            fontSize: "10px",
            fontStyle: "italic",
            color: "#9ca3af",
          }}
        >
          {CONTRACT_HEADER.division}
        </p>
        <div
          style={{
            margin: "16px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <div style={{ height: "1px", flex: 1, background: "#d1d5db" }} />
          <h1
            style={{
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#111827",
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            {CONTRACT_HEADER.title}
          </h1>
          <div style={{ height: "1px", flex: 1, background: "#d1d5db" }} />
        </div>
      </div>

      {/* ─── Buyer info grid ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "20px",
          fontSize: "12px",
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: "16px",
        }}
      >
        <div>
          <span style={{ fontWeight: 700, fontSize: "10px", color: "#111" }}>Buyer: </span>
          <span style={{ color: "#374151" }}>{buyer.name}</span>
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: "10px", color: "#111" }}>Order Ref: </span>
          <span style={{ color: "#374151" }}>{order.orderRef ?? "—"}</span>
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: "10px", color: "#111" }}>Email: </span>
          <span style={{ color: "#374151" }}>{buyer.email ?? "—"}</span>
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: "10px", color: "#111" }}>Date: </span>
          <span style={{ color: "#374151" }}>{order.date}</span>
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: "10px", color: "#111" }}>Phone: </span>
          <span style={{ color: "#374151" }}>{buyer.phone ?? "—"}</span>
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: "10px", color: "#111" }}>Total: </span>
          <span style={{ fontWeight: 600, color: "#111827" }}>{formatCurrency(order.total)}</span>
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: "10px", color: "#111" }}>Address: </span>
          <span style={{ color: "#374151" }}>{buyer.address ?? "—"}</span>
        </div>
        {showShippingAddress && (
          <div>
            <span style={{ fontWeight: 700, fontSize: "10px", color: "#111" }}>
              {FULFILLMENT_LABELS[fulfillmentType]} Address:{" "}
            </span>
            <span style={{ color: "#374151" }}>{shippingAddress}</span>
          </div>
        )}
      </div>

      {/* ─── ALL SALES FINAL banner ─── */}
      <div
        style={{
          background: "#111827",
          padding: "14px 20px",
          textAlign: "center",
          marginBottom: "20px",
          borderRadius: "6px",
        }}
      >
        <p
          style={{
            fontSize: "14px",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "0.05em",
            margin: 0,
          }}
        >
          ■ {CONTRACT_HEADER.allSalesFinal} ■
        </p>
        <p
          style={{
            marginTop: "4px",
            fontSize: "10px",
            fontWeight: 600,
            color: "#d1d5db",
            letterSpacing: "0.1em",
          }}
        >
          {CONTRACT_HEADER.allSalesSubtext}
        </p>
      </div>

      {/* ─── Preamble ─── */}
      <p
        style={{
          fontSize: "12px",
          lineHeight: "1.7",
          color: "#374151",
          marginBottom: "8px",
        }}
      >
        {CONTRACT_HEADER.preamble}
      </p>

      {/* ─── All 9 sections with initials stamps ─── */}
      {CONTRACT_SECTIONS.map((section) => (
        <SectionBlock
          key={section.number}
          section={section}
          initialsDataUrl={initialsDataUrl}
        />
      ))}

      {/* ─── Acknowledgments box ─── */}
      <div
        style={{
          marginTop: "24px",
          padding: "16px 20px",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          background: "#f9fafb",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#111827",
            marginBottom: "8px",
          }}
        >
          BY SIGNING BELOW, BUYER ACKNOWLEDGES:
        </p>
        {BUYER_ACKNOWLEDGMENTS.map((ack) => (
          <p
            key={ack}
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: "#374151",
              margin: "2px 0",
            }}
          >
            {ack}
          </p>
        ))}
      </div>

      {/* ─── BUYER SIGNATURE ─── */}
      <div
        style={{
          marginTop: "24px",
          paddingTop: "20px",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <h3
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#111827",
            marginBottom: "12px",
          }}
        >
          BUYER SIGNATURE
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          <div>
            <p style={{ fontSize: "10px", fontWeight: 500, color: "#9ca3af", marginBottom: "4px" }}>
              Buyer Name
            </p>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>
              {signedBy ?? "—"}
            </p>
          </div>
          <div>
            <p style={{ fontSize: "10px", fontWeight: 500, color: "#9ca3af", marginBottom: "4px" }}>
              Date
            </p>
            <p style={{ fontSize: "13px", color: "#374151" }}>
              {formattedDate ?? "—"}
            </p>
          </div>
        </div>

        {signatureDataUrl && (
          <div style={{ marginTop: "12px" }}>
            <p style={{ fontSize: "10px", fontWeight: 500, color: "#9ca3af", marginBottom: "6px" }}>
              Buyer Signature
            </p>
            <div
              style={{
                display: "inline-block",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                padding: "10px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={signatureDataUrl}
                alt="Buyer signature"
                style={{ height: "56px", objectFit: "contain" }}
              />
            </div>
          </div>
        )}

        {formattedTimestamp && (
          <p style={{ marginTop: "10px", fontSize: "10px", color: "#9ca3af" }}>
            IP / Timestamp: Signed on {formattedTimestamp}
          </p>
        )}
      </div>

      {/* ─── SELLER ─── */}
      <div
        style={{
          marginTop: "20px",
          paddingTop: "16px",
          borderTop: "1px solid #e5e7eb",
          background: "#fafafa",
          padding: "16px",
          borderRadius: "0 0 8px 8px",
        }}
      >
        <h3
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#111827",
            marginBottom: "8px",
          }}
        >
          SELLER — {companyName}
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          <div>
            <p style={{ fontSize: "10px", color: "#9ca3af" }}>
              Authorized Representative
            </p>
            <p style={{ fontSize: "13px", fontStyle: "italic", color: "#6b7280" }}>
              {companyName}
            </p>
          </div>
          <div>
            <p style={{ fontSize: "10px", color: "#9ca3af" }}>Date</p>
            <p style={{ fontSize: "13px", color: "#6b7280" }}>
              {formattedDate ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Footer ─── */}
      <div
        style={{
          marginTop: "20px",
          paddingTop: "12px",
          borderTop: "1px solid #f3f4f6",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "10px", color: "#9ca3af" }}>{CONTRACT_FOOTER}</p>
      </div>
    </div>
  );
}
