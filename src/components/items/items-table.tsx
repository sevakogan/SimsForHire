"use client";

import Image from "next/image";
import Link from "next/link";
import { tableStyles, buttonStyles } from "@/components/ui/form-styles";
import { deleteItem } from "@/lib/actions/items";
import { useRouter } from "next/navigation";
import type { Item, ClientItem } from "@/types";

interface ItemsTableProps {
  items: (Item | ClientItem)[];
  projectId: string;
  isAdmin: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function ItemsTable({ items, projectId, isAdmin }: ItemsTableProps) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    await deleteItem(id);
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No items yet.</p>
        {isAdmin && (
          <Link
            href={`/projects/${projectId}/items/new`}
            className={`${buttonStyles.primary} mt-4 inline-flex`}
          >
            Add First Item
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
            <th className={tableStyles.th}>#</th>
            <th className={tableStyles.th}>Image</th>
            <th className={tableStyles.th}>Type</th>
            <th className={tableStyles.th}>Description</th>
            <th className={tableStyles.th}>Retail</th>
            <th className={tableStyles.th}>Shipping</th>
            <th className={tableStyles.th}>Discount</th>
            {isAdmin && <th className={tableStyles.th}>My Cost</th>}
            {isAdmin && <th className={tableStyles.th}>My Ship</th>}
            <th className={tableStyles.th}>Sold For</th>
            {isAdmin && <th className={tableStyles.th}>Actions</th>}
          </tr>
        </thead>
        <tbody className={tableStyles.tbody}>
          {items.map((item) => (
            <tr key={item.id} className={tableStyles.row}>
              <td className={tableStyles.td}>{item.item_number}</td>
              <td className={tableStyles.td}>
                {item.image_url ? (
                  <Image
                    src={item.image_url}
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
              <td className={tableStyles.td}>{item.item_type}</td>
              <td className={`${tableStyles.td} max-w-[200px] truncate`}>
                {item.description}
              </td>
              <td className={tableStyles.td}>
                {formatCurrency(item.retail_price)}
              </td>
              <td className={tableStyles.td}>
                {formatCurrency(item.retail_shipping)}
              </td>
              <td className={tableStyles.td}>{item.discount_percent}%</td>
              {isAdmin && (
                <td className={tableStyles.td}>
                  {formatCurrency((item as Item).my_cost)}
                </td>
              )}
              {isAdmin && (
                <td className={tableStyles.td}>
                  {formatCurrency((item as Item).my_shipping)}
                </td>
              )}
              <td className={tableStyles.td}>
                {item.price_sold_for != null
                  ? formatCurrency(item.price_sold_for)
                  : "--"}
              </td>
              {isAdmin && (
                <td className={tableStyles.td}>
                  <div className="flex gap-1">
                    <Link
                      href={`/projects/${projectId}/items/${item.id}`}
                      className={`${buttonStyles.small} text-primary hover:bg-primary/10`}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id)}
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
