"use client";

interface SellerFilterPillsProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Unique seller names found in the product data */
  readonly sellers: readonly string[];
}

export function SellerFilterPills({
  value,
  onChange,
  sellers,
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

      {sellers.map((seller) => (
        <button
          key={seller}
          type="button"
          onClick={() => onChange(value === seller ? "" : seller)}
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all shadow-sm ${
            value === seller
              ? "bg-slate-700 text-white"
              : "bg-slate-100 text-slate-600 hover:opacity-80"
          }`}
        >
          {seller}
        </button>
      ))}
    </div>
  );
}
