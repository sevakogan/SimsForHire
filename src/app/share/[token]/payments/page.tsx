import { notFound } from "next/navigation";
import {
  getProjectByShareToken,
  getClientSafeItemsByProjectId,
} from "@/lib/actions/projects";
import { getCompanyInfo } from "@/lib/actions/company-info";
import { getPaymentSettingsPublic } from "@/lib/actions/payment-settings";
import { getPaymentsByProjectIdPublic } from "@/lib/actions/payments";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/invoice-calculations";
import Link from "next/link";
import { PayButton } from "@/components/portal/pay-button";
import { PortalAuthGate } from "@/components/portal/portal-auth-gate";
import { CustomerPaidView } from "@/components/portal/customer-paid-view";
import type { DiscountType, FulfillmentType } from "@/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string; session_id?: string }>;
}

export default async function PaymentsPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { status: queryStatus } = await searchParams;
  const { project, client } = await getProjectByShareToken(token);

  if (!project) notFound();

  // Gate: contract must be signed before payment is allowed
  const contractSigned = project.contract_signed_at !== null;
  const alreadyPaidStatus = ["paid", "preparing", "shipped", "received", "completed"].includes(project.status);

  if (!contractSigned && !alreadyPaidStatus) {
    return (
      <PortalAuthGate token={token}>
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Payments
          </h1>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-50">
              <svg
                className="h-7 w-7 text-violet-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              Contract Signing Required
            </h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Please sign your contract before making a payment.
            </p>
            <Link
              href={`/share/${token}/contract`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              Sign Contract
            </Link>
          </div>
        </div>
      </PortalAuthGate>
    );
  }

  const [items, paymentSettings, payments, company] = await Promise.all([
    getClientSafeItemsByProjectId(project.id),
    getPaymentSettingsPublic(),
    getPaymentsByProjectIdPublic(project.id),
    getCompanyInfo(),
  ]);

  // Check if there's a successful payment
  const hasSucceededPayment = payments.some((p) => p.status === "succeeded");
  const isPaid = project.status === "paid" || hasSucceededPayment || alreadyPaidStatus;
  const succeededPayment = payments.find((p) => p.status === "succeeded");

  // Split by category
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

  const companyName = company.name || "SimsForHire (LevelSim LLC Holdings)";
  const buyerName = client?.name ?? "—";

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

      {/* Thank You card — always at the top when paid */}
      {isPaid && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500" />
          <div className="px-6 py-8 sm:px-8 sm:py-10 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 ring-4 ring-green-50">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
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
      )}

      {/* Success message (fresh from Stripe redirect) */}
      {queryStatus === "success" && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-green-800">
            Payment Successful!
          </h2>
          <p className="mt-1 text-sm text-green-600">
            Thank you for your payment. A receipt has been sent to your email.
          </p>
        </div>
      )}

      {/* Cancel message */}
      {queryStatus === "cancel" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
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

          <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-indigo-400" />
              <span className="text-sm text-gray-600">Items Total</span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-gray-900">
              {formatCurrency(totals.itemsTotal)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-400" />
              <span className="text-sm text-gray-600">Services</span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-gray-900">
              {formatCurrency(totals.deliveryTotal)}
            </span>
          </div>

          {totals.taxAmount > 0 && (
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-sm text-gray-600">Tax ({taxPercent}%)</span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-gray-900">
                {formatCurrency(totals.taxAmount)}
              </span>
            </div>
          )}

          {totals.discountAmount > 0 && (
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-sm text-emerald-600">{discountLabel}</span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-emerald-600">
                −{formatCurrency(totals.discountAmount)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-3">
            <span className="text-base font-bold text-gray-900">Total Due</span>
            <span className="text-xl font-black tabular-nums text-gray-900">
              {formatCurrency(totals.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment section */}
      <div className="mt-6">
        {isPaid ? (
          <CustomerPaidView
            token={token}
            buyerName={buyerName}
            companyName={companyName}
            invoiceNumber={project.invoice_number}
            receiptNumber={succeededPayment?.stripe_payment_intent_id ?? null}
            paymentDate={succeededPayment
              ? new Date(succeededPayment.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : null}
            paymentAmount={succeededPayment
              ? formatCurrency(succeededPayment.amount / 100)
              : formatCurrency(totals.grandTotal)}
            grandTotal={formatCurrency(totals.grandTotal)}
            invoiceData={{
              companyName,
              logoUrl: company.logo_url,
              logoScale: company.logo_scale,
              buyerName,
              buyerEmail: client?.email ?? null,
              buyerPhone: client?.phone ?? null,
              buyerAddress: client?.address ?? null,
              invoiceNumber: project.invoice_number,
              date: new Date(project.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
              items: items.map((i) => ({
                description: i.description,
                retail_price: i.retail_price,
                price_sold_for: i.price_sold_for,
                retail_shipping: i.retail_shipping,
                quantity: i.quantity,
                category: (i as { category?: string }).category,
                item_type: i.item_type,
                image_url: i.image_url,
              })),
              itemsTotal: totals.itemsTotal,
              deliveryTotal: totals.deliveryTotal,
              discountAmount: totals.discountAmount,
              taxAmount: totals.taxAmount,
              grandTotal: totals.grandTotal,
              fulfillmentType: project.fulfillment_type,
              shippingAddress: project.shipping_address,
            }}
            contractData={{
              signedBy: project.contract_signed_by,
              signedAt: project.contract_signed_at,
              signatureDataUrl: project.contract_signature_data,
              initialsDataUrl: project.contract_initials_data,
            }}
          />
        ) : paymentSettings.payments_enabled ? (
          <PayButton
            shareToken={token}
            projectId={project.id}
            amount={formatCurrency(totals.grandTotal)}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-7 w-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
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
