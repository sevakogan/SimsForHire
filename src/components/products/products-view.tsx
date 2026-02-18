"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ProductsTable } from "@/components/products/products-table";
import { ProductsGrid } from "@/components/products/products-grid";
import { TypeFilterPills } from "@/components/products/type-filter-pills";
import { SellerFilterPills } from "@/components/products/seller-filter-pills";
import { ViewToggle } from "@/components/ui/view-toggle";
import type { ViewMode } from "@/components/ui/view-toggle";
import type { Product, ClientProduct } from "@/types";

interface ProductsViewProps {
  products: (Product | ClientProduct)[];
  isAdmin: boolean;
  /** Base path for links (default: /customizations/products) */
  basePath?: string;
}

export function ProductsView({ products, isAdmin, basePath = "/customizations/products" }: ProductsViewProps) {
  const [view, setView] = useState<ViewMode>("list");
  const [typeFilter, setTypeFilter] = useState("");
  const [sellerFilter, setSellerFilter] = useState("");

  const extraTypes = useMemo(() => {
    const types = new Set(
      products.map((p) => p.type).filter((t) => t.length > 0)
    );
    return [...types];
  }, [products]);

  const uniqueSellers = useMemo(() => {
    const sellers = new Set(
      products
        .map((p) => p.seller_merchant)
        .filter((s): s is string => typeof s === "string" && s.length > 0)
    );
    return [...sellers].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (typeFilter !== "" && p.type !== typeFilter) return false;
        if (sellerFilter !== "" && p.seller_merchant !== sellerFilter) return false;
        return true;
      }),
    [products, typeFilter, sellerFilter]
  );

  return (
    <div className="space-y-4">
      {/* Filter pills */}
      <div className="space-y-2">
        <TypeFilterPills
          value={typeFilter}
          onChange={setTypeFilter}
          extraTypes={extraTypes}
        />
        <SellerFilterPills
          value={sellerFilter}
          onChange={setSellerFilter}
          sellers={uniqueSellers}
        />
      </div>

      {/* Header row: add button + view toggle (right-aligned) */}
      <div className="flex items-center justify-end gap-3">
        {/* Add button */}
        {isAdmin && (
          <Link
            href={`${basePath}/new`}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition-all hover:bg-primary-hover"
            title="Add new"
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
        <ProductsGrid products={filtered} isAdmin={isAdmin} basePath={basePath} />
      ) : (
        <ProductsTable products={filtered} isAdmin={isAdmin} basePath={basePath} />
      )}
    </div>
  );
}
