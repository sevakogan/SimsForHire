import type { DiscountType } from "@/types";

export interface InvoiceTotals {
  /** Sum of retail_price * qty for all items */
  itemsTotal: number;
  /** Sum of retail_shipping * qty for all items */
  deliveryTotal: number;
  /** Discount applied to items only */
  discountAmount: number;
  /** Tax applied to items after discount */
  taxAmount: number;
  /** Items after discount + tax + delivery */
  grandTotal: number;
}

export function calculateInvoiceTotals({
  itemsTotal,
  deliveryTotal,
  discountType,
  discountPercent,
  discountValue,
  taxPercent,
}: {
  itemsTotal: number;
  deliveryTotal: number;
  discountType: DiscountType;
  discountPercent: number;
  discountValue: number;
  taxPercent: number;
}): InvoiceTotals {
  // Discount applies to items only
  const discountAmount =
    discountType === "percent"
      ? itemsTotal * (discountPercent / 100)
      : Math.min(discountValue, itemsTotal); // can't discount more than items total

  const itemsAfterDiscount = itemsTotal - discountAmount;

  // Tax applies to items after discount only (not delivery)
  const taxAmount = taxPercent > 0 ? itemsAfterDiscount * (taxPercent / 100) : 0;

  // Grand total: items after discount + tax + delivery
  const grandTotal = itemsAfterDiscount + taxAmount + deliveryTotal;

  return {
    itemsTotal,
    deliveryTotal,
    discountAmount,
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
