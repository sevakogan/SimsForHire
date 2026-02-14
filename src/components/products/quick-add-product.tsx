"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct } from "@/lib/actions/products";
import {
  pillLabel,
  pillInput,
  pillWrapper,
  pillWrapperAdmin,
  pillLabelAdmin,
} from "@/components/ui/pill-styles";
import { ImageUpload } from "@/components/items/image-upload";

interface QuickAddProductProps {
  isAdmin: boolean;
}

export function QuickAddProduct({ isAdmin }: QuickAddProductProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const input = {
      model_number: (form.get("model_number") as string) || "",
      name: (form.get("name") as string) || "",
      type: (form.get("type") as string) || "",
      description: (form.get("description") as string) || "",
      retail_price: parseFloat(form.get("retail_price") as string) || 0,
      cost: parseFloat(form.get("cost") as string) || 0,
      sales_price: parseFloat(form.get("sales_price") as string) || 0,
      shipping: parseFloat(form.get("shipping") as string) || 0,
      image_url: imageUrl ?? undefined,
      notes: (form.get("notes") as string) || undefined,
      manufacturer_website:
        (form.get("manufacturer_website") as string) || undefined,
    };

    const result = await createProduct(input);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Reset form
    setIsOpen(false);
    setImageUrl(null);
    setError(null);
    router.refresh();
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border bg-white px-4 py-3 text-left transition-all hover:border-primary/40 hover:bg-muted/30"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </div>
        <span className="text-sm text-muted-foreground">Add a product</span>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Row 1: Name | Model # | Type — all equal short */}
        <div className="flex flex-wrap gap-2">
          <div className={`${pillWrapper} min-w-[120px] flex-1`}>
            <label htmlFor="qa_name" className={pillLabel}>
              Name *
            </label>
            <input
              id="qa_name"
              name="name"
              type="text"
              required
              autoFocus
              placeholder="Product name…"
              className={pillInput}
            />
          </div>

          <div className={`${pillWrapper} min-w-[120px] flex-1`}>
            <label htmlFor="qa_model" className={pillLabel}>
              Model #
            </label>
            <input
              id="qa_model"
              name="model_number"
              type="text"
              placeholder="Model…"
              className={pillInput}
            />
          </div>

          <div className={`${pillWrapper} min-w-[120px] flex-1`}>
            <label htmlFor="qa_type" className={pillLabel}>
              Type
            </label>
            <input
              id="qa_type"
              name="type"
              type="text"
              placeholder="Furniture…"
              className={pillInput}
            />
          </div>
        </div>

        {/* Row 2: Description — 2x width of a short field */}
        <div className="flex gap-2">
          <div className={`${pillWrapper} flex-[2] min-w-[240px]`}>
            <label htmlFor="qa_description" className={pillLabel}>
              Description
            </label>
            <input
              id="qa_description"
              name="description"
              type="text"
              placeholder="Brief description…"
              className={pillInput}
            />
          </div>
          <div className="flex-1" />
        </div>

        {/* Row 3: Prices */}
        <div className="flex flex-wrap gap-2">
          <div className={`${pillWrapper} w-28 shrink-0`}>
            <label htmlFor="qa_retail" className={pillLabel}>
              Retail $
            </label>
            <input
              id="qa_retail"
              name="retail_price"
              type="number"
              step="0.01"
              defaultValue={0}
              className={pillInput}
            />
          </div>

          <div className={`${pillWrapper} w-28 shrink-0`}>
            <label htmlFor="qa_sales" className={pillLabel}>
              Sales $
            </label>
            <input
              id="qa_sales"
              name="sales_price"
              type="number"
              step="0.01"
              defaultValue={0}
              className={pillInput}
            />
          </div>

          {isAdmin && (
            <div className={`${pillWrapperAdmin} w-28 shrink-0`}>
              <label htmlFor="qa_cost" className={pillLabelAdmin}>
                Dealer $
              </label>
              <input
                id="qa_cost"
                name="cost"
                type="number"
                step="0.01"
                defaultValue={0}
                className={pillInput}
              />
            </div>
          )}

          <div className={`${pillWrapper} w-28 shrink-0`}>
            <label htmlFor="qa_shipping" className={pillLabel}>
              S/H
            </label>
            <input
              id="qa_shipping"
              name="shipping"
              type="number"
              step="0.01"
              defaultValue={0}
              className={pillInput}
            />
          </div>
        </div>

        {!isAdmin && <input type="hidden" name="cost" value="0" />}

        {/* Row 4: Website | Image | Notes */}
        <div className="flex flex-wrap gap-2">
          <div className={`${pillWrapper} min-w-[160px] flex-1`}>
            <label htmlFor="qa_website" className={pillLabel}>
              Manufacturer Website
            </label>
            <input
              id="qa_website"
              name="manufacturer_website"
              type="url"
              placeholder="https://…"
              className={`${pillInput} text-xs`}
            />
          </div>

          <div className={`${pillWrapper} min-w-[120px]`}>
            <label className={pillLabel}>Image</label>
            <ImageUpload
              currentUrl={null}
              onUpload={(url) => setImageUrl(url)}
              onRemove={() => setImageUrl(null)}
            />
          </div>

          <div className={`${pillWrapper} min-w-[160px] flex-1`}>
            <label htmlFor="qa_notes" className={pillLabel}>
              Notes
            </label>
            <input
              id="qa_notes"
              name="notes"
              type="text"
              placeholder="Notes…"
              className={pillInput}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? "Adding…" : "Add Product"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              setError(null);
              setImageUrl(null);
            }}
            className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
