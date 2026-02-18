import { notFound } from "next/navigation";
import Link from "next/link";
import { getProjectById } from "@/lib/actions/projects";
import { getItems } from "@/lib/actions/items";
import { getPaymentsByProjectId } from "@/lib/actions/payments";
import { getPaymentSettings } from "@/lib/actions/payment-settings";
import { getClientById } from "@/lib/actions/clients";
import { getCompanyInfo } from "@/lib/actions/company-info";
import { createSupabaseServer } from "@/lib/supabase-server";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/invoice-calculations";
import { AdminDownloadPackageButton } from "@/components/dashboard/download-package-button";
import type { Profile, Item, DiscountType, PaymentStatus, Payment } from "@/types";
import { isAdminRole } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PaymentsPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  const admin = isAdminRole((profile as Profile).role);

  const project = await getProjectById(id);
  if (!project) notFound();

  const [items, payments, paymentSettings, client, company] = await Promise.all([
    getItems(id),
    getPaymentsByProjectId(id),
    getPaymentSettings(),
    getClientById(project.client_id),
    getCompanyInfo(),
  ]);

  const itemsTotal = items.reduce(
    (sum, i) => {
      const cat = (i as Item).category ?? "product";
      return cat === "service" ? sum : sum + Number(i.retail_price) * (i.quantity ?? 1);
    },
    0
  );
  const serviceTotal = items.reduce(
    (sum, i) => {
      const cat = (i as Item).category ?? "product";
      return cat === "service" ? sum + Number(i.retail_price) * (i.quantity ?? 1) : sum;
    },
    0
  );
  const shippingTotal = items.reduce(
    (sum, i) => sum + Number(i.retail_shipping) * (i.quantity ?? 1),
    0
  );
  const deliveryTotal = serviceTotal + shippingTotal;

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

  let totalMyCost = 0;
  let totalMyShipping = 0;
  if (admin) {
    totalMyCost = (items as Item[]).reduce(
      (sum, i) => sum + Number(i.my_cost) * (i.quantity ?? 1),
      0
    );
    totalMyShipping = (items as Item[]).reduce(
      (sum, i) => sum + Number(i.my_shipping) * (i.quantity ?? 1),
      0
    );
  }

  const totalMyCostAll = totalMyCost + totalMyShipping;
  const profit = totals.grandTotal - totalMyCostAll;
  const discountLabel =
    discountType === "percent"
      ? `Discount (${discountPercent}%)`
      : "Discount";

  // Payment summary
  const succeededPayments = payments.filter((p) => p.status === "succeeded");
  const totalPaid = succeededPayments.reduce((sum, p) => sum + p.amount / 100, 0);
  const balanceRemaining = Math.max(0, totals.grandTotal - totalPaid);
  const isFullyPaid = totalPaid >= totals.grandTotal && totalPaid > 0;

  // Contract status
  const contractSigned = project.contract_signed_at !== null;
  const contractViewed = project.contract_viewed_at !== null;

  // First succeeded payment (for download package)
  const firstSucceeded = succeededPayments[0] ?? null;
  const companyName = company.name || "SimsForHire (LevelSim LLC Holdings)";
  const buyerName = client?.name ?? "—";

  if (items.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-lg sm:text-2xl font-bold text-foreground">
          Payments
        </h1>
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No items yet — add items to the invoice to see payment totals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-foreground">
        Payments
      </h1>

      {/* Quick status bar */}
      <div className="flex flex-wrap gap-2">
        {/* Payment status */}
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          isFullyPaid
            ? "bg-green-100 text-green-700"
            : totalPaid > 0
              ? "bg-amber-100 text-amber-700"
              : "bg-gray-100 text-gray-600"
        }`}>
          <span className={`h-2 w-2 rounded-full ${
            isFullyPaid ? "bg-green-500" : totalPaid > 0 ? "bg-amber-500" : "bg-gray-400"
          }`} />
          {isFullyPaid ? "Fully Paid" : totalPaid > 0 ? "Partially Paid" : "Unpaid"}
        </div>

        {/* Contract status */}
        <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          contractSigned
            ? "bg-violet-100 text-violet-700"
            : contractViewed
              ? "bg-amber-100 text-amber-700"
              : "bg-gray-100 text-gray-600"
        }`}>
          <span className={`h-2 w-2 rounded-full ${
            contractSigned ? "bg-violet-500" : contractViewed ? "bg-amber-500" : "bg-gray-400"
          }`} />
          {contractSigned ? "Contract Signed" : contractViewed ? "Contract Viewed" : "Contract Pending"}
        </div>

        {/* Invoice number */}
        {project.invoice_number && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            Invoice #{project.invoice_number}
          </div>
        )}
      </div>

      {/* Client & payment overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Client info card */}
        {client && (
          <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Customer
              </h2>
            </div>
            <div className="p-5 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {client.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{client.name}</p>
                  {client.email && (
                    <p className="text-xs text-gray-500 truncate">{client.email}</p>
                  )}
                </div>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                  {client.phone}
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <span className="truncate">{client.address}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment balance card */}
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Payment Balance
            </h2>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Invoice Total</span>
              <span className="text-sm font-semibold tabular-nums text-gray-900">
                {formatCurrency(totals.grandTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Paid</span>
              <span className={`text-sm font-semibold tabular-nums ${totalPaid > 0 ? "text-green-600" : "text-gray-400"}`}>
                {formatCurrency(totalPaid)}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-gray-900">
                  {isFullyPaid ? "Paid in Full" : "Balance Remaining"}
                </span>
                <span className={`text-xl font-black tabular-nums ${
                  isFullyPaid ? "text-green-600" : "text-gray-900"
                }`}>
                  {isFullyPaid ? (
                    <span className="flex items-center gap-1.5">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      {formatCurrency(0)}
                    </span>
                  ) : formatCurrency(balanceRemaining)}
                </span>
              </div>
            </div>
            {/* Progress bar */}
            {totals.grandTotal > 0 && (
              <div className="mt-2">
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isFullyPaid ? "bg-green-500" : "bg-indigo-500"}`}
                    style={{ width: `${Math.min(100, (totalPaid / totals.grandTotal) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-gray-400 text-right">
                  {Math.round((totalPaid / totals.grandTotal) * 100)}% paid
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice totals breakdown */}
      <div className="rounded-2xl border border-gray-200/80 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-5 sm:p-6 space-y-4">
          {/* Client-facing totals */}
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Invoice Totals
            </h2>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-indigo-400" />
                <span className="text-sm text-gray-600">Items Total</span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-gray-900">
                {formatCurrency(totals.itemsTotal)}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-400" />
                <span className="text-sm text-gray-600">Services Total</span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-gray-900">
                {formatCurrency(totals.deliveryTotal)}
              </span>
            </div>

            {totals.taxAmount > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
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
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="text-sm text-emerald-600">{discountLabel}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums text-emerald-600">
                  −{formatCurrency(totals.discountAmount)}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-base font-bold text-gray-900">Client Total</span>
              <span className="text-xl font-black tabular-nums text-gray-900">
                {formatCurrency(totals.grandTotal)}
              </span>
            </div>
          </div>

          {/* Admin: Cost & Profit */}
          {admin && (
            <div className="border-t border-dashed border-gray-200 pt-4 space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Cost & Profit
              </h2>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">My Item Cost</span>
                <span className="text-sm font-semibold tabular-nums text-gray-700">
                  {formatCurrency(totalMyCost)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">My Shipping Cost</span>
                <span className="text-sm font-semibold tabular-nums text-gray-700">
                  {formatCurrency(totalMyShipping)}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Total My Cost</span>
                <span className="text-sm font-bold tabular-nums text-gray-900">
                  {formatCurrency(totalMyCostAll)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-base font-bold text-gray-900">Est. Profit</span>
                <span className={`text-xl font-black tabular-nums ${profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {formatCurrency(profit)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Payment History
            </h2>
            {payments.length > 0 && (
              <span className="text-xs text-gray-400">
                {payments.length} transaction{payments.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {payments.length === 0 ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <svg
                  className="h-6 w-6 text-gray-400"
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
              <p className="text-sm font-medium text-gray-700">
                No payments received yet
              </p>
              {!paymentSettings.payments_enabled && admin && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Online payments are not configured.{" "}
                  <Link
                    href="/payment-setup"
                    className="font-medium text-primary hover:underline"
                  >
                    Set up Stripe
                  </Link>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <PaymentCard key={payment.id} payment={payment} isAdmin={admin} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Download Package — only show when payment succeeded */}
      {firstSucceeded && (
        <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Documents
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Contract, invoice, receipt & Stripe details
                </p>
              </div>
              <AdminDownloadPackageButton
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
                    price_sold_for: (i as Item).price_sold_for,
                    retail_shipping: i.retail_shipping,
                    quantity: i.quantity,
                    category: (i as Item).category,
                    item_type: i.item_type,
                  })),
                  itemsTotal: totals.itemsTotal,
                  deliveryTotal: totals.deliveryTotal,
                  discountAmount: totals.discountAmount,
                  taxAmount: totals.taxAmount,
                  grandTotal: totals.grandTotal,
                  fulfillmentType: project.fulfillment_type,
                  shippingAddress: project.shipping_address,
                }}
                receiptNumber={firstSucceeded.stripe_payment_intent_id}
                paymentDate={new Date(firstSucceeded.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                paymentAmount={formatCurrency(firstSucceeded.amount / 100)}
                grandTotal={formatCurrency(totals.grandTotal)}
                contractData={{
                  signedBy: project.contract_signed_by,
                  signedAt: project.contract_signed_at,
                  signatureDataUrl: project.contract_signature_data,
                  initialsDataUrl: project.contract_initials_data,
                }}
                stripeData={{
                  paymentIntentId: firstSucceeded.stripe_payment_intent_id,
                  sessionId: firstSucceeded.stripe_session_id,
                  customerEmail: firstSucceeded.customer_email,
                  currency: firstSucceeded.currency,
                  status: firstSucceeded.status,
                  createdAt: firstSucceeded.created_at,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Payment card component ─────────────────────── */

function PaymentCard({ payment, isAdmin }: { payment: Payment; isAdmin: boolean }) {
  const style = STATUS_STYLES[payment.status] ?? STATUS_STYLES.pending;
  const dateStr = new Date(payment.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className={`rounded-xl border px-4 py-4 ${
      payment.status === "succeeded"
        ? "border-green-100 bg-green-50/30"
        : "border-gray-100 bg-gray-50/50"
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Amount + status */}
          <div className="flex items-center gap-2.5">
            <span className="text-base font-bold tabular-nums text-gray-900">
              {formatCurrency(payment.amount / 100)}
            </span>
            <StatusBadge status={payment.status} />
          </div>

          {/* Date + email */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {dateStr}
            </span>
            {payment.customer_email && (
              <span className="flex items-center gap-1 truncate">
                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                {payment.customer_email}
              </span>
            )}
            <span className="flex items-center gap-1 uppercase">
              <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              {payment.currency}
            </span>
          </div>

          {/* Admin: Stripe IDs */}
          {isAdmin && (
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-400 font-mono">
              {payment.stripe_payment_intent_id && (
                <span title="Payment Intent ID">
                  PI: {payment.stripe_payment_intent_id.slice(0, 20)}...
                </span>
              )}
              {payment.stripe_session_id && (
                <span title="Checkout Session ID">
                  CS: {payment.stripe_session_id.slice(0, 20)}...
                </span>
              )}
            </div>
          )}
        </div>

        {/* Status icon */}
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          payment.status === "succeeded" ? "bg-green-100" :
          payment.status === "pending" ? "bg-amber-100" :
          payment.status === "failed" ? "bg-red-100" :
          "bg-gray-100"
        }`}>
          {payment.status === "succeeded" ? (
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          ) : payment.status === "pending" ? (
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          ) : payment.status === "failed" ? (
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Status badge ───────────────────────────────── */

const STATUS_STYLES: Record<PaymentStatus, { bg: string; text: string; label: string }> = {
  succeeded: { bg: "bg-green-100", text: "text-green-700", label: "Paid" },
  pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
  failed: { bg: "bg-red-100", text: "text-red-700", label: "Failed" },
  refunded: { bg: "bg-blue-100", text: "text-blue-700", label: "Refunded" },
  expired: { bg: "bg-gray-100", text: "text-gray-600", label: "Expired" },
};

function StatusBadge({ status }: { status: PaymentStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}
