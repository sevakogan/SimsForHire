import { notFound } from "next/navigation";
import {
  getProjectByShareToken,
  getClientSafeItemsByProjectId,
} from "@/lib/actions/projects";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/invoice-calculations";
import type { DiscountType } from "@/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PaymentsPage({ params }: Props) {
  const { token } = await params;
  const { project } = await getProjectByShareToken(token);

  if (!project) notFound();

  const items = await getClientSafeItemsByProjectId(project.id);

  const itemsTotal = items.reduce(
    (sum, i) => sum + Number(i.price_sold_for ?? i.retail_price) * (i.quantity ?? 1),
    0
  );
  const deliveryTotal = items.reduce(
    (sum, i) => sum + Number(i.retail_shipping) * (i.quantity ?? 1),
    0
  );

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
      <>
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
            Payments
          </h1>
        </div>
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm text-gray-500">
            No items yet — totals will appear once items are added to your invoice.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
          Payments
        </h1>
      </div>

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
                <span className="text-sm text-gray-600">Tax ({taxPercent}%)</span>
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
                <span className="text-sm text-emerald-600">{discountLabel}</span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-emerald-600">
                −{formatCurrency(totals.discountAmount)}
              </span>
            </div>
          )}

          {/* Grand total */}
          <div className="flex items-center justify-between pt-3">
            <span className="text-base font-bold text-gray-900">Total Due</span>
            <span className="text-xl font-black tabular-nums text-gray-900">
              {formatCurrency(totals.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment instructions placeholder */}
      <div className="mt-6 rounded-xl border border-dashed border-gray-300 py-12 text-center">
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
        <h2 className="text-base font-semibold text-gray-700">Online Payments Coming Soon</h2>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-gray-500">
          Online payment options will be available soon. Please reference the
          invoice links in your project for payment details.
        </p>
      </div>
    </>
  );
}
