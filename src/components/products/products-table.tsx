"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { tableStyles, buttonStyles } from "@/components/ui/form-styles";
import { deleteProduct, updateProduct } from "@/lib/actions/products";
import { useRouter } from "next/navigation";
import { firstImage, isExternalImage } from "@/lib/parse-images";
import { InlineTextInput } from "@/components/ui/inline-text-input";
import { InlineNumberInput } from "@/components/ui/inline-number-input";
import { InlineTypePicker } from "@/components/ui/inline-type-picker";
import { ProductForm } from "@/components/products/product-form";
import { getTypeColor } from "@/lib/constants/product-types";
import type { Product, ClientProduct } from "@/types";

interface ProductsTableProps {
  products: (Product | ClientProduct)[];
  isAdmin: boolean;
}

/* ─── Sorting ─── */

type SortField = "model_number" | "name" | "type" | "retail_price" | "sales_price" | "cost" | "shipping";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return (
      <svg className="ml-1 inline h-3 w-3 text-muted-foreground/30" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15 12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
      </svg>
    );
  }
  return dir === "asc" ? (
    <svg className="ml-1 inline h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
  ) : (
    <svg className="ml-1 inline h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

/* ─── Helpers ─── */

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function compareValues(a: string | number, b: string | number, dir: SortDir): number {
  if (typeof a === "string" && typeof b === "string") {
    const cmp = a.localeCompare(b, "en", { sensitivity: "base" });
    return dir === "asc" ? cmp : -cmp;
  }
  const numA = typeof a === "number" ? a : 0;
  const numB = typeof b === "number" ? b : 0;
  return dir === "asc" ? numA - numB : numB - numA;
}

/* ─── Pending edits per row: { [productId]: { [field]: value } } ─── */
type PendingEdits = Record<string, Record<string, string | number>>;

/* ─── Main Component ─── */

export function ProductsTable({ products, isAdmin }: ProductsTableProps) {
  const router = useRouter();
  const [localProducts, setLocalProducts] = useState(products);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [pendingEdits, setPendingEdits] = useState<PendingEdits>({});
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  // Unsaved changes navigation guard
  const [navGuardTarget, setNavGuardTarget] = useState<string | null>(null);
  const hasPendingEdits = Object.keys(pendingEdits).length > 0;

  // Browser tab close / refresh guard
  useEffect(() => {
    if (!hasPendingEdits) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasPendingEdits]);

  // Sync local state when server data changes (revalidation)
  const serverKey = useMemo(
    () => products.map((p) => `${p.id}:${p.updated_at}`).join(","),
    [products]
  );
  useMemo(() => {
    setLocalProducts(products);
    setPendingEdits({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  // Sorted products — display uses local products merged with pending edits
  const displayProducts = useMemo(() => {
    return localProducts.map((p) => {
      const edits = pendingEdits[p.id];
      if (!edits) return p;
      return { ...p, ...edits };
    });
  }, [localProducts, pendingEdits]);

  const sortedProducts = useMemo(() => {
    if (!sortField) return displayProducts;
    return [...displayProducts].sort((a, b) => {
      const aVal = sortField === "cost"
        ? (a as Product).cost ?? 0
        : (a[sortField as keyof typeof a] as string | number) ?? "";
      const bVal = sortField === "cost"
        ? (b as Product).cost ?? 0
        : (b[sortField as keyof typeof b] as string | number) ?? "";
      return compareValues(aVal, bVal, sortDir);
    });
  }, [displayProducts, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  // Stage an edit for a field — does NOT save yet
  const handleFieldChange = useCallback(
    (productId: string, field: string, value: string | number) => {
      setPendingEdits((prev) => ({
        ...prev,
        [productId]: { ...prev[productId], [field]: value },
      }));
    },
    []
  );

  // Save a field immediately (bypass pending edits — used for type picker)
  const handleImmediateSave = useCallback(
    (productId: string, field: string, value: string | number) => {
      setLocalProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, [field]: value } : p))
      );
      // Also clear this field from pending edits if it was staged
      setPendingEdits((prev) => {
        const rowEdits = prev[productId];
        if (!rowEdits) return prev;
        const { [field]: _, ...rest } = rowEdits;
        if (Object.keys(rest).length === 0) {
          const { [productId]: __, ...remaining } = prev;
          return remaining;
        }
        return { ...prev, [productId]: rest };
      });
      updateProduct(productId, { [field]: value });
    },
    []
  );

  // Confirm: save all pending edits for this row
  const handleConfirm = useCallback(
    (productId: string) => {
      const edits = pendingEdits[productId];
      if (!edits) return;
      // Apply to local state optimistically
      setLocalProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...edits } : p))
      );
      // Clear pending edits for this row
      setPendingEdits((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      // Fire server action
      updateProduct(productId, edits);
    },
    [pendingEdits]
  );

  // Cancel: discard all pending edits for this row
  const handleCancel = useCallback(
    (productId: string) => {
      setPendingEdits((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    },
    []
  );

  // Save ALL pending edits across all rows
  const handleSaveAll = useCallback(() => {
    const entries = Object.entries(pendingEdits);
    for (const [productId, edits] of entries) {
      setLocalProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...edits } : p))
      );
      updateProduct(productId, edits);
    }
    setPendingEdits({});
  }, [pendingEdits]);

  // Navigation guard: intercept link clicks when there are unsaved changes
  const guardedNavigate = useCallback(
    (href: string) => {
      if (hasPendingEdits) {
        setNavGuardTarget(href);
      } else {
        router.push(href);
      }
    },
    [hasPendingEdits, router]
  );

  async function handleDelete(id: string) {
    if (!confirm("Delete this product from the catalog?")) return;
    setLocalProducts((prev) => prev.filter((p) => p.id !== id));
    setPendingEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    await deleteProduct(id);
    router.refresh();
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No products in the catalog yet.
        </p>
        {isAdmin && (
          <Link
            href="/catalog/new"
            className={`${buttonStyles.primary} mt-4 inline-flex`}
          >
            Add First Product
          </Link>
        )}
      </div>
    );
  }

  // Compact cell styles for denser table
  const tdCompact = "px-2 py-2 text-sm text-foreground";
  const thBase = "text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground";

  function SortableTh({ field, children, className = "" }: { field: SortField; children: React.ReactNode; className?: string }) {
    return (
      <th
        className={`${tdCompact} ${thBase} cursor-pointer select-none hover:text-foreground transition-colors ${className}`}
        onClick={() => handleSort(field)}
      >
        {children}
        <SortIcon active={sortField === field} dir={sortDir} />
      </th>
    );
  }

  return (
    <>
      {/* Desktop table — horizontally scrollable */}
      <div className={`${tableStyles.wrapper} hidden sm:block`}>
        <table className={`${tableStyles.table} min-w-[800px]`}>
          <thead className={tableStyles.thead}>
            <tr>
              <th className={`${tdCompact} ${thBase} w-[50px]`}>Image</th>
              <SortableTh field="type" className="w-[90px]">Type</SortableTh>
              <SortableTh field="name">Name</SortableTh>
              <SortableTh field="retail_price" className="w-[80px]">Retail</SortableTh>
              <SortableTh field="sales_price" className="w-[80px]">Sales</SortableTh>
              {isAdmin && <SortableTh field="cost" className="w-[80px]">Cost</SortableTh>}
              <SortableTh field="shipping" className="w-[75px]">S/H</SortableTh>
              <th className={`${tdCompact} ${thBase} w-[40px]`} title="Website">
                <svg className="h-3.5 w-3.5 mx-auto text-muted-foreground/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m9.86-2.338a4.5 4.5 0 0 0-1.242-7.244l-4.5-4.5a4.5 4.5 0 0 0-6.364 6.364L4.757 8.25" />
                </svg>
              </th>
              {isAdmin && <th className={`${tdCompact} ${thBase} w-[70px]`}>Actions</th>}
            </tr>
          </thead>
          <tbody className={tableStyles.tbody}>
            {sortedProducts.map((product) => {
              const thumb = firstImage(product.image_url);
              const isDirty = !!pendingEdits[product.id];
              // Get current display values (local + pending)
              const displayVal = (field: string) => {
                const edits = pendingEdits[product.id];
                if (edits && field in edits) return edits[field];
                return (product as Record<string, unknown>)[field];
              };

              return (
                <tr
                  key={product.id}
                  className={`${tableStyles.row} ${isDirty ? "bg-amber-50/50" : ""}`}
                >
                  {/* Image — has image: navigate to detail; no image: open edit popup */}
                  <td className={tdCompact}>
                    {thumb ? (
                      <button
                        type="button"
                        onClick={() => guardedNavigate(`/catalog/${product.id}`)}
                        className="block"
                      >
                        <Image
                          src={thumb}
                          alt=""
                          width={36}
                          height={36}
                          className="h-9 w-9 rounded object-cover"
                          unoptimized={isExternalImage(thumb)}
                        />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => isAdmin && setEditProduct(product as Product)}
                        className="flex h-9 w-9 items-center justify-center rounded bg-muted text-muted-foreground/40 hover:bg-muted/80 hover:text-muted-foreground transition-colors cursor-pointer"
                        title="Add image"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                        </svg>
                      </button>
                    )}
                  </td>

                  {/* Type — 2nd column after Image */}
                  <td className={tdCompact}>
                    {isAdmin ? (
                      <InlineTypePicker
                        value={String(displayVal("type") ?? "")}
                        onSave={(v) => handleImmediateSave(product.id, "type", v)}
                      />
                    ) : (
                      product.type ? (() => {
                        const c = getTypeColor(product.type);
                        return (
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium shadow-sm ${c.bg} ${c.text}`}>
                            {product.type}
                          </span>
                        );
                      })() : "--"
                    )}
                  </td>

                  {/* Name */}
                  <td className={tdCompact}>
                    {isAdmin ? (
                      <InlineTextInput
                        value={String(displayVal("name") ?? "")}
                        onChange={(v) => handleFieldChange(product.id, "name", v)}
                        required
                        placeholder="Product name"
                      />
                    ) : (
                      product.name
                    )}
                  </td>

                  {/* Retail */}
                  <td className={tdCompact}>
                    {isAdmin ? (
                      <InlineNumberInput
                        value={Number(displayVal("retail_price") ?? 0)}
                        onChange={(v) => handleFieldChange(product.id, "retail_price", v)}
                        prefix="$"
                      />
                    ) : (
                      <span className="text-xs">{formatCurrency(product.retail_price)}</span>
                    )}
                  </td>

                  {/* Sales */}
                  <td className={tdCompact}>
                    {isAdmin ? (
                      <InlineNumberInput
                        value={Number(displayVal("sales_price") ?? 0)}
                        onChange={(v) => handleFieldChange(product.id, "sales_price", v)}
                        prefix="$"
                      />
                    ) : (
                      <span className="text-xs">{formatCurrency(product.sales_price)}</span>
                    )}
                  </td>

                  {/* Dealer (admin only) */}
                  {isAdmin && (
                    <td className={tdCompact}>
                      <InlineNumberInput
                        value={Number(displayVal("cost") ?? 0)}
                        onChange={(v) => handleFieldChange(product.id, "cost", v)}
                        prefix="$"
                      />
                    </td>
                  )}

                  {/* S/H */}
                  <td className={tdCompact}>
                    {isAdmin ? (
                      <InlineNumberInput
                        value={Number(displayVal("shipping") ?? 0)}
                        onChange={(v) => handleFieldChange(product.id, "shipping", v)}
                        prefix="$"
                      />
                    ) : (
                      <span className="text-xs">{formatCurrency(product.shipping)}</span>
                    )}
                  </td>

                  {/* Website — icon link */}
                  <td className={`${tdCompact} text-center`}>
                    {(() => {
                      const url = String(displayVal("manufacturer_website") ?? "");
                      return url ? (
                        <a
                          href={url.startsWith("http") ? url : `https://${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md p-1 text-primary/60 hover:text-primary hover:bg-primary/10 transition-colors"
                          title={url}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-muted-foreground/30">--</span>
                      );
                    })()}
                  </td>

                  {/* Actions (admin only) */}
                  {isAdmin && (
                    <td className={tdCompact}>
                      {isDirty ? (
                        <div className="flex gap-1">
                          {/* Confirm */}
                          <button
                            onClick={() => handleConfirm(product.id)}
                            className="rounded-md p-1.5 text-green-600 transition-all hover:bg-green-50 hover:text-green-700"
                            title="Save changes"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          </button>
                          {/* Cancel */}
                          <button
                            onClick={() => handleCancel(product.id)}
                            className="rounded-md p-1.5 text-red-500 transition-all hover:bg-red-50 hover:text-red-600"
                            title="Discard changes"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditProduct(product as Product)}
                            className="rounded-md p-1.5 text-muted-foreground/60 transition-all hover:bg-primary/10 hover:text-primary"
                            title="Edit product"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="rounded-md p-1.5 text-muted-foreground/40 transition-all hover:bg-destructive/10 hover:text-destructive"
                            title="Delete"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list — guarded navigation */}
      <div className="space-y-2 sm:hidden">
        {sortedProducts.map((product) => {
          const thumb = firstImage(product.image_url);
          return (
            <button
              type="button"
              key={product.id}
              onClick={() => guardedNavigate(`/catalog/${product.id}`)}
              className="block w-full text-left rounded-xl border border-border/40 bg-white p-3"
            >
              {/* Top: image + name + type */}
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-lg object-cover"
                      unoptimized={isExternalImage(thumb)}
                    />
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        if (isAdmin) {
                          e.stopPropagation();
                          setEditProduct(product as Product);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (isAdmin && (e.key === "Enter" || e.key === " ")) {
                          e.stopPropagation();
                          setEditProduct(product as Product);
                        }
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground/40 hover:bg-muted/60 hover:text-muted-foreground transition-colors"
                      title="Add image"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {product.name}
                  </p>
                  {product.type && (() => {
                    const c = getTypeColor(product.type);
                    return (
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm mt-0.5 ${c.bg} ${c.text}`}>
                        {product.type}
                      </span>
                    );
                  })()}
                </div>
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(product.id);
                    }}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground/40 transition-all hover:bg-destructive/10 hover:text-destructive"
                    title="Delete"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Price grid */}
              <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">Retail</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(product.retail_price)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">Sales</p>
                  <p className="text-xs font-medium text-foreground">{formatCurrency(product.sales_price)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">S/H</p>
                  <p className="text-xs text-foreground">{formatCurrency(product.shipping)}</p>
                </div>
              </div>

              {/* Admin cost */}
              {isAdmin && "cost" in product && (
                <div className="mt-2 flex items-center justify-between border-t border-border/30 pt-2">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-amber-600/60">Cost</span>
                  <span className="text-xs text-amber-600/80">{formatCurrency((product as Product).cost)}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Unsaved changes navigation guard modal */}
      {navGuardTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setNavGuardTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h3 className="text-center text-base font-semibold text-gray-900">
              Unsaved Changes
            </h3>
            <p className="mt-1 text-center text-sm text-gray-500">
              You have unsaved changes. Would you like to save all?
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setNavGuardTarget(null)}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingEdits({});
                  const target = navGuardTarget;
                  setNavGuardTarget(null);
                  router.push(target);
                }}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveAll();
                  const target = navGuardTarget;
                  setNavGuardTarget(null);
                  router.push(target);
                }}
                className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
              >
                Save All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit product modal */}
      {editProduct && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[5vh] overflow-y-auto"
          onClick={() => setEditProduct(null)}
        >
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl mb-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setEditProduct(null)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Product</h2>

            <ProductForm
              product={editProduct}
              isAdmin={isAdmin}
              onDone={() => {
                setEditProduct(null);
                router.refresh();
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
