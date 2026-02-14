"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createItem, updateItem } from "@/lib/actions/items";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";
import { ImageUpload } from "@/components/items/image-upload";
import type { Item } from "@/types";

interface ItemFormProps {
  projectId: string;
  itemNumber: number;
  item?: Item;
  isAdmin: boolean;
}

export function ItemForm({ projectId, itemNumber, item, isAdmin }: ItemFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(item?.image_url ?? null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const input = {
      project_id: projectId,
      item_number: item?.item_number ?? itemNumber,
      item_type: form.get("item_type") as string,
      description: form.get("description") as string,
      item_link: (form.get("item_link") as string) || undefined,
      retail_price: parseFloat(form.get("retail_price") as string) || 0,
      retail_shipping: parseFloat(form.get("retail_shipping") as string) || 0,
      discount_percent: parseFloat(form.get("discount_percent") as string) || 0,
      my_cost: parseFloat(form.get("my_cost") as string) || 0,
      my_shipping: parseFloat(form.get("my_shipping") as string) || 0,
      price_sold_for:
        (form.get("price_sold_for") as string)
          ? parseFloat(form.get("price_sold_for") as string)
          : undefined,
      image_url: imageUrl ?? undefined,
      notes: (form.get("notes") as string) || undefined,
    };

    const result = item
      ? await updateItem(item.id, input)
      : await createItem(input);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(`/projects/${projectId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <div className={formStyles.group}>
          <label htmlFor="item_number" className={formStyles.label}>
            Item #
          </label>
          <input
            id="item_number"
            type="number"
            value={item?.item_number ?? itemNumber}
            readOnly
            className={`${formStyles.input} bg-muted`}
          />
        </div>

        <div className={formStyles.group}>
          <label htmlFor="item_type" className={formStyles.label}>
            Item Type *
          </label>
          <input
            id="item_type"
            name="item_type"
            type="text"
            required
            defaultValue={item?.item_type ?? ""}
            placeholder="e.g. Furniture, Appliance"
            className={formStyles.input}
          />
        </div>

        <div className={formStyles.group}>
          <label htmlFor="item_link" className={formStyles.label}>
            Item Link
          </label>
          <input
            id="item_link"
            name="item_link"
            type="url"
            defaultValue={item?.item_link ?? ""}
            placeholder="https://..."
            className={formStyles.input}
          />
        </div>
      </div>

      <div className={formStyles.group}>
        <label htmlFor="description" className={formStyles.label}>
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          required
          defaultValue={item?.description ?? ""}
          placeholder="Item description..."
          className={formStyles.textarea}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className={formStyles.group}>
          <label htmlFor="retail_price" className={formStyles.label}>
            Retail Price
          </label>
          <input
            id="retail_price"
            name="retail_price"
            type="number"
            step="0.01"
            defaultValue={item?.retail_price ?? 0}
            className={formStyles.input}
          />
        </div>

        <div className={formStyles.group}>
          <label htmlFor="retail_shipping" className={formStyles.label}>
            Retail Shipping
          </label>
          <input
            id="retail_shipping"
            name="retail_shipping"
            type="number"
            step="0.01"
            defaultValue={item?.retail_shipping ?? 0}
            className={formStyles.input}
          />
        </div>

        <div className={formStyles.group}>
          <label htmlFor="discount_percent" className={formStyles.label}>
            Discount % (negative = markup)
          </label>
          <input
            id="discount_percent"
            name="discount_percent"
            type="number"
            step="0.01"
            defaultValue={item?.discount_percent ?? 0}
            className={formStyles.input}
          />
        </div>
      </div>

      {isAdmin && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className={formStyles.group}>
            <label htmlFor="my_cost" className={formStyles.label}>
              My Cost
            </label>
            <input
              id="my_cost"
              name="my_cost"
              type="number"
              step="0.01"
              defaultValue={item?.my_cost ?? 0}
              className={formStyles.input}
            />
          </div>

          <div className={formStyles.group}>
            <label htmlFor="my_shipping" className={formStyles.label}>
              My Shipping
            </label>
            <input
              id="my_shipping"
              name="my_shipping"
              type="number"
              step="0.01"
              defaultValue={item?.my_shipping ?? 0}
              className={formStyles.input}
            />
          </div>
        </div>
      )}

      {!isAdmin && (
        <>
          <input type="hidden" name="my_cost" value="0" />
          <input type="hidden" name="my_shipping" value="0" />
        </>
      )}

      <div className={formStyles.group}>
        <label htmlFor="price_sold_for" className={formStyles.label}>
          Price Sold For
        </label>
        <input
          id="price_sold_for"
          name="price_sold_for"
          type="number"
          step="0.01"
          defaultValue={item?.price_sold_for ?? ""}
          placeholder="Leave blank if not sold yet"
          className={formStyles.input}
        />
      </div>

      <div className={formStyles.group}>
        <label className={formStyles.label}>Image</label>
        <ImageUpload
          currentUrl={item?.image_url}
          onUpload={(url) => setImageUrl(url)}
          onRemove={() => setImageUrl(null)}
        />
      </div>

      <div className={formStyles.group}>
        <label htmlFor="notes" className={formStyles.label}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={item?.notes ?? ""}
          placeholder="Additional notes..."
          className={formStyles.textarea}
        />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={loading} className={buttonStyles.primary}>
          {loading ? "Saving..." : item ? "Update Item" : "Add Item"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className={buttonStyles.secondary}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
