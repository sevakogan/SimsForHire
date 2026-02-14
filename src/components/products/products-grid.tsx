"use client";

import Image from "next/image";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/form-styles";
import { deleteProduct } from "@/lib/actions/products";
import { useRouter } from "next/navigation";
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
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="group rounded-xl border border-border bg-white shadow-sm transition-all hover:shadow-md hover:border-primary/20 overflow-hidden"
        >
          {/* Image */}
          <div className="relative aspect-square bg-muted/30">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <svg
                  className="h-10 w-10"
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
          <div className="p-3">
            <p className="text-sm font-semibold text-foreground truncate">
              {product.name}
            </p>
            {product.model_number && (
              <p className="text-xs text-muted-foreground truncate">
                {product.model_number}
              </p>
            )}
            {product.type && (
              <p className="text-xs text-muted-foreground">{product.type}</p>
            )}

            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-sm font-bold text-foreground">
                {formatCurrency(product.sales_price)}
              </span>
              {product.retail_price > 0 && product.retail_price !== product.sales_price && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatCurrency(product.retail_price)}
                </span>
              )}
            </div>

            {isAdmin && "cost" in product && (
              <p className="mt-0.5 text-xs text-amber-600">
                Dealer: {formatCurrency((product as Product).cost)}
              </p>
            )}

            {product.manufacturer_website && (
              <a
                href={product.manufacturer_website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-xs text-primary hover:underline truncate"
              >
                Manufacturer ↗
              </a>
            )}

            {/* Admin actions */}
            {isAdmin && (
              <div className="mt-2 flex gap-1">
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
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
