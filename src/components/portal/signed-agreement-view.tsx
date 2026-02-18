"use client";

import Link from "next/link";
import {
  CONTRACT_HEADER,
  CONTRACT_SECTIONS,
  BUYER_ACKNOWLEDGMENTS,
  CONTRACT_FOOTER,
} from "@/lib/constants/contract-content";
import type { ContractSection } from "@/lib/constants/contract-content";
import { formatCurrency } from "@/lib/invoice-calculations";

/* ────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────── */

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

interface SignedAgreementViewProps {
  buyer: BuyerInfo;
  order: OrderInfo;
  companyName: string;
  signedBy: string;
  signedAt: string;
  signatureDataUrl: string | null;
  initialsDataUrl: string | null;
  /** Share token for CTA links (null in admin view) */
  shareToken?: string | null;
  /** Whether the contract has been signed (for payment CTA) */
  contractSignedAt?: string | null;
}

/* ────────────────────────────────────────────────
   Bold-text helper
   ──────────────────────────────────────────────── */

function RichText({ text, bold }: { text: string; bold?: string }) {
  if (!bold) return <>{text}</>;
  const idx = text.indexOf(bold);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-semibold">{bold}</strong>
      {text.slice(idx + bold.length)}
    </>
  );
}

function SectionBlock({ section }: { section: ContractSection }) {
  return (
    <div className="mt-6 first:mt-0">
      <h3 className="text-sm font-bold text-gray-900">
        {section.number}. {section.title}
      </h3>
      <div className="mt-2 space-y-2">
        {section.clauses.map((clause) => (
          <div key={clause.id}>
            <p className="text-[13px] leading-relaxed text-gray-700">
              <span className="font-semibold text-gray-800">{clause.id}</span>{" "}
              <RichText text={clause.text} bold={clause.bold} />
            </p>
            {clause.subItems && (
              <div className="mt-1.5 ml-6 space-y-1">
                {clause.subItems.map((sub) => (
                  <p
                    key={sub.id}
                    className="text-[13px] leading-relaxed text-gray-700"
                  >
                    <span className="font-medium text-gray-600">
                      {sub.id})
                    </span>{" "}
                    <RichText text={sub.text} bold={sub.bold} />
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────────── */

export function SignedAgreementView({
  buyer,
  order,
  companyName,
  signedBy,
  signedAt,
  signatureDataUrl,
  initialsDataUrl,
  shareToken = null,
  contractSignedAt = null,
}: SignedAgreementViewProps) {
  const formattedDate = new Date(signedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTimestamp = new Date(signedAt).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="space-y-6">
      {/* Success banner */}
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-5 w-5 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4.5 12.75 6 6 9-13.5"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-green-800">
            Contract Signed
          </h3>
          <p className="text-xs text-green-600">
            Signed by{" "}
            <span className="font-medium">{signedBy}</span> on{" "}
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Next Steps CTA (customer portal only) */}
      {shareToken && (
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {contractSignedAt ? (
            <Link
              href={`/share/${shareToken}/payments`}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                />
              </svg>
              Submit a Payment
            </Link>
          ) : null}
        </div>
      )}

      {/* ─── Contract Document (read-only) ─── */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gray-50/80 px-5 py-6 sm:px-8 text-center">
          <h2 className="text-xl font-black tracking-wide text-gray-900 sm:text-2xl">
            {CONTRACT_HEADER.company}
          </h2>
          <p className="mt-0.5 text-[11px] italic text-gray-500">
            {CONTRACT_HEADER.division}
          </p>
          <div className="my-4 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-gray-300" />
            <h1 className="text-lg font-bold tracking-wider text-gray-900 sm:text-xl whitespace-nowrap">
              {CONTRACT_HEADER.title}
            </h1>
            <div className="h-px flex-1 bg-gray-300" />
          </div>
        </div>

        {/* Buyer info */}
        <div className="border-b border-gray-200 px-5 py-4 sm:px-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-gray-900 shrink-0">Buyer:</span>
              <span className="text-sm text-gray-700 truncate">{buyer.name}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-gray-900 shrink-0">Order Ref:</span>
              <span className="text-sm text-gray-700 truncate">
                {order.orderRef ?? "—"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-gray-900 shrink-0">Email:</span>
              <span className="text-sm text-gray-700 truncate">
                {buyer.email ?? "—"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-gray-900 shrink-0">Date:</span>
              <span className="text-sm text-gray-700">{order.date}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-gray-900 shrink-0">Phone:</span>
              <span className="text-sm text-gray-700">
                {buyer.phone ?? "—"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-gray-900 shrink-0">Total:</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(order.total)}
              </span>
            </div>
            <div className="flex items-baseline gap-2 sm:col-span-2">
              <span className="text-xs font-bold text-gray-900 shrink-0">Address:</span>
              <span className="text-sm text-gray-700">
                {buyer.address ?? "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Banner */}
        <div className="border-b border-gray-200 bg-gray-900 px-5 py-4 sm:px-8 text-center">
          <p className="text-base font-black text-white tracking-wide">
            ■ {CONTRACT_HEADER.allSalesFinal} ■
          </p>
          <p className="mt-1 text-xs font-semibold text-gray-300 tracking-wider">
            {CONTRACT_HEADER.allSalesSubtext}
          </p>
        </div>

        {/* Preamble */}
        <div className="px-5 pt-5 sm:px-8">
          <p className="text-[13px] leading-relaxed text-gray-700">
            {CONTRACT_HEADER.preamble}
          </p>
        </div>

        {/* Sections */}
        <div className="px-5 pb-6 sm:px-8">
          {CONTRACT_SECTIONS.map((section) => (
            <SectionBlock key={section.number} section={section} />
          ))}
        </div>

        {/* Acknowledgment box */}
        <div className="mx-5 mb-6 sm:mx-8 rounded-lg border border-gray-300 bg-gray-50 px-5 py-4 text-center">
          <p className="text-sm font-bold text-gray-900 mb-2">
            BY SIGNING BELOW, BUYER ACKNOWLEDGES:
          </p>
          {BUYER_ACKNOWLEDGMENTS.map((ack) => (
            <p key={ack} className="text-xs font-medium text-gray-700">
              {ack}
            </p>
          ))}
        </div>

        {/* ─── Initials ─── */}
        {initialsDataUrl && (
          <div className="border-t border-gray-200 px-5 py-4 sm:px-8 flex items-center gap-3">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={initialsDataUrl}
                alt="Buyer initials"
                className="h-12 w-12 object-contain"
              />
            </div>
            <span className="text-xs text-gray-500">Buyer Initials</span>
          </div>
        )}

        {/* ─── BUYER SIGNATURE ─── */}
        <div className="border-t border-gray-200 px-5 py-5 sm:px-8">
          <h3 className="text-sm font-bold text-gray-900 mb-4">
            BUYER SIGNATURE
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-medium text-gray-500 mb-1">
                Buyer Name
              </p>
              <p className="text-sm font-medium text-gray-900">{signedBy}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium text-gray-500 mb-1">Date</p>
              <p className="text-sm text-gray-700">{formattedDate}</p>
            </div>
          </div>

          {signatureDataUrl && (
            <div className="mt-4">
              <p className="text-[10px] font-medium text-gray-500 mb-1.5">
                Buyer Signature
              </p>
              <div className="rounded-lg border border-gray-200 bg-white p-3 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signatureDataUrl}
                  alt="Buyer signature"
                  className="h-16 object-contain"
                />
              </div>
            </div>
          )}

          <p className="mt-3 text-[10px] text-gray-400">
            IP / Timestamp: Signed on {formattedTimestamp}
          </p>
        </div>

        {/* SELLER */}
        <div className="border-t border-gray-200 px-5 py-5 sm:px-8 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-900 mb-2">
            SELLER — {companyName}
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <p className="text-[10px] text-gray-500">Authorized Representative</p>
              <p className="text-sm italic text-gray-600">{companyName}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Date</p>
              <p className="text-sm text-gray-600">{formattedDate}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3 sm:px-8 text-center">
          <p className="text-[10px] text-gray-400">{CONTRACT_FOOTER}</p>
        </div>
      </div>
    </div>
  );
}
