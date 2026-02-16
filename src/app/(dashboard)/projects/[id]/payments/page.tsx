import { notFound } from "next/navigation";
import { getProjectById } from "@/lib/actions/projects";
import { getItems } from "@/lib/actions/items";
import { createSupabaseServer } from "@/lib/supabase-server";
import { calculateInvoiceTotals, formatCurrency } from "@/lib/invoice-calculations";
import type { Profile, Item, DiscountType } from "@/types";
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

  const items = await getItems(id);

  const itemsTotal = items.reduce(
    (sum, i) => sum + Number(i.retail_price) * (i.quantity ?? 1),
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

      {/* Main totals card */}
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
                <span className="text-sm text-gray-600">Delivery Total</span>
              </div>
              <span className="text-sm font-semibold tabular-nums text-gray-900">
                {formatCurrency(totals.deliveryTotal)}
              </span>
            </div>

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

            {/* Grand total */}
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

      {/* Payment status placeholder */}
      <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center">
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
        <h2 className="text-base font-semibold text-foreground">Payment Tracking Coming Soon</h2>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-muted-foreground">
          Payment status tracking and history will be available in a future update.
        </p>
      </div>
    </div>
  );
}
