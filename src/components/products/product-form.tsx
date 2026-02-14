"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { buttonStyles } from "@/components/ui/form-styles";
import {
  pillLabel,
  pillInput,
  pillWrapper,
  pillWrapperAdmin,
  pillLabelAdmin,
} from "@/components/ui/pill-styles";
import { MultiImageUpload } from "@/components/items/multi-image-upload";
import { TypeTagPicker } from "@/components/products/type-tag-picker";
import type { Product } from "@/types";

interface ProductFormProps {
  product?: Product;
  isAdmin: boolean;
}

function parseImages(imageUrl: string | null | undefined): string[] {
  if (!imageUrl) return [];
  try {
    const parsed = JSON.parse(imageUrl);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Not JSON — treat as single URL
  }
  return imageUrl ? [imageUrl] : [];
}

export function ProductForm({ product, isAdmin }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>(
    parseImages(product?.image_url)
  );
  const [type, setType] = useState(product?.type ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    const imageUrl =
      images.length === 0
        ? undefined
        : images.length === 1
          ? images[0]
          : JSON.stringify(images);

    const input = {
      model_number: (form.get("model_number") as string) || "",
      name: (form.get("name") as string) || "",
      type,
      description: (form.get("name") as string) || "",
      retail_price: parseFloat(form.get("retail_price") as string) || 0,
      cost: parseFloat(form.get("cost") as string) || 0,
      sales_price: parseFloat(form.get("sales_price") as string) || 0,
      shipping: parseFloat(form.get("shipping") as string) || 0,
      image_url: imageUrl,
      notes: (form.get("notes") as string) || undefined,
      manufacturer_website:
        (form.get("manufacturer_website") as string) || undefined,
    };

    const result = product
      ? await updateProduct(product.id, input)
      : await createProduct(input);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/catalog");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Row 1: Type tag picker */}
      <div>
        <p className={`${pillLabel} mb-1.5`}>Type</p>
        <TypeTagPicker value={type} onChange={setType} />
      </div>

      {/* Row 2: Model# (small) | Name | Retail | Wholesale | Sale | S/H — one line */}
      <div className="flex flex-wrap gap-2">
        <div className={`${pillWrapper} w-24 shrink-0`}>
          <label htmlFor="model_number" className={pillLabel}>
            Model #
          </label>
          <input
            id="model_number"
            name="model_number"
            type="text"
            defaultValue={product?.model_number ?? ""}
            placeholder="Model…"
            className={pillInput}
          />
        </div>

        <div className={`${pillWrapper} min-w-[140px] flex-1`}>
          <label htmlFor="name" className={pillLabel}>
            Name *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={product?.name ?? ""}
            placeholder="Product name…"
            className={pillInput}
          />
        </div>

        <div className={`${pillWrapper} w-24 shrink-0`}>
          <label htmlFor="retail_price" className={pillLabel}>
            Retail
          </label>
          <input
            id="retail_price"
            name="retail_price"
            type="number"
            step="0.01"
            defaultValue={product?.retail_price ?? 0}
            className={pillInput}
          />
        </div>

        {isAdmin && (
          <div className={`${pillWrapperAdmin} w-24 shrink-0`}>
            <label htmlFor="cost" className={pillLabelAdmin}>
              Wholesale
            </label>
            <input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              defaultValue={product?.cost ?? 0}
              className={pillInput}
            />
          </div>
        )}

        <div className={`${pillWrapper} w-24 shrink-0`}>
          <label htmlFor="sales_price" className={pillLabel}>
            Sale Price
          </label>
          <input
            id="sales_price"
            name="sales_price"
            type="number"
            step="0.01"
            defaultValue={product?.sales_price ?? 0}
            className={pillInput}
          />
        </div>

        <div className={`${pillWrapper} w-20 shrink-0`}>
          <label htmlFor="shipping" className={pillLabel}>
            S/H
          </label>
          <input
            id="shipping"
            name="shipping"
            type="number"
            step="0.01"
            defaultValue={product?.shipping ?? 0}
            className={pillInput}
          />
        </div>
      </div>

      {!isAdmin && <input type="hidden" name="cost" value="0" />}

      {/* Row 3: URL | Notes */}
      <div className="flex flex-wrap gap-2">
        <div className={`${pillWrapper} min-w-[180px] flex-1`}>
          <label htmlFor="manufacturer_website" className={pillLabel}>
            URL
          </label>
          <input
            id="manufacturer_website"
            name="manufacturer_website"
            type="url"
            defaultValue={product?.manufacturer_website ?? ""}
            placeholder="https://…"
            className={`${pillInput} text-xs`}
          />
        </div>

        <div className={`${pillWrapper} min-w-[200px] flex-[2]`}>
          <label htmlFor="notes" className={pillLabel}>
            Notes
          </label>
          <input
            id="notes"
            name="notes"
            type="text"
            defaultValue={product?.notes ?? ""}
            placeholder="Additional notes…"
            className={pillInput}
          />
        </div>
      </div>

      {/* Row 4: Image upload (up to 8) */}
      <div>
        <p className={`${pillLabel} mb-1.5`}>Images (up to 8)</p>
        <MultiImageUpload images={images} onChange={setImages} max={8} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className={buttonStyles.primary}
        >
          {loading ? "Saving…" : product ? "Update Product" : "Add Product"}
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
