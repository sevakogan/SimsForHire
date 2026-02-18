"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SignaturePad } from "./signature-pad";
import { InitialsInput } from "./initials-input";
import {
  CONTRACT_HEADER,
  CONTRACT_SECTIONS,
  BUYER_ACKNOWLEDGMENTS,
  CONTRACT_FOOTER,
} from "@/lib/constants/contract-content";
import type { ContractSection } from "@/lib/constants/contract-content";
import { signContractFull } from "@/lib/actions/contract";
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

interface PurchaseAgreementProps {
  shareToken: string;
  buyer: BuyerInfo;
  order: OrderInfo;
  companyName: string;
}

/* ────────────────────────────────────────────────
   Bold-text helper — renders text with bold substrings
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

/* ────────────────────────────────────────────────
   Section renderer
   ──────────────────────────────────────────────── */

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

export function PurchaseAgreement({
  shareToken,
  buyer,
  order,
  companyName,
}: PurchaseAgreementProps) {
  const router = useRouter();
  const [initials, setInitials] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [buyerName, setBuyerName] = useState(buyer.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  const handleInitialsChange = useCallback((dataUrl: string | null) => {
    setInitials(dataUrl);
  }, []);

  const handleSignatureChange = useCallback((dataUrl: string | null) => {
    setSignature(dataUrl);
  }, []);

  const canSubmit =
    buyerName.trim().length > 0 && initials !== null && signature !== null && !loading;

  async function handleSign() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const result = await signContractFull(shareToken, {
        buyerName: buyerName.trim(),
        signatureDataUrl: signature!,
        initialsDataUrl: initials!,
      });

      if (result.error) {
        setError(result.error);
      } else {
        setSigned(true);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (signed) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-7 w-7 text-green-600"
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
        <h3 className="text-lg font-bold text-green-800">
          Contract Signed Successfully
        </h3>
        <p className="mt-2 text-sm text-green-600">
          Thank you, {buyerName.trim()}. Your signed agreement has been recorded.
          You may now proceed to payment.
        </p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* ─── Contract Document ─── */}
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

        {/* Buyer info grid */}
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

        {/* ALL SALES ARE FINAL banner */}
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

        {/* Contract sections */}
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

        {/* ─── Initials section ─── */}
        <div className="border-t border-gray-200 px-5 py-5 sm:px-8">
          <p className="text-xs text-gray-500 mb-3">
            Please provide your initials to acknowledge you have read and
            understand all sections above.
          </p>
          <InitialsInput
            onChange={handleInitialsChange}
            label="Buyer Initials"
          />
        </div>

        {/* ─── BUYER SIGNATURE section ─── */}
        <div className="border-t border-gray-200 px-5 py-5 sm:px-8">
          <h3 className="text-sm font-bold text-gray-900 mb-4">
            BUYER SIGNATURE
          </h3>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Buyer name input */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="buyer-name"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Buyer Name
                </label>
                <input
                  id="buyer-name"
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Full legal name"
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date
                </label>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                  {today}
                </div>
              </div>
            </div>

            {/* Signature pad */}
            <SignaturePad
              onChange={handleSignatureChange}
              label="Buyer Signature"
              placeholder="Sign here with mouse, finger, or stylus"
            />

            {/* IP / Timestamp (auto-generated) */}
            <p className="text-[10px] text-gray-400">
              IP / Timestamp will be recorded automatically upon signing.
            </p>
          </div>
        </div>

        {/* ─── SELLER section (pre-filled) ─── */}
        <div className="border-t border-gray-200 px-5 py-5 sm:px-8 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-900 mb-2">
            SELLER — {companyName}
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <p className="text-[10px] text-gray-500">Authorized Representative</p>
              <p className="text-sm italic text-gray-600">
                {companyName}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Date</p>
              <p className="text-sm text-gray-600">{today}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3 sm:px-8 text-center">
          <p className="text-[10px] text-gray-400">{CONTRACT_FOOTER}</p>
        </div>
      </div>

      {/* ─── Submit button ─── */}
      <div className="flex flex-col items-center gap-3">
        {!canSubmit && (
          <p className="text-xs text-gray-400 text-center">
            {!buyerName.trim()
              ? "Enter your full name above"
              : !initials
                ? "Add your initials above"
                : !signature
                  ? "Add your signature above"
                  : ""}
          </p>
        )}

        <button
          type="button"
          onClick={handleSign}
          disabled={!canSubmit}
          className="w-full max-w-md rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Signing Agreement...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
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
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
                />
              </svg>
              Sign Purchase Agreement
            </span>
          )}
        </button>

        <p className="text-[10px] text-gray-400 text-center max-w-sm">
          By clicking &quot;Sign Purchase Agreement&quot; you acknowledge that
          this is a legally binding electronic signature.
        </p>
      </div>
    </div>
  );
}
