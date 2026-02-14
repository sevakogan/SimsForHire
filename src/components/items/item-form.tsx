"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createItem, updateItem } from "@/lib/actions/items";
import { buttonStyles } from "@/components/ui/form-styles";
import { ImageUpload } from "@/components/items/image-upload";
import type { Item } from "@/types";

interface ItemFormProps {
  projectId: string;
  itemNumber: number;
  item?: Item;
  isAdmin: boolean;
}

const pillLabel = "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";
const pillInput =
  "w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none";
const pillWrapper =
  "flex flex-col gap-0.5 rounded-lg border border-border bg-white px-3 py-1.5 shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20";
const pillWrapperReadonly =
  "flex flex-col gap-0.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 shadow-sm";

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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Row 1: Item #, Type, Link */}
      <div className="flex flex-wrap gap-2">
        <div className={`${pillWrapperReadonly} w-20 shrink-0`}>
          <span className={pillLabel}>#</span>
          <input
            type="number"
            value={item?.item_number ?? itemNumber}
            readOnly
            className={`${pillInput} bg-transparent`}
          />
        </div>

        <div className={`${pillWrapper} min-w-[140px] flex-1`}>
          <label htmlFor="item_type" className={pillLabel}>Type *</label>
          <input
            id="item_type"
            name="item_type"
            type="text"
            required
            defaultValue={item?.item_type ?? ""}
            placeholder="Furniture, Appliance…"
            className={pillInput}
          />
        </div>

        <div className={`${pillWrapper} min-w-[180px] flex-[2]`}>
          <label htmlFor="item_link" className={pillLabel}>Link</label>
          <input
            id="item_link"
            name="item_link"
            type="url"
            defaultValue={item?.item_link ?? ""}
            placeholder="https://…"
            className={pillInput}
          />
        </div>
      </div>

      {/* Row 2: Description */}
      <div className={pillWrapper}>
        <label htmlFor="description" className={pillLabel}>Description *</label>
        <textarea
          id="description"
          name="description"
          rows={2}
          required
          defaultValue={item?.description ?? ""}
          placeholder="Item description…"
          className={`${pillInput} resize-none`}
        />
      </div>

      {/* Row 3: Pricing pills */}
      <div className="flex flex-wrap gap-2">
        <div className={`${pillWrapper} w-28 shrink-0`}>
          <label htmlFor="retail_price" className={pillLabel}>Retail $</label>
          <input
            id="retail_price"
            name="retail_price"
            type="number"
            step="0.01"
            defaultValue={item?.retail_price ?? 0}
            className={pillInput}
          />
        </div>

        <div className={`${pillWrapper} w-28 shrink-0`}>
          <label htmlFor="retail_shipping" className={pillLabel}>Ship $</label>
          <input
            id="retail_shipping"
            name="retail_shipping"
            type="number"
            step="0.01"
            defaultValue={item?.retail_shipping ?? 0}
            className={pillInput}
          />
        </div>

        <div className={`${pillWrapper} w-28 shrink-0`}>
          <label htmlFor="discount_percent" className={pillLabel}>Disc %</label>
          <input
            id="discount_percent"
            name="discount_percent"
            type="number"
            step="0.01"
            defaultValue={item?.discount_percent ?? 0}
            className={pillInput}
          />
        </div>

        <div className={`${pillWrapper} w-28 shrink-0`}>
          <label htmlFor="price_sold_for" className={pillLabel}>Sold $</label>
          <input
            id="price_sold_for"
            name="price_sold_for"
            type="number"
            step="0.01"
            defaultValue={item?.price_sold_for ?? ""}
            placeholder="—"
            className={pillInput}
          />
        </div>
      </div>

      {/* Row 4: Admin-only cost pills */}
      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <div className={`${pillWrapper} w-28 shrink-0 border-amber-200 bg-amber-50/50`}>
            <label htmlFor="my_cost" className={`${pillLabel} text-amber-700`}>My Cost</label>
            <input
              id="my_cost"
              name="my_cost"
              type="number"
              step="0.01"
              defaultValue={item?.my_cost ?? 0}
              className={pillInput}
            />
          </div>

          <div className={`${pillWrapper} w-28 shrink-0 border-amber-200 bg-amber-50/50`}>
            <label htmlFor="my_shipping" className={`${pillLabel} text-amber-700`}>My Ship</label>
            <input
              id="my_shipping"
              name="my_shipping"
              type="number"
              step="0.01"
              defaultValue={item?.my_shipping ?? 0}
              className={pillInput}
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

      {/* Row 5: Image + Notes side by side */}
      <div className="flex flex-wrap gap-2">
        <div className={`${pillWrapper} min-w-[160px] flex-1`}>
          <label className={pillLabel}>Image</label>
          <ImageUpload
            currentUrl={item?.image_url}
            onUpload={(url) => setImageUrl(url)}
            onRemove={() => setImageUrl(null)}
          />
        </div>

        <div className={`${pillWrapper} min-w-[200px] flex-[2]`}>
          <label htmlFor="notes" className={pillLabel}>Notes</label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={item?.notes ?? ""}
            placeholder="Additional notes…"
            className={`${pillInput} resize-none`}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading} className={buttonStyles.primary}>
          {loading ? "Saving…" : item ? "Update Item" : "Add Item"}
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
