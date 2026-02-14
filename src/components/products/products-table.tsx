"use client";

import Image from "next/image";
import Link from "next/link";
import { tableStyles, buttonStyles } from "@/components/ui/form-styles";
import { deleteProduct } from "@/lib/actions/products";
import { useRouter } from "next/navigation";
import { firstImage } from "@/lib/parse-images";
import type { Product, ClientProduct } from "@/types";

interface ProductsTableProps {
  products: (Product | ClientProduct)[];
  isAdmin: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function ProductsTable({ products, isAdmin }: ProductsTableProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Delete this product from the catalog?")) return;
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

  return (
    <>
      {/* Desktop table */}
      <div className={`${tableStyles.wrapper} hidden sm:block`}>
        <table className={tableStyles.table}>
          <thead className={tableStyles.thead}>
            <tr>
              <th className={tableStyles.th}>Image</th>
              <th className={tableStyles.th}>Model #</th>
              <th className={tableStyles.th}>Name</th>
              <th className={tableStyles.th}>Type</th>
              <th className={tableStyles.th}>Retail</th>
              <th className={tableStyles.th}>Sales</th>
              {isAdmin && <th className={tableStyles.th}>Dealer</th>}
              <th className={tableStyles.th}>S/H</th>
              <th className={tableStyles.th}>Website</th>
              {isAdmin && <th className={tableStyles.th}>Actions</th>}
            </tr>
          </thead>
          <tbody className={tableStyles.tbody}>
            {products.map((product) => {
              const thumb = firstImage(product.image_url);
              return (
                <tr key={product.id} className={tableStyles.row}>
                  <td className={tableStyles.td}>
                    {thumb ? (
                      <Image
                        src={thumb}
                        alt=""
                        width={40}
                        height={40}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        --
                      </div>
                    )}
                  </td>
                  <td className={tableStyles.td}>{product.model_number || "--"}</td>
                  <td className={tableStyles.td}>{product.name}</td>
                  <td className={tableStyles.td}>{product.type || "--"}</td>
                  <td className={tableStyles.td}>
                    {formatCurrency(product.retail_price)}
                  </td>
                  <td className={tableStyles.td}>
                    {formatCurrency(product.sales_price)}
                  </td>
                  {isAdmin && (
                    <td className={tableStyles.td}>
                      {formatCurrency((product as Product).cost)}
                    </td>
                  )}
                  <td className={tableStyles.td}>
                    {formatCurrency(product.shipping)}
                  </td>
                  <td className={tableStyles.td}>
                    {product.manufacturer_website ? (
                      <a
                        href={product.manufacturer_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Link
                      </a>
                    ) : (
                      "--"
                    )}
                  </td>
                  {isAdmin && (
                    <td className={tableStyles.td}>
                      <div className="flex gap-1">
                        <Link
                          href={`/catalog/${product.id}`}
                          className={`${buttonStyles.small} text-primary hover:bg-primary/10`}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className={`${buttonStyles.small} text-destructive hover:bg-destructive/10`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="space-y-2 sm:hidden">
        {products.map((product) => {
          const thumb = firstImage(product.image_url);
          return (
            <Link
              key={product.id}
              href={`/catalog/${product.id}`}
              className="block rounded-xl border border-border/40 bg-white p-3"
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
                  <p className="text-sm font-medium text-foreground truncate">
                    {product.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {product.model_number && (
                      <span className="text-xs text-muted-foreground">{product.model_number}</span>
                    )}
                    {product.type && (
                      <span className="inline-block rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {product.type}
                      </span>
                    )}
                  </div>
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
                  <span className="text-[9px] font-medium uppercase tracking-wider text-amber-600/60">Dealer</span>
                  <span className="text-xs text-amber-600/80">{formatCurrency((product as Product).cost)}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}
