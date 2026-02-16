import { calculateInvoiceTotals, formatCurrency } from "@/lib/invoice-calculations";
import type { DiscountType } from "@/types";

interface InvoiceSummaryFooterProps {
  itemsTotal: number;
  deliveryTotal: number;
  discountType: DiscountType;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  /** optional: admin-only cost data */
  myCost?: number;
  myShipping?: number;
}

export function InvoiceSummaryFooter({
  itemsTotal,
  deliveryTotal,
  discountType,
  discountPercent,
  discountAmount,
  taxPercent,
  myCost,
  myShipping,
}: InvoiceSummaryFooterProps) {
  const totals = calculateInvoiceTotals({
    itemsTotal,
    deliveryTotal,
    discountType,
    discountPercent,
    discountValue: discountAmount,
    taxPercent,
  });

  const isAdmin = myCost !== undefined;
  const totalMyCost = (myCost ?? 0) + (myShipping ?? 0);
  const profit = totals.grandTotal - totalMyCost;

  const discountLabel =
    discountType === "percent"
      ? `Discount (${discountPercent}%)`
      : "Discount";

  return (
    <div className="flex justify-end">
      <div className="w-full sm:w-1/4 sm:min-w-[260px]">
        <div className="rounded-xl border border-gray-200/80 bg-gradient-to-br from-slate-50 to-white shadow-sm overflow-hidden">
          {/* Accent bar */}
          <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="p-4 space-y-2.5">
            {/* Items Total */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Items Total</span>
              <span className="tabular-nums font-medium text-gray-900">
                {formatCurrency(totals.itemsTotal)}
              </span>
            </div>

            {/* Services Total (Delivery) */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Services</span>
              <span className="tabular-nums font-medium text-gray-900">
                {formatCurrency(totals.deliveryTotal)}
              </span>
            </div>

            {/* Tax */}
            {totals.taxAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Tax ({taxPercent}%)</span>
                <span className="tabular-nums font-medium text-gray-900">
                  {formatCurrency(totals.taxAmount)}
                </span>
              </div>
            )}

            {/* Discount */}
            {totals.discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-600">{discountLabel}</span>
                <span className="tabular-nums font-medium text-emerald-600">
                  −{formatCurrency(totals.discountAmount)}
                </span>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-200 pt-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Total</span>
                <span className="text-lg font-black tabular-nums text-gray-900">
                  {formatCurrency(totals.grandTotal)}
                </span>
              </div>
            </div>

            {/* Admin-only: Cost & Profit */}
            {isAdmin && (
              <div className="border-t border-dashed border-gray-200 pt-2.5 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">My Cost</span>
                  <span className="tabular-nums font-medium text-gray-500">
                    {formatCurrency(totalMyCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Est. Profit</span>
                  <span className={`tabular-nums font-bold ${profit >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {formatCurrency(profit)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
