"use client";

import Image from "next/image";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/form-styles";
import { deleteProduct } from "@/lib/actions/products";
import { useRouter } from "next/navigation";
import { firstImage } from "@/lib/parse-images";
import type { Product, ClientProduct } from "@/types";

interface ProductsGridProps {
  products: (Product | ClientProduct)[];
  isAdmin: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function ProductsGrid({ products, isAdmin }: ProductsGridProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id);
    router.refresh();
  }

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No products yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {products.map((product) => {
        const thumb = firstImage(product.image_url);
        return (
        <div
          key={product.id}
          className="group rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-md hover:border-primary/20 overflow-hidden"
        >
          {/* Image */}
          <div className="relative aspect-square bg-muted/30">
            {thumb ? (
              <Image
                src={thumb}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-2">
            <p className="text-xs font-semibold text-foreground truncate">
              {product.name}
            </p>
            {product.model_number && (
              <p className="text-[10px] text-muted-foreground truncate">
                {product.model_number}
              </p>
            )}

            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xs font-bold text-foreground">
                {formatCurrency(product.sales_price)}
              </span>
              {product.retail_price > 0 && product.retail_price !== product.sales_price && (
                <span className="text-[10px] text-muted-foreground line-through">
                  {formatCurrency(product.retail_price)}
                </span>
              )}
            </div>

            {isAdmin && "cost" in product && (
              <p className="text-[10px] text-amber-600">
                Dealer: {formatCurrency((product as Product).cost)}
              </p>
            )}

            {/* Admin actions */}
            {isAdmin && (
              <div className="mt-1 flex gap-1">
                <Link
                  href={`/catalog/${product.id}`}
                  className={`${buttonStyles.small} !text-[10px] !px-1.5 !py-0.5 text-primary hover:bg-primary/10`}
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(product.id)}
                  className={`${buttonStyles.small} !text-[10px] !px-1.5 !py-0.5 text-destructive hover:bg-destructive/10`}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        );
      })}
    </div>
  );
}
