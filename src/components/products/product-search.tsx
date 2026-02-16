"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { searchProducts } from "@/lib/actions/products";
import type { ProductSearchResult } from "@/types";
import Image from "next/image";
import { isExternalImage } from "@/lib/parse-images";
import { pillWrapper, pillLabel, pillInput } from "@/components/ui/pill-styles";
import { getTypeColor } from "@/lib/constants/product-types";

interface ProductSearchProps {
  onSelect: (product: ProductSearchResult) => void;
  onClear: () => void;
  selectedProduct: ProductSearchResult | null;
  isAdmin: boolean;
}

export function ProductSearch({
  onSelect,
  onClear,
  selectedProduct,
  isAdmin,
}: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const data = await searchProducts(searchQuery, isAdmin);
        setResults(data);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, handleSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(product: ProductSearchResult) {
    onSelect(product);
    setQuery("");
    setIsOpen(false);
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }

  if (selectedProduct) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
        {selectedProduct.image_url && (
          <Image
            src={selectedProduct.image_url}
            alt=""
            width={32}
            height={32}
            className="rounded object-cover"
            unoptimized={isExternalImage(selectedProduct.image_url)}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {selectedProduct.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {selectedProduct.model_number && (
              <span className="text-xs text-muted-foreground">{selectedProduct.model_number}</span>
            )}
            {selectedProduct.type && (() => {
              const c = getTypeColor(selectedProduct.type);
              return (
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm ${c.bg} ${c.text}`}>
                  {selectedProduct.type}
                </span>
              );
            })()}
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          Clear
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className={pillWrapper}>
        <label className={pillLabel}>Search Catalog</label>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder="Search by name, model #, or description…"
            className={pillInput}
          />
          {loading && (
            <span className="absolute right-0 top-0.5 text-xs text-muted-foreground">
              Searching…
            </span>
          )}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-white shadow-lg max-h-64 overflow-y-auto">
          {results.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => handleSelect(product)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 border-b border-border/50 last:border-b-0"
            >
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt=""
                  width={36}
                  height={36}
                  className="rounded object-cover shrink-0"
                  unoptimized={isExternalImage(product.image_url)}
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                  --
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {product.name}
                </p>
                <div className="flex items-center gap-1.5">
                  {product.model_number && (
                    <span className="text-xs text-muted-foreground">{product.model_number}</span>
                  )}
                  {product.type && (() => {
                    const c = getTypeColor(product.type);
                    return (
                      <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium shadow-sm ${c.bg} ${c.text}`}>
                        {product.type}
                      </span>
                    );
                  })()}
                  {product.description && (
                    <span className="text-xs text-muted-foreground truncate">{product.description}</span>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-sm font-medium text-foreground">
                {formatCurrency(product.sales_price)}
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && query.trim() && !loading && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-white p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">
            No products found. You can still add manually below.
          </p>
        </div>
      )}
    </div>
  );
}
