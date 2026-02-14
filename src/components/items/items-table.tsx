"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { deleteItem } from "@/lib/actions/items";
import { useRouter } from "next/navigation";
import { firstImage } from "@/lib/parse-images";
import { TypeFilterPills } from "@/components/products/type-filter-pills";
import { ViewToggle } from "@/components/ui/view-toggle";
import type { ViewMode } from "@/components/ui/view-toggle";
import type { Item, ClientItem, AcceptanceStatus } from "@/types";

interface ItemsTableProps {
  items: (Item | ClientItem)[];
  projectId: string;
  isAdmin: boolean;
  clientNoteCount?: number;
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

function ClientNoteInline({ note }: { note: string }) {
  return (
    <div className="flex items-start gap-1.5 mt-1.5">
      <svg className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
      <span className="text-xs text-blue-600 italic leading-tight">
        &ldquo;{note}&rdquo;
      </span>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function ItemsTable({ items, projectId, isAdmin, clientNoteCount = 0 }: ItemsTableProps) {
  const router = useRouter();
  const [typeFilter, setTypeFilter] = useState("");
  const [view, setView] = useState<ViewMode>("list");

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
      {/* Filter pills + view toggle row */}
      <div className="flex items-start justify-between gap-3">
        <TypeFilterPills
          value={typeFilter}
          onChange={setTypeFilter}
          extraTypes={extraTypes}
        />
        <ViewToggle value={view} onChange={setView} />
      </div>

      {/* Cards view */}
      {view === "cards" && (
        <ItemsCardGrid
          items={filtered}
          projectId={projectId}
          isAdmin={isAdmin}
          onDelete={handleDelete}
        />
      )}

      {/* List view */}
      {view === "list" && (
        <>
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

            {filtered.map((item, index) => {
              const sellingPrice = item.price_sold_for ?? item.retail_price;
              const total = sellingPrice + item.retail_shipping;
              const thumb = firstImage(item.image_url);
              const isEven = index % 2 === 0;

              return (
                <div
                  key={item.id}
                  className={`group flex items-center gap-3 border-b border-x border-border/40 px-1 py-3 transition-colors last:rounded-b-xl ${
                    isEven ? "bg-white hover:bg-muted/20" : "bg-gray-50/70 hover:bg-gray-100/70"
                  }`}
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
                    {isAdmin && "client_note" in item && item.client_note && (
                      <ClientNoteInline note={item.client_note} />
                    )}
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

          {/* Mobile card layout (list mode on mobile) */}
          <div className="space-y-2 sm:hidden">
            {filtered.map((item, index) => {
              const sellingPrice = item.price_sold_for ?? item.retail_price;
              const total = sellingPrice + item.retail_shipping;
              const thumb = firstImage(item.image_url);
              const isEven = index % 2 === 0;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border border-border/40 p-3 ${
                    isEven ? "bg-white" : "bg-gray-50/70"
                  }`}
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
                      {isAdmin && "client_note" in item && item.client_note && (
                        <ClientNoteInline note={item.client_note} />
                      )}
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
        </>
      )}
    </div>
  );
}

/* ─── Card Grid View for Items ─── */

interface ItemsCardGridProps {
  items: (Item | ClientItem)[];
  projectId: string;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

function ItemsCardGrid({ items, projectId, isAdmin, onDelete }: ItemsCardGridProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No items match this filter.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((item) => {
        const thumb = firstImage(item.image_url);
        const sellingPrice = item.price_sold_for ?? item.retail_price;
        const total = sellingPrice + item.retail_shipping;

        return (
          <Link
            key={item.id}
            href={`/projects/${projectId}/items/${item.id}`}
            className="group block rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-md hover:border-primary/20 overflow-hidden"
          >
            {/* Image */}
            <div className="relative aspect-square bg-muted/30">
              {thumb ? (
                <Image
                  src={thumb}
                  alt=""
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                  </svg>
                </div>
              )}
              {/* Acceptance badge overlay */}
              {isAdmin && item.acceptance_status && item.acceptance_status !== "pending" && (
                <div className="absolute top-1.5 right-1.5">
                  <AcceptanceBadge status={item.acceptance_status} />
                </div>
              )}
              {/* Client note indicator */}
              {isAdmin && "client_note" in item && item.client_note && (
                <div className="absolute top-1.5 left-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-2">
              <p className="text-xs font-semibold text-foreground truncate">
                {item.description || item.item_type || "Item"}
              </p>
              {item.item_type && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {item.item_type}
                </p>
              )}

              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xs font-bold text-foreground">
                  {formatCurrency(total)}
                </span>
                {item.retail_price !== sellingPrice && (
                  <span className="text-[10px] text-muted-foreground line-through">
                    {formatCurrency(item.retail_price)}
                  </span>
                )}
              </div>

              {isAdmin && "my_cost" in item && (
                <p className="text-[10px] text-amber-600">
                  Cost: {formatCurrency((item as Item).my_cost)}
                </p>
              )}

              {/* Admin delete */}
              {isAdmin && (
                <div className="mt-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="text-[10px] px-1.5 py-0.5 rounded text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
