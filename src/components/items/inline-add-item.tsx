"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { searchProducts, createProduct } from "@/lib/actions/products";
import { createItem, getNextItemNumber } from "@/lib/actions/items";
import {
  pillLabel,
  pillInput,
  pillWrapper,
  pillWrapperAdmin,
  pillLabelAdmin,
} from "@/components/ui/pill-styles";
import { ImageUpload } from "@/components/items/image-upload";
import type { ProductSearchResult } from "@/types";

interface InlineAddItemProps {
  projectId: string;
  isAdmin: boolean;
}

type Mode = "collapsed" | "searching" | "create-product";

interface NewProductFields {
  name: string;
  model_number: string;
  type: string;
  description: string;
  retail_price: string;
  cost: string;
  sales_price: string;
  shipping: string;
  image_url: string | null;
  notes: string;
  manufacturer_website: string;
}

function emptyProductFields(name: string = ""): NewProductFields {
  return {
    name,
    model_number: "",
    type: "",
    description: "",
    retail_price: "0",
    cost: "0",
    sales_price: "0",
    shipping: "0",
    image_url: null,
    notes: "",
    manufacturer_website: "",
  };
}

export function InlineAddItem({ projectId, isAdmin }: InlineAddItemProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("collapsed");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [productFields, setProductFields] = useState<NewProductFields>(
    emptyProductFields()
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setDropdownOpen(false);
        return;
      }

      setLoading(true);
      try {
        const data = await searchProducts(searchQuery, isAdmin);
        setResults(data);
        setDropdownOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

  useEffect(() => {
    if (mode !== "searching") return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, handleSearch, mode]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        if (mode === "searching" && !query.trim()) {
          setMode("collapsed");
        }
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mode, query]);

  // Focus input when opening search
  useEffect(() => {
    if (mode === "searching") {
      inputRef.current?.focus();
    }
  }, [mode]);

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }

  // Select a product from search — create item from it
  async function handleSelectProduct(product: ProductSearchResult) {
    setSaving(true);
    setError(null);
    setDropdownOpen(false);

    try {
      const nextNumber = await getNextItemNumber(projectId);

      const result = await createItem({
        project_id: projectId,
        item_number: nextNumber,
        item_type: product.type || "",
        description: product.description || product.name,
        retail_price: product.retail_price,
        retail_shipping: product.shipping,
        discount_percent: 0,
        my_cost: product.cost ?? 0,
        my_shipping: 0,
        price_sold_for: product.sales_price,
        image_url: product.image_url ?? undefined,
        product_id: product.id,
      });

      if (result.error) {
        setError(result.error);
        setSaving(false);
        return;
      }

      // Reset and refresh
      setQuery("");
      setMode("collapsed");
      setResults([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setSaving(false);
    }
  }

  // Open "Create New Item" modal (product form)
  function handleCreateNew() {
    setDropdownOpen(false);
    setProductFields(emptyProductFields(query));
    setMode("create-product");
  }

  function updateProductField(name: keyof NewProductFields, value: string) {
    setProductFields((prev) => ({ ...prev, [name]: value }));
  }

  // Submit new product, then create item from it
  async function handleCreateProductAndItem(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // 1. Create the product
      const productResult = await createProduct({
        name: productFields.name,
        model_number: productFields.model_number,
        type: productFields.type,
        description: productFields.description,
        retail_price: parseFloat(productFields.retail_price) || 0,
        cost: parseFloat(productFields.cost) || 0,
        sales_price: parseFloat(productFields.sales_price) || 0,
        shipping: parseFloat(productFields.shipping) || 0,
        image_url: productFields.image_url ?? undefined,
        notes: productFields.notes || undefined,
        manufacturer_website: productFields.manufacturer_website || undefined,
      });

      if (productResult.error) {
        setError(productResult.error);
        setSaving(false);
        return;
      }

      // 2. Create the item from the new product
      const nextNumber = await getNextItemNumber(projectId);

      const itemResult = await createItem({
        project_id: projectId,
        item_number: nextNumber,
        item_type: productFields.type,
        description: productFields.description || productFields.name,
        retail_price: parseFloat(productFields.retail_price) || 0,
        retail_shipping: parseFloat(productFields.shipping) || 0,
        discount_percent: 0,
        my_cost: parseFloat(productFields.cost) || 0,
        my_shipping: 0,
        price_sold_for: parseFloat(productFields.sales_price) || 0,
        image_url: productFields.image_url ?? undefined,
        product_id: productResult.id ?? undefined,
      });

      if (itemResult.error) {
        setError(itemResult.error);
        setSaving(false);
        return;
      }

      // Reset and refresh
      setQuery("");
      setMode("collapsed");
      setProductFields(emptyProductFields());
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  }

  // --- Collapsed state ---
  if (mode === "collapsed") {
    return (
      <button
        onClick={() => setMode("searching")}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-white px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-muted/30"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </div>
        <span className="text-sm text-muted-foreground">Add an item</span>
      </button>
    );
  }

  // --- Search mode ---
  if (mode === "searching") {
    return (
      <div ref={containerRef} className="relative">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-4 py-2.5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Add an item
            </p>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (results.length > 0 || query.trim()) setDropdownOpen(true);
              }}
              placeholder="Search products or type a name…"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>
          {loading && (
            <span className="shrink-0 text-xs text-muted-foreground">
              Searching…
            </span>
          )}
          {saving && (
            <span className="shrink-0 text-xs text-primary">Adding…</span>
          )}
        </div>

        {error && (
          <div className="mt-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Dropdown */}
        {dropdownOpen && query.trim() && (
          <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-white shadow-lg max-h-72 overflow-y-auto">
            {/* Product results */}
            {results.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelectProduct(product)}
                disabled={saving}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-b border-border/50 last:border-b-0 disabled:opacity-50"
              >
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt=""
                    width={36}
                    height={36}
                    className="rounded object-cover shrink-0"
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
                  <p className="text-xs text-muted-foreground truncate">
                    {product.model_number && `${product.model_number} · `}
                    {product.type}
                    {product.description && ` · ${product.description}`}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium text-foreground">
                  {formatCurrency(product.sales_price)}
                </span>
              </button>
            ))}

            {/* Create new item option */}
            {!loading && (
              <button
                type="button"
                onClick={handleCreateNew}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-primary/5 border-t border-border/50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground">
                  Create new item: &ldquo;{query}&rdquo;
                </p>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // --- Create product modal ---
  return (
    <div ref={containerRef}>
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Create New Item
          </h3>
          <button
            type="button"
            onClick={() => {
              setMode("searching");
              setError(null);
            }}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            Back
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateProductAndItem} className="space-y-3">
          {/* Row 1: Name | Model # | Type — all equal short */}
          <div className="flex flex-wrap gap-2">
            <div className={`${pillWrapper} min-w-[120px] flex-1`}>
              <label htmlFor="new_name" className={pillLabel}>
                Name *
              </label>
              <input
                id="new_name"
                type="text"
                required
                autoFocus
                value={productFields.name}
                onChange={(e) => updateProductField("name", e.target.value)}
                placeholder="Product name…"
                className={pillInput}
              />
            </div>

            <div className={`${pillWrapper} min-w-[120px] flex-1`}>
              <label htmlFor="new_model" className={pillLabel}>
                Model #
              </label>
              <input
                id="new_model"
                type="text"
                value={productFields.model_number}
                onChange={(e) =>
                  updateProductField("model_number", e.target.value)
                }
                placeholder="Model…"
                className={pillInput}
              />
            </div>

            <div className={`${pillWrapper} min-w-[120px] flex-1`}>
              <label htmlFor="new_type" className={pillLabel}>
                Type
              </label>
              <input
                id="new_type"
                type="text"
                value={productFields.type}
                onChange={(e) => updateProductField("type", e.target.value)}
                placeholder="Furniture…"
                className={pillInput}
              />
            </div>
          </div>

          {/* Row 2: Description — 2x width of a short field */}
          <div className="flex gap-2">
            <div className={`${pillWrapper} flex-[2] min-w-[240px]`}>
              <label htmlFor="new_description" className={pillLabel}>
                Description
              </label>
              <input
                id="new_description"
                type="text"
                value={productFields.description}
                onChange={(e) =>
                  updateProductField("description", e.target.value)
                }
                placeholder="Brief description…"
                className={pillInput}
              />
            </div>
            <div className="flex-1" />
          </div>

          {/* Row 3: Prices */}
          <div className="flex flex-wrap gap-2">
            <div className={`${pillWrapper} w-28 shrink-0`}>
              <label htmlFor="new_retail" className={pillLabel}>
                Retail $
              </label>
              <input
                id="new_retail"
                type="number"
                step="0.01"
                value={productFields.retail_price}
                onChange={(e) =>
                  updateProductField("retail_price", e.target.value)
                }
                className={pillInput}
              />
            </div>

            <div className={`${pillWrapper} w-28 shrink-0`}>
              <label htmlFor="new_sales" className={pillLabel}>
                Sales $
              </label>
              <input
                id="new_sales"
                type="number"
                step="0.01"
                value={productFields.sales_price}
                onChange={(e) =>
                  updateProductField("sales_price", e.target.value)
                }
                className={pillInput}
              />
            </div>

            {isAdmin && (
              <div className={`${pillWrapperAdmin} w-28 shrink-0`}>
                <label htmlFor="new_cost" className={pillLabelAdmin}>
                  Dealer $
                </label>
                <input
                  id="new_cost"
                  type="number"
                  step="0.01"
                  value={productFields.cost}
                  onChange={(e) => updateProductField("cost", e.target.value)}
                  className={pillInput}
                />
              </div>
            )}

            <div className={`${pillWrapper} w-28 shrink-0`}>
              <label htmlFor="new_shipping" className={pillLabel}>
                S/H
              </label>
              <input
                id="new_shipping"
                type="number"
                step="0.01"
                value={productFields.shipping}
                onChange={(e) =>
                  updateProductField("shipping", e.target.value)
                }
                className={pillInput}
              />
            </div>
          </div>

          {/* Row 4: Website | Image | Notes */}
          <div className="flex flex-wrap gap-2">
            <div className={`${pillWrapper} min-w-[160px] flex-1`}>
              <label htmlFor="new_website" className={pillLabel}>
                Manufacturer Website
              </label>
              <input
                id="new_website"
                type="url"
                value={productFields.manufacturer_website}
                onChange={(e) =>
                  updateProductField("manufacturer_website", e.target.value)
                }
                placeholder="https://…"
                className={`${pillInput} text-xs`}
              />
            </div>

            <div className={`${pillWrapper} min-w-[120px]`}>
              <label className={pillLabel}>Image</label>
              <ImageUpload
                currentUrl={null}
                onUpload={(url) =>
                  setProductFields((prev) => ({ ...prev, image_url: url }))
                }
                onRemove={() =>
                  setProductFields((prev) => ({ ...prev, image_url: null }))
                }
              />
            </div>

            <div className={`${pillWrapper} min-w-[160px] flex-1`}>
              <label htmlFor="new_notes" className={pillLabel}>
                Notes
              </label>
              <input
                id="new_notes"
                type="text"
                value={productFields.notes}
                onChange={(e) => updateProductField("notes", e.target.value)}
                placeholder="Notes…"
                className={pillInput}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create & Add Item"}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("searching");
                setError(null);
              }}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
