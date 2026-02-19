import type { DiscountType } from "@/types";

export interface InvoiceTotals {
  /** Sum of retail_price * qty for all items */
  itemsTotal: number;
  /** Sum of retail_shipping * qty for all items */
  deliveryTotal: number;
  /** Primary discount applied to items only */
  discountAmount: number;
  /** Additional fixed-$ discount stacked on top of primary discount */
  additionalDiscount: number;
  /** Tax applied to items after all discounts */
  taxAmount: number;
  /** Items after discounts + tax + delivery */
  grandTotal: number;
}

export function calculateInvoiceTotals({
  itemsTotal,
  deliveryTotal,
  discountType,
  discountPercent,
  discountValue,
  taxPercent,
  additionalDiscount = 0,
}: {
  itemsTotal: number;
  deliveryTotal: number;
  discountType: DiscountType;
  discountPercent: number;
  discountValue: number;
  taxPercent: number;
  additionalDiscount?: number;
}): InvoiceTotals {
  // Primary discount applies to items only
  const discountAmount =
    discountType === "percent"
      ? itemsTotal * (discountPercent / 100)
      : Math.min(discountValue, itemsTotal); // can't discount more than items total

  // Additional discount (fixed $) — also capped so we don't go below 0
  const cappedAdditional = Math.min(additionalDiscount, Math.max(0, itemsTotal - discountAmount));

  const itemsAfterDiscount = itemsTotal - discountAmount - cappedAdditional;

  // Tax applies to items after all discounts only (not delivery)
  const taxAmount = taxPercent > 0 ? itemsAfterDiscount * (taxPercent / 100) : 0;

  // Grand total: items after discounts + tax + delivery
  const grandTotal = itemsAfterDiscount + taxAmount + deliveryTotal;

  return {
    itemsTotal,
    deliveryTotal,
    discountAmount,
    additionalDiscount: cappedAdditional,
    taxAmount,
    grandTotal,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}
