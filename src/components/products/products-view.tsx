"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ProductsTable } from "@/components/products/products-table";
import { ProductsGrid } from "@/components/products/products-grid";
import { TypeFilterPills } from "@/components/products/type-filter-pills";
import { ViewToggle } from "@/components/ui/view-toggle";
import type { ViewMode } from "@/components/ui/view-toggle";
import type { Product, ClientProduct } from "@/types";

interface ProductsViewProps {
  products: (Product | ClientProduct)[];
  isAdmin: boolean;
}

export function ProductsView({ products, isAdmin }: ProductsViewProps) {
  const [view, setView] = useState<ViewMode>("list");
  const [typeFilter, setTypeFilter] = useState("");

  const extraTypes = useMemo(() => {
    const types = new Set(
      products.map((p) => p.type).filter((t) => t.length > 0)
    );
    return [...types];
  }, [products]);

  const filtered = useMemo(
    () =>
      typeFilter === ""
        ? products
        : products.filter((p) => p.type === typeFilter),
    [products, typeFilter]
  );

  return (
    <div className="space-y-4">
      {/* Type filter pills */}
      <TypeFilterPills
        value={typeFilter}
        onChange={setTypeFilter}
        extraTypes={extraTypes}
      />

      {/* Header row: add button + view toggle (right-aligned) */}
      <div className="flex items-center justify-end gap-3">
        {/* Add button */}
        {isAdmin && (
          <Link
            href="/catalog/new"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition-all hover:bg-primary-hover"
            title="Add product"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </Link>
        )}

        <ViewToggle value={view} onChange={setView} />
      </div>

      {/* Products display */}
      {view === "cards" ? (
        <ProductsGrid products={filtered} isAdmin={isAdmin} />
      ) : (
        <ProductsTable products={filtered} isAdmin={isAdmin} />
      )}
    </div>
  );
}
