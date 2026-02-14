"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { deleteItem } from "@/lib/actions/items";
import { useRouter } from "next/navigation";
import { firstImage } from "@/lib/parse-images";
import { TypeFilterPills } from "@/components/products/type-filter-pills";
import type { Item, ClientItem, AcceptanceStatus } from "@/types";

interface ItemsTableProps {
  items: (Item | ClientItem)[];
  projectId: string;
  isAdmin: boolean;
}

function AcceptanceBadge({ status }: { status: AcceptanceStatus }) {
  if (status === "pending") return null;

  if (status === "accepted") {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-1.5 py-0.5 text-[9px] font-medium text-green-700">
        <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
        Accepted
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-medium text-red-700">
      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
      Rejected
    </span>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function ItemsTable({ items, projectId, isAdmin }: ItemsTableProps) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState("");

  const extraTypes = useMemo(() => {
    const types = new Set(
      items.map((i) => i.item_type).filter((t) => t.length > 0)
    );
    return [...types];
  }, [items]);

  const filtered = useMemo(
    () =>
      typeFilter === ""
        ? items
        : items.filter((i) => i.item_type === typeFilter),
    [items, typeFilter]
  );

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    await deleteItem(id);
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 py-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60">
          <svg className="h-6 w-6 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">No items yet</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Use the bar below to add your first item
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Type filter pills */}
      <TypeFilterPills
        value={typeFilter}
        onChange={setTypeFilter}
        extraTypes={extraTypes}
      />

      {/* Desktop table layout */}
      <div className="hidden sm:block space-y-0">
        {/* Header row */}
        <div className="flex items-center gap-3 bg-muted/40 px-1 py-2 rounded-t-xl border border-border/40">
          <div className="w-5 shrink-0" />
          <div className="w-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Product
            </span>
          </div>
          <div className="w-14 shrink-0 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Qty
            </span>
          </div>
          <div className="w-24 shrink-0 text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Retail
            </span>
          </div>
          <div className="w-24 shrink-0 text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Selling Price
            </span>
          </div>
          <div className="w-20 shrink-0 text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              S/H
            </span>
          </div>
          <div className="w-24 shrink-0 text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Total
            </span>
          </div>
          {isAdmin && (
            <div className="w-20 shrink-0 text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600/70">
                Cost
              </span>
            </div>
          )}
          {isAdmin && <div className="w-8 shrink-0" />}
        </div>

        {filtered.map((item) => {
          const sellingPrice = item.price_sold_for ?? item.retail_price;
          const total = sellingPrice + item.retail_shipping;
          const thumb = firstImage(item.image_url);

          return (
            <div
              key={item.id}
              className="group flex items-center gap-3 border-b border-x border-border/40 bg-white px-1 py-3 transition-colors hover:bg-muted/20 last:rounded-b-xl"
            >
              <div className="flex shrink-0 cursor-grab items-center text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/60">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="6" r="1.5" />
                  <circle cx="15" cy="6" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="18" r="1.5" />
                  <circle cx="15" cy="18" r="1.5" />
                </svg>
              </div>

              <div className="shrink-0">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground/40">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/projects/${projectId}/items/${item.id}`}
                  className="text-sm font-medium text-foreground underline decoration-border underline-offset-2 transition-colors hover:decoration-primary hover:text-primary truncate block"
                >
                  {item.description || item.item_type}
                </Link>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {item.item_type && (
                    <span className="inline-block rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {item.item_type}
                    </span>
                  )}
                  {isAdmin && item.acceptance_status && item.acceptance_status !== "pending" && (
                    <AcceptanceBadge status={item.acceptance_status} />
                  )}
                </div>
              </div>

              <div className="w-14 shrink-0 text-center">
                <span className="inline-block w-full rounded-md border border-border/60 bg-white px-2 py-1 text-sm text-foreground text-center">
                  1
                </span>
              </div>

              <div className="w-24 shrink-0 text-right">
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(item.retail_price)}
                </span>
              </div>

              <div className="w-24 shrink-0 text-right">
                <span className="inline-block w-full rounded-md border border-border/60 bg-white px-2 py-1 text-sm font-medium text-foreground text-right">
                  {formatCurrency(sellingPrice)}
                </span>
              </div>

              <div className="w-20 shrink-0 text-right">
                <span className="inline-block w-full rounded-md border border-border/60 bg-white px-2 py-1 text-sm text-foreground text-right">
                  {formatCurrency(item.retail_shipping)}
                </span>
              </div>

              <div className="w-24 shrink-0 text-right">
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(total)}
                </span>
              </div>

              {isAdmin && "my_cost" in item && (
                <div className="w-20 shrink-0 text-right">
                  <span className="text-xs text-amber-600/80">
                    {formatCurrency((item as Item).my_cost)}
                  </span>
                </div>
              )}

              {isAdmin && (
                <button
                  onClick={() => handleDelete(item.id)}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground/40 transition-all hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100"
                  title="Delete item"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile card layout */}
      <div className="space-y-2 sm:hidden">
        {filtered.map((item) => {
          const sellingPrice = item.price_sold_for ?? item.retail_price;
          const total = sellingPrice + item.retail_shipping;
          const thumb = firstImage(item.image_url);

          return (
            <div
              key={item.id}
              className="rounded-xl border border-border/40 bg-white p-3"
            >
              {/* Top row: image + name + delete */}
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  {thumb ? (
                    <Image
                      src={thumb}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted/40 text-muted-foreground/40">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/projects/${projectId}/items/${item.id}`}
                    className="text-sm font-medium text-foreground underline decoration-border underline-offset-2 transition-colors hover:decoration-primary hover:text-primary line-clamp-2"
                  >
                    {item.description || item.item_type}
                  </Link>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {item.item_type && (
                      <span className="inline-block rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {item.item_type}
                      </span>
                    )}
                    {isAdmin && item.acceptance_status && item.acceptance_status !== "pending" && (
                      <AcceptanceBadge status={item.acceptance_status} />
                    )}
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground/40 transition-all hover:bg-destructive/10 hover:text-destructive"
                    title="Delete item"
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
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.retail_price)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">Selling</p>
                  <p className="text-xs font-medium text-foreground">{formatCurrency(sellingPrice)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">S/H</p>
                  <p className="text-xs text-foreground">{formatCurrency(item.retail_shipping)}</p>
                </div>
              </div>

              {/* Total + Admin cost */}
              <div className="mt-2 flex items-center justify-between border-t border-border/30 pt-2">
                <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/60">Total</span>
                <span className="text-sm font-semibold text-foreground">{formatCurrency(total)}</span>
              </div>
              {isAdmin && "my_cost" in item && (
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-amber-600/60">Cost</span>
                  <span className="text-xs text-amber-600/80">{formatCurrency((item as Item).my_cost)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
