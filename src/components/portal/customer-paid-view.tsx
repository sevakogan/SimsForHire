"use client";

import Link from "next/link";

/* ────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────── */

interface CustomerPaidViewProps {
  token: string;
  buyerName: string;
  companyName: string;
  invoiceNumber: string | null;
  paymentDate: string | null;
  paymentAmount: string;
  grandTotal: string;
}

/* ────────────────────────────────────────────────
   Component
   ──────────────────────────────────────────────── */

export function CustomerPaidView({
  token,
  buyerName,
  companyName,
  invoiceNumber,
  paymentDate,
  paymentAmount,
  grandTotal,
}: CustomerPaidViewProps) {
  return (
    <div className="space-y-6">
      {/* ── Thank You Card ── */}
      <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500" />

        <div className="px-6 py-8 sm:px-8 sm:py-10 text-center">
          {/* Animated checkmark */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 ring-4 ring-green-50">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Thank You, {buyerName}!
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
            Your payment has been received and confirmed. We appreciate your
            business and look forward to serving you.
          </p>
        </div>
      </div>

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

        <div className="p-5 space-y-3">
          {/* Paid To */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Paid To</span>
            <span className="text-sm font-semibold text-gray-900">
              {companyName}
            </span>
          </div>

          {/* Invoice Number */}
          {invoiceNumber && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Invoice #</span>
              <span className="text-sm font-semibold tabular-nums text-gray-900">
                {invoiceNumber}
              </span>
            </div>
          )}

          {/* Payment Date */}
          {paymentDate && (
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">Payment Date</span>
              <span className="text-sm font-semibold text-gray-900">
                {paymentDate}
              </span>
            </div>
          )}

          {/* Amount Paid */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-500">Amount Paid</span>
            <span className="text-sm font-bold tabular-nums text-green-600">
              {paymentAmount}
            </span>
          </div>

          {/* Invoice Total */}
          <div className="flex items-center justify-between pt-2">
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
            Access your signed contract and invoice anytime. You can also
            download the full document as a PDF from the contract page.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* View Contract */}
            <Link
              href={`/share/${token}/contract`}
              className="group flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3.5 transition-all hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 group-hover:bg-violet-100 transition-colors">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  View Contract
                </p>
                <p className="text-xs text-gray-500">
                  Signed agreement & PDF download
                </p>
              </div>
              <svg
                className="ml-auto h-4 w-4 shrink-0 text-gray-300 group-hover:text-violet-400 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </Link>

            {/* View Invoice */}
            <Link
              href={`/share/${token}`}
              className="group flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3.5 transition-all hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
                  />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">
                  View Invoice
                </p>
                <p className="text-xs text-gray-500">
                  Full order details & items
                </p>
              </div>
              <svg
                className="ml-auto h-4 w-4 shrink-0 text-gray-300 group-hover:text-indigo-400 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m8.25 4.5 7.5 7.5-7.5 7.5"
                />
              </svg>
            </Link>
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
    </div>
  );
}
