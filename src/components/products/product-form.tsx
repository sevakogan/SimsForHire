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
import { ImageUpload } from "@/components/items/image-upload";
import type { Product } from "@/types";

interface ProductFormProps {
  product?: Product;
  isAdmin: boolean;
}

export function ProductForm({ product, isAdmin }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(
    product?.image_url ?? null
  );

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

      {/* Row 1: Model # | Name */}
      <div className="flex flex-wrap gap-2">
        <div className={`${pillWrapper} min-w-[140px] flex-1`}>
          <label htmlFor="model_number" className={pillLabel}>
            Model #
          </label>
          <input
            id="model_number"
            name="model_number"
            type="text"
            defaultValue={product?.model_number ?? ""}
            placeholder="Model number…"
            className={pillInput}
          />
        </div>

        <div className={`${pillWrapper} min-w-[180px] flex-[2]`}>
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
      </div>

      {/* Row 2: Type */}
      <div className={`${pillWrapper} max-w-[300px]`}>
        <label htmlFor="type" className={pillLabel}>
          Type
        </label>
        <input
          id="type"
          name="type"
          type="text"
          defaultValue={product?.type ?? ""}
          placeholder="Furniture, Appliance…"
          className={pillInput}
        />
      </div>

      {/* Row 3: Description */}
      <div className={pillWrapper}>
        <label htmlFor="description" className={pillLabel}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={product?.description ?? ""}
          placeholder="Product description…"
          className={`${pillInput} resize-none`}
        />
      </div>

      {/* Row 4: Retail Price | Sales Price | Dealer Price (admin only) */}
      <div className="flex flex-wrap gap-2">
        <div className={`${pillWrapper} w-32 shrink-0`}>
          <label htmlFor="retail_price" className={pillLabel}>
            Retail Price
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

        <div className={`${pillWrapper} w-32 shrink-0`}>
          <label htmlFor="sales_price" className={pillLabel}>
            Sales Price
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

        {isAdmin && (
          <div className={`${pillWrapperAdmin} w-32 shrink-0`}>
            <label htmlFor="cost" className={pillLabelAdmin}>
              Dealer Price
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
      </div>

      {!isAdmin && <input type="hidden" name="cost" value="0" />}

      {/* Row 5: S/H */}
      <div className={`${pillWrapper} w-32`}>
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

      {/* Row 6: Manufacturer Website */}
      <div className={`${pillWrapper}`}>
        <label htmlFor="manufacturer_website" className={pillLabel}>
          Manufacturer Website
        </label>
        <input
          id="manufacturer_website"
          name="manufacturer_website"
          type="url"
          defaultValue={product?.manufacturer_website ?? ""}
          placeholder="https://…"
          className={`${pillInput} text-xs`}
        />
        {product?.manufacturer_website && (
          <a
            href={product.manufacturer_website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            {product.manufacturer_website}
          </a>
        )}
      </div>

      {/* Row 7: Image + Notes */}
      <div className="flex flex-wrap gap-2">
        <div className={`${pillWrapper} min-w-[160px] flex-1`}>
          <label className={pillLabel}>Image</label>
          <ImageUpload
            currentUrl={product?.image_url}
            onUpload={(url) => setImageUrl(url)}
            onRemove={() => setImageUrl(null)}
          />
        </div>

        <div className={`${pillWrapper} min-w-[200px] flex-[2]`}>
          <label htmlFor="notes" className={pillLabel}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={product?.notes ?? ""}
            placeholder="Additional notes…"
            className={`${pillInput} resize-none`}
          />
        </div>
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
