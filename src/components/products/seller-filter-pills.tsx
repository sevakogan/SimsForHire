"use client";

import { getMerchantPillColor } from "@/lib/constants/product-types";

interface SellerFilterPillsProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Unique seller names found in the product data */
  readonly sellers: readonly string[];
  /** Merchant name → color key mapping */
  readonly colorMap: Readonly<Record<string, string>>;
}

export function SellerFilterPills({
  value,
  onChange,
  sellers,
  colorMap,
}: SellerFilterPillsProps) {
  if (sellers.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* All pill */}
      <button
        type="button"
        onClick={() => onChange("")}
        className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
          value === ""
            ? "bg-primary text-white shadow-sm"
            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        All Merchants
      </button>

      {sellers.map((seller) => {
        const colorKey = colorMap[seller] ?? "gray";
        const scheme = getMerchantPillColor(colorKey);
        const isActive = value === seller;

        return (
          <button
            key={seller}
            type="button"
            onClick={() => onChange(value === seller ? "" : seller)}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all shadow-sm ${
              isActive
                ? `${scheme.activeBg} ${scheme.activeText}`
                : `${scheme.bg} ${scheme.text} hover:opacity-80`
            }`}
          >
            {seller}
          </button>
        );
      })}
    </div>
  );
}
