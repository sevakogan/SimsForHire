"use client";

import Image from "next/image";
import Link from "next/link";
import { tableStyles, buttonStyles } from "@/components/ui/form-styles";
import { deleteProduct } from "@/lib/actions/products";
import { useRouter } from "next/navigation";
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
    <div className={tableStyles.wrapper}>
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
          {products.map((product) => (
            <tr key={product.id} className={tableStyles.row}>
              <td className={tableStyles.td}>
                {product.image_url ? (
                  <Image
                    src={product.image_url}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
