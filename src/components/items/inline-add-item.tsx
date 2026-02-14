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
import { MultiImageUpload } from "@/components/items/multi-image-upload";
import { TypeTagPicker } from "@/components/products/type-tag-picker";
import { firstImage } from "@/lib/parse-images";
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
  images: string[];
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
    images: [],
    notes: "",
    manufacturer_website: "",
  };
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
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

  const searchRef = useRef<HTMLDivElement>(null);
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

  // Debounced search
  useEffect(() => {
    if (mode !== "searching") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => handleSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, handleSearch, mode]);

  // Click outside to close search
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        if (mode === "searching" && !query.trim()) {
          setMode("collapsed");
        }
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mode, query]);

  // Auto-focus search input
  useEffect(() => {
    if (mode === "searching") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [mode]);

  // Escape key handling
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (mode === "create-product") {
          setMode("searching");
          setError(null);
        } else if (mode === "searching") {
          setMode("collapsed");
          setQuery("");
          setDropdownOpen(false);
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mode]);

  // Select a product → create item from it
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

  function handleCreateNew() {
    setDropdownOpen(false);
    setProductFields(emptyProductFields(query));
    setMode("create-product");
  }

  function updateProductField(name: keyof NewProductFields, value: string) {
    setProductFields((prev) => ({ ...prev, [name]: value }));
  }

  // Submit new product + create item
  async function handleCreateProductAndItem(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const imageUrl =
        productFields.images.length === 0
          ? undefined
          : productFields.images.length === 1
            ? productFields.images[0]
            : JSON.stringify(productFields.images);

      const productResult = await createProduct({
        name: productFields.name,
        model_number: productFields.model_number,
        type: productFields.type,
        description: productFields.description || productFields.name,
        retail_price: parseFloat(productFields.retail_price) || 0,
        cost: parseFloat(productFields.cost) || 0,
        sales_price: parseFloat(productFields.sales_price) || 0,
        shipping: parseFloat(productFields.shipping) || 0,
        image_url: imageUrl,
        notes: productFields.notes || undefined,
        manufacturer_website: productFields.manufacturer_website || undefined,
      });
      if (productResult.error) {
        setError(productResult.error);
        setSaving(false);
        return;
      }
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
        image_url: productFields.images[0] ?? undefined,
        product_id: productResult.id ?? undefined,
      });
      if (itemResult.error) {
        setError(itemResult.error);
        setSaving(false);
        return;
      }
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

  // ── Collapsed ─────────────────────────────────────────────
  if (mode === "collapsed") {
    return (
      <button
        onClick={() => setMode("searching")}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border/50 bg-transparent px-3 py-2.5 text-left transition-all hover:border-primary/30 hover:bg-muted/20"
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <span className="text-sm text-muted-foreground/70">Add an item</span>
      </button>
    );
  }

  // ── Search mode ───────────────────────────────────────────
  if (mode === "searching") {
    return (
      <div ref={searchRef} className="relative">
        {/* Search bar */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2 shadow-sm transition-all focus-within:border-primary focus-within:shadow-md focus-within:shadow-primary/5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 leading-none mb-0.5">
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim() && results.length === 0 && !loading) {
                  e.preventDefault();
                  handleCreateNew();
                }
              }}
              placeholder="Search products or type a name…"
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
            />
          </div>
          {loading && (
            <div className="shrink-0">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </div>
          )}
          {saving && (
            <span className="shrink-0 text-xs font-medium text-primary animate-pulse">
              Adding…
            </span>
          )}
        </div>

        {error && (
          <div className="mt-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Dropdown */}
        {dropdownOpen && query.trim() && (
          <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-white shadow-xl shadow-black/5 max-h-80 overflow-y-auto animate-slide-down">
            {/* Product matches */}
            {results.map((product) => {
              const thumb = firstImage(product.image_url);
              return (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelectProduct(product)}
                disabled={saving}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 border-b border-border/30 last:border-b-0 disabled:opacity-50"
              >
                {thumb ? (
                  <Image
                    src={thumb}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground/40">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground/70 truncate">
                    {[product.model_number, product.type, product.description]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium text-foreground tabular-nums">
                  {formatCurrency(product.sales_price)}
                </span>
              </button>
              );
            })}

            {/* Create new — always shown when not loading */}
            {!loading && (
              <button
                type="button"
                onClick={handleCreateNew}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-primary/5 border-t border-border/40"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-foreground">
                  Create new product: &ldquo;<span className="text-primary">{query}</span>&rdquo;
                </span>
                <span className="ml-auto text-xs text-muted-foreground/50">
                  Enter ↵
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Create product modal (backdrop overlay) ───────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] animate-fade-in"
        onClick={() => {
          setMode("searching");
          setError(null);
        }}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 top-[5%] z-50 mx-auto w-full max-w-2xl px-3 sm:top-[10%] sm:px-4 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-2xl shadow-black/10">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              Create Product
            </h3>
            <button
              type="button"
              onClick={() => {
                setMode("searching");
                setError(null);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateProductAndItem} className="space-y-3">
            {/* Row 1: Type tag picker */}
            <div>
              <p className={`${pillLabel} mb-1.5`}>Type</p>
              <TypeTagPicker
                value={productFields.type}
                onChange={(val) => updateProductField("type", val)}
              />
            </div>

            {/* Row 2: Name | Model # | Description */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <div className={`${pillWrapper} col-span-2 sm:min-w-[120px] sm:flex-1`}>
                <label htmlFor="new_name" className={pillLabel}>Name *</label>
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
              <div className={`${pillWrapper} sm:w-24 sm:shrink-0`}>
                <label htmlFor="new_model" className={pillLabel}>Model #</label>
                <input
                  id="new_model"
                  type="text"
                  value={productFields.model_number}
                  onChange={(e) => updateProductField("model_number", e.target.value)}
                  placeholder="Model…"
                  className={pillInput}
                />
              </div>
              <div className={`${pillWrapper} sm:min-w-[120px] sm:flex-1`}>
                <label htmlFor="new_desc" className={pillLabel}>Description</label>
                <input
                  id="new_desc"
                  type="text"
                  value={productFields.description}
                  onChange={(e) => updateProductField("description", e.target.value)}
                  placeholder="Description…"
                  className={pillInput}
                />
              </div>
            </div>

            {/* Row 3: Retail | Wholesale | Sale Price | S/H | URL */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
              <div className={`${pillWrapper} sm:w-24 sm:shrink-0`}>
                <label htmlFor="new_retail" className={pillLabel}>Retail</label>
                <input
                  id="new_retail"
                  type="number"
                  step="0.01"
                  value={productFields.retail_price}
                  onChange={(e) => updateProductField("retail_price", e.target.value)}
                  className={pillInput}
                />
              </div>
              {isAdmin && (
                <div className={`${pillWrapperAdmin} sm:w-24 sm:shrink-0`}>
                  <label htmlFor="new_cost" className={pillLabelAdmin}>Wholesale</label>
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
              <div className={`${pillWrapper} sm:w-24 sm:shrink-0`}>
                <label htmlFor="new_sales" className={pillLabel}>Sale Price</label>
                <input
                  id="new_sales"
                  type="number"
                  step="0.01"
                  value={productFields.sales_price}
                  onChange={(e) => updateProductField("sales_price", e.target.value)}
                  className={pillInput}
                />
              </div>
              <div className={`${pillWrapper} sm:w-20 sm:shrink-0`}>
                <label htmlFor="new_shipping" className={pillLabel}>S/H</label>
                <input
                  id="new_shipping"
                  type="number"
                  step="0.01"
                  value={productFields.shipping}
                  onChange={(e) => updateProductField("shipping", e.target.value)}
                  className={pillInput}
                />
              </div>
              <div className={`${pillWrapper} col-span-3 sm:w-32 sm:shrink-0`}>
                <label htmlFor="new_website" className={pillLabel}>URL</label>
                <input
                  id="new_website"
                  type="url"
                  value={productFields.manufacturer_website}
                  onChange={(e) => updateProductField("manufacturer_website", e.target.value)}
                  placeholder="https://…"
                  className={pillInput}
                />
              </div>
            </div>

            {/* Row 4: Notes */}
            <div className={`${pillWrapper}`}>
              <label htmlFor="new_notes" className={pillLabel}>Notes</label>
              <input
                id="new_notes"
                type="text"
                value={productFields.notes}
                onChange={(e) => updateProductField("notes", e.target.value)}
                placeholder="Additional notes…"
                className={pillInput}
              />
            </div>

            {/* Row 5: Image upload (up to 8) */}
            <div>
              <p className={`${pillLabel} mb-1.5`}>Images (up to 8)</p>
              <MultiImageUpload
                images={productFields.images}
                onChange={(imgs) =>
                  setProductFields((prev) => ({ ...prev, images: imgs }))
                }
                max={8}
              />
            </div>

            {/* Actions — right-aligned, small buttons */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode("searching");
                  setError(null);
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-primary-hover disabled:opacity-50"
              >
                {saving && (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                {saving ? "Creating…" : "Create & Add"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
