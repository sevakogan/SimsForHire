"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ProductsTable } from "@/components/products/products-table";
import { ProductsGrid } from "@/components/products/products-grid";
import { TypeFilterPills } from "@/components/products/type-filter-pills";
import type { Product, ClientProduct } from "@/types";

type ViewMode = "grid" | "list";

interface ProductsViewProps {
  products: (Product | ClientProduct)[];
  isAdmin: boolean;
}

export function ProductsView({ products, isAdmin }: ProductsViewProps) {
  const [view, setView] = useState<ViewMode>("grid");
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

      {/* Header row: view toggle + add button */}
      <div className="flex items-center justify-between">
        {/* View toggle */}
        <div className="flex rounded-lg border border-border bg-white p-0.5 shadow-sm">
          <button
            onClick={() => setView("grid")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "grid"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Thumbnail view"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
            </svg>
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "list"
                ? "bg-primary text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="List view"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </button>
        </div>

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
      </div>

      {/* Products display */}
      {view === "grid" ? (
        <ProductsGrid products={filtered} isAdmin={isAdmin} />
      ) : (
        <ProductsTable products={filtered} isAdmin={isAdmin} />
      )}
    </div>
  );
}
