"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { scrapeProductUrl } from "@/lib/actions/scrape";
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
import { parseImages } from "@/lib/parse-images";
import type { Product } from "@/types";

interface ProductFormProps {
  product?: Product;
  isAdmin: boolean;
}

export function ProductForm({ product, isAdmin }: ProductFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>(
    parseImages(product?.image_url)
  );
  const [type, setType] = useState(product?.type ?? "");
  const [urlValue, setUrlValue] = useState(product?.manufacturer_website ?? "");

  function handleUrlApprove() {
    const form = formRef.current;
    if (!form) return;

    const url = urlValue.trim();
    if (!url) return;

    // Fire-and-forget: fetch in background while user continues working
    setScraping(true);
    setError(null);

    scrapeProductUrl(url)
      .then((result) => {
        if (result.error) {
          setError(result.error);
          return;
        }

        const currentForm = formRef.current;
        if (!currentForm) return;

        // Only fill empty fields — don't overwrite user-entered data
        const nameInput = currentForm.elements.namedItem("name") as HTMLInputElement;
        const descInput = currentForm.elements.namedItem("description") as HTMLInputElement;

        if (result.title && !nameInput.value.trim()) {
          nameInput.value = result.title;
        }

        if (result.description && !descInput.value.trim()) {
          descInput.value = result.description;
        }

        // Add first scraped image only (user can manually upload more)
        if (result.images.length > 0 && images.length === 0) {
          setImages([result.images[0]]);
        }
      })
      .catch(() => {
        setError("Failed to fetch product info.");
      })
      .finally(() => {
        setScraping(false);
      });
  }

  function handleUrlReject() {
    setUrlValue("");
    setScraping(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
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
        description: (form.get("description") as string) || (form.get("name") as string) || "",
        retail_price: parseFloat(form.get("retail_price") as string) || 0,
        cost: parseFloat(form.get("cost") as string) || 0,
        sales_price: parseFloat(form.get("sales_price") as string) || 0,
        shipping: parseFloat(form.get("shipping") as string) || 0,
        image_url: imageUrl,
        notes: (form.get("notes") as string) || undefined,
        manufacturer_website: urlValue.trim() || undefined,
        seller_merchant:
          (form.get("seller_merchant") as string) || "",
      };

      const result = product
        ? await updateProduct(product.id, input)
        : await createProduct(input);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push("/catalog");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
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

      {/* Row 2: Model # | Name | Description */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <div className={`${pillWrapper} sm:w-28 sm:shrink-0`}>
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

        <div className={`${pillWrapper} sm:w-32 sm:shrink-0`}>
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

        <div className={`${pillWrapper} col-span-2 sm:min-w-[160px] sm:flex-1`}>
          <label htmlFor="description" className={pillLabel}>
            Description
          </label>
          <input
            id="description"
            name="description"
            type="text"
            defaultValue={product?.description ?? ""}
            placeholder="Description…"
            className={pillInput}
          />
        </div>
      </div>

      {/* Row 3: Seller/Merchant | Retail | Wholesale | Sale Price | S/H | URL + Fetch */}
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        <div className={`${pillWrapper} col-span-3 sm:w-32 sm:shrink-0`}>
          <label htmlFor="seller_merchant" className={pillLabel}>
            Seller/Merchant
          </label>
          <input
            id="seller_merchant"
            name="seller_merchant"
            type="text"
            defaultValue={product?.seller_merchant ?? ""}
            placeholder="Seller…"
            className={pillInput}
          />
        </div>

        <div className={`${pillWrapper} sm:w-24 sm:shrink-0`}>
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
          <div className={`${pillWrapperAdmin} sm:w-24 sm:shrink-0`}>
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

        <div className={`${pillWrapper} sm:w-24 sm:shrink-0`}>
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

        <div className={`${pillWrapper} sm:w-20 sm:shrink-0`}>
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

        <div className={`${pillWrapper} col-span-2 sm:min-w-[140px] sm:flex-1`}>
          <label htmlFor="manufacturer_website" className={pillLabel}>
            URL
          </label>
          <div className="flex items-center gap-1">
            <input
              id="manufacturer_website"
              name="manufacturer_website"
              type="text"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://…"
              className={`${pillInput} flex-1`}
            />
            {urlValue.trim() && (
              <>
                {scraping ? (
                  <div className="shrink-0 rounded-full p-1" title="Fetching…">
                    <svg className="h-4 w-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                ) : (
                  <>
                    {/* Green check — fetch product info */}
                    <button
                      type="button"
                      onClick={handleUrlApprove}
                      disabled={loading}
                      className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                      title="Fetch product info from URL"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    </button>
                    {/* Red X — clear URL */}
                    <button
                      type="button"
                      onClick={handleUrlReject}
                      disabled={loading}
                      className="shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Clear URL"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {!isAdmin && <input type="hidden" name="cost" value="0" />}

      {/* Row 4: Notes */}
      <div className={pillWrapper}>
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

      {/* Row 4: Image upload (up to 8) */}
      <div>
        <p className={`${pillLabel} mb-1.5`}>Images (up to 8)</p>
        <MultiImageUpload images={images} onChange={setImages} max={8} />
      </div>

      {/* Actions — right-aligned, small buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          className={`${buttonStyles.small} border border-border text-muted-foreground hover:bg-muted hover:text-foreground`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className={`${buttonStyles.small} bg-primary text-white shadow-sm hover:bg-primary-hover disabled:opacity-50`}
        >
          {loading ? "Saving…" : product ? "Update Product" : "Add Product"}
        </button>
      </div>
    </form>
  );
}
