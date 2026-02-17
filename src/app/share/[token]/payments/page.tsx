import { notFound } from "next/navigation";
import {
  getProjectByShareToken,
  getClientSafeItemsByProjectId,
} from "@/lib/actions/projects";
import { getPaymentSettingsPublic } from "@/lib/actions/payment-settings";
import { getPaymentsByProjectIdPublic } from "@/lib/actions/payments";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/invoice-calculations";
import { PayButton } from "@/components/portal/pay-button";
import { PortalAuthGate } from "@/components/portal/portal-auth-gate";
import type { DiscountType } from "@/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string; session_id?: string }>;
}

export default async function PaymentsPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { status: queryStatus } = await searchParams;
  const { project } = await getProjectByShareToken(token);

  if (!project) notFound();

  const [items, paymentSettings, payments] = await Promise.all([
    getClientSafeItemsByProjectId(project.id),
    getPaymentSettingsPublic(),
    getPaymentsByProjectIdPublic(project.id),
  ]);

  // Check if there's a successful payment
  const hasSucceededPayment = payments.some((p) => p.status === "succeeded");
  const isPaid = project.status === "paid" || hasSucceededPayment;

  // Split by category: service items go to services total, product items to items total
  const itemsTotal = items.reduce((sum, i) => {
    const cat = (i as { category?: string }).category ?? "product";
    return cat === "service"
      ? sum
      : sum + Number(i.price_sold_for ?? i.retail_price) * (i.quantity ?? 1);
  }, 0);

  const serviceRetailTotal = items.reduce((sum, i) => {
    const cat = (i as { category?: string }).category ?? "product";
    return cat === "service"
      ? sum + Number(i.price_sold_for ?? i.retail_price) * (i.quantity ?? 1)
      : sum;
  }, 0);

  const shippingTotal = items.reduce(
    (sum, i) => sum + Number(i.retail_shipping) * (i.quantity ?? 1),
    0
  );

  const deliveryTotal = serviceRetailTotal + shippingTotal;

  const discountType = (project.discount_type ?? "percent") as DiscountType;
  const discountPercent = Number(project.discount_percent) || 0;
  const discountAmount = Number(project.discount_amount) || 0;
  const taxPercent = Number(project.tax_percent) || 0;

  const totals = calculateInvoiceTotals({
    itemsTotal,
    deliveryTotal,
    discountType,
    discountPercent,
    discountValue: discountAmount,
    taxPercent,
  });

  const discountLabel =
    discountType === "percent"
      ? `Discount (${discountPercent}%)`
      : "Discount";

  if (items.length === 0) {
    return (
      <PortalAuthGate token={token}>
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Payments
          </h1>
        </div>
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm text-gray-500">
            No items yet — totals will appear once items are added to your
            invoice.
          </p>
        </div>
      </PortalAuthGate>
    );
  }

  return (
    <PortalAuthGate token={token}>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
          Payments
        </h1>
      </div>

      {/* Success message */}
      {queryStatus === "success" && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-green-800">
            Payment Successful!
          </h2>
          <p className="mt-1 text-sm text-green-600">
            Thank you for your payment. You will receive a confirmation email
            shortly.
          </p>
        </div>
      )}

      {/* Cancel message */}
      {queryStatus === "cancel" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-6 w-6 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-amber-800">
            Payment Cancelled
          </h2>
          <p className="mt-1 text-sm text-amber-600">
            Your payment was not processed. You can try again below.
          </p>
        </div>
      )}

      {/* Totals card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-5 sm:p-6 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Invoice Summary
          </h2>

          {/* Items Total */}
          <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-indigo-400" />
              <span className="text-sm text-gray-600">Items Total</span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-gray-900">
              {formatCurrency(totals.itemsTotal)}
            </span>
          </div>

          {/* Services Total (Delivery) */}
          <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-400" />
              <span className="text-sm text-gray-600">Services</span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-gray-900">
              {formatCurrency(totals.deliveryTotal)}
            </span>
          </div>

          {/* Tax */}
          {totals.taxAmount > 0 && (
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-sm text-gray-600">
                  Tax ({taxPercent}%)
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-gray-900">
                {formatCurrency(totals.taxAmount)}
              </span>
            </div>
          )}

          {/* Discount */}
          {totals.discountAmount > 0 && (
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-sm text-emerald-600">
                  {discountLabel}
                </span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-emerald-600">
                −{formatCurrency(totals.discountAmount)}
              </span>
            </div>
          )}

          {/* Grand total */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-base font-bold text-gray-900">
              Total Due
            </span>
            <span className="text-xl font-black tabular-nums text-gray-900">
              {formatCurrency(totals.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment section */}
      <div className="mt-6">
        {isPaid ? (
          /* Already paid */
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
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
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-green-800">
              Payment Received
            </h2>
            <p className="mt-1 text-sm text-green-600">
              This invoice has been paid. Thank you!
            </p>
          </div>
        ) : paymentSettings.payments_enabled ? (
          /* Pay Now button */
          <PayButton
            shareToken={token}
            projectId={project.id}
            amount={formatCurrency(totals.grandTotal)}
          />
        ) : (
          /* Payments not configured */
          <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-7 w-7 text-gray-400"
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
            </div>
            <h2 className="text-base font-semibold text-gray-700">
              Online Payments Coming Soon
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-gray-500">
              Online payment options will be available soon. Please contact us
              for payment details.
            </p>
          </div>
        )}
      </div>
    </PortalAuthGate>
  );
}
