"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createItem, updateItem } from "@/lib/actions/items";
import { buttonStyles } from "@/components/ui/form-styles";
import {
  pillLabel,
  pillInput,
  pillWrapper,
  pillWrapperReadonly,
  pillWrapperAdmin,
  pillLabelAdmin,
} from "@/components/ui/pill-styles";
import { ImageUpload } from "@/components/items/image-upload";
import { ProductSearch } from "@/components/products/product-search";
import { TypeTagPicker } from "@/components/products/type-tag-picker";
import { scrapeProductUrl } from "@/lib/actions/scrape";
import { SellerAutocomplete } from "@/components/ui/seller-autocomplete";
import type { Item, ProductSearchResult, ProductCategory } from "@/types";

interface ItemFormProps {
  projectId: string;
  itemNumber: number;
  item?: Item;
  isAdmin: boolean;
  /** When provided, called instead of router.back() on save/cancel */
  onDone?: () => void;
}

interface FormFields {
  model_number: string;
  item_type: string;
  description: string;
  item_link: string;
  retail_price: string;
  retail_shipping: string;
  discount_percent: string;
  my_cost: string;
  my_shipping: string;
  price_sold_for: string;
  notes: string;
  seller_merchant: string;
}

function buildInitialFields(item?: Item): FormFields {
  return {
    model_number: item?.model_number ?? "",
    item_type: item?.item_type ?? "",
    description: item?.description ?? "",
    item_link: item?.item_link ?? "",
    retail_price: String(item?.retail_price ?? 0),
    retail_shipping: String(item?.retail_shipping ?? 0),
    discount_percent: String(item?.discount_percent ?? 0),
    my_cost: String(item?.my_cost ?? 0),
    my_shipping: String(item?.my_shipping ?? 0),
    price_sold_for: item?.price_sold_for != null ? String(item.price_sold_for) : "",
    notes: item?.notes ?? "",
    seller_merchant: item?.seller_merchant ?? "",
  };
}

export function ItemForm({ projectId, itemNumber, item, isAdmin, onDone }: ItemFormProps) {
  const router = useRouter();
  const close = onDone ?? (() => router.back());
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(item?.image_url ?? null);
  const [fields, setFields] = useState<FormFields>(() => buildInitialFields(item));
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null);
  const [productId, setProductId] = useState<string | null>(item?.product_id ?? null);
  const [category, setCategory] = useState<ProductCategory>(item?.category ?? "product");

  function updateField(name: keyof FormFields, value: string) {
    setFields((prev) => ({ ...prev, [name]: value }));
  }

  function handleProductSelect(product: ProductSearchResult) {
    setSelectedProduct(product);
    setProductId(product.id);
    setCategory(product.category ?? "product");

    setFields((prev) => ({
      ...prev,
      model_number: product.model_number || prev.model_number,
      item_type: product.type || prev.item_type,
      description: product.description || prev.description,
      item_link: "",
      retail_price: String(product.retail_price),
      retail_shipping: String(product.shipping),
      price_sold_for: String(product.sales_price),
      my_cost: product.cost != null ? String(product.cost) : prev.my_cost,
      seller_merchant: product.seller_merchant || prev.seller_merchant,
    }));

    if (product.image_url) {
      setImageUrl(product.image_url);
    }
  }

  function handleProductClear() {
    setSelectedProduct(null);
    setProductId(null);
    setCategory("product");
  }

  function handleUrlApprove() {
    const url = fields.item_link.trim();
    if (!url) return;

    setScraping(true);
    setError(null);

    scrapeProductUrl(url)
      .then((result) => {
        if (result.error) {
          setError(result.error);
          return;
        }

        // Only fill empty fields
        setFields((prev) => ({
          ...prev,
          description: result.title && !prev.description.trim()
            ? result.title
            : prev.description,
        }));

        // Set image if empty — use functional check to avoid stale closure
        if (result.images.length > 0) {
          setImageUrl((prev) => prev ? prev : result.images[0]);
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
    updateField("item_link", "");
    setScraping(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const parsedRetail = parseFloat(fields.retail_price);
      const parsedShipping = parseFloat(fields.retail_shipping);
      const parsedDiscount = parseFloat(fields.discount_percent);
      const parsedMyCost = parseFloat(fields.my_cost);
      const parsedMyShipping = parseFloat(fields.my_shipping);
      const parsedSoldFor = fields.price_sold_for
        ? parseFloat(fields.price_sold_for)
        : null;

      const updatePayload: Record<string, unknown> = {
        model_number: fields.model_number || "",
        item_type: fields.item_type,
        category,
        description: fields.description,
        item_link: fields.item_link || null,
        retail_price: isNaN(parsedRetail) ? 0 : parsedRetail,
        retail_shipping: isNaN(parsedShipping) ? 0 : parsedShipping,
        discount_percent: isNaN(parsedDiscount) ? 0 : parsedDiscount,
        my_cost: isNaN(parsedMyCost) ? 0 : parsedMyCost,
        my_shipping: isNaN(parsedMyShipping) ? 0 : parsedMyShipping,
        price_sold_for: parsedSoldFor !== null && !isNaN(parsedSoldFor) ? parsedSoldFor : null,
        image_url: imageUrl ?? null,
        notes: fields.notes || "",
        seller_merchant: fields.seller_merchant || "",
        product_id: productId,
      };

      const currentItemNumber = item?.item_number ?? itemNumber;

      const result = item
        ? await updateItem(item.id, updatePayload)
        : await createItem({
            ...updatePayload,
            project_id: projectId,
            item_number: currentItemNumber,
          } as Parameters<typeof createItem>[0]);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Product Search — only shown when creating new items */}
      {!item && (
        <ProductSearch
          onSelect={handleProductSelect}
          onClear={handleProductClear}
          selectedProduct={selectedProduct}
          isAdmin={isAdmin}
        />
      )}

      {/* Row 1: Type tag picker */}
      <div>
        <p className={`${pillLabel} mb-1.5`}>Type</p>
        <TypeTagPicker
          value={fields.item_type}
          onChange={(val) => updateField("item_type", val)}
        />
      </div>

      {/* Row 2: # | Model # | Description | Link */}
      <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap">
        <div className={`${pillWrapperReadonly} sm:w-16 sm:shrink-0`}>
          <span className={pillLabel}>#</span>
          <input
            type="number"
            value={item?.item_number ?? itemNumber}
            readOnly
            className={`${pillInput} bg-transparent`}
          />
        </div>

        <div className={`${pillWrapper} col-span-3 sm:w-28 sm:shrink-0`}>
          <label htmlFor="model_number" className={pillLabel}>Model #</label>
          <input
            id="model_number"
            name="model_number"
            type="text"
            value={fields.model_number}
            onChange={(e) => updateField("model_number", e.target.value)}
            placeholder="Model…"
            className={pillInput}
          />
        </div>

        <div className={`${pillWrapper} col-span-4 sm:min-w-[160px] sm:flex-1`}>
          <label htmlFor="description" className={pillLabel}>Description *</label>
          <input
            id="description"
            name="description"
            type="text"
            required
            value={fields.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Item description…"
            className={pillInput}
          />
        </div>

        <div className={`${pillWrapper} col-span-4 sm:min-w-[140px] sm:flex-1`}>
          <label htmlFor="item_link" className={pillLabel}>Link</label>
          <div className="flex items-center gap-1">
            <input
              id="item_link"
              name="item_link"
              type="text"
              value={fields.item_link}
              onChange={(e) => updateField("item_link", e.target.value)}
              placeholder="https://…"
              className={`${pillInput} flex-1`}
            />
            {fields.item_link.trim() && (
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

      {/* Row 3: Seller/Merchant | Retail Cost | Wholesale % | Wholesale Cost (admin) | Sale Price | S/H */}
      <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        <div className={`${pillWrapper} col-span-3 sm:w-32 sm:shrink-0`}>
          <label htmlFor="seller_merchant" className={pillLabel}>Seller/Merchant</label>
          <SellerAutocomplete
            value={fields.seller_merchant}
            onChange={(v) => updateField("seller_merchant", v)}
            placeholder="Seller…"
            className={pillInput}
          />
        </div>

        <div className={`${pillWrapper} sm:w-24 sm:shrink-0`}>
          <label htmlFor="retail_price" className={pillLabel}>Retail Cost</label>
          <input
            id="retail_price"
            name="retail_price"
            type="number"
            step="0.01"
            value={fields.retail_price}
            onChange={(e) => updateField("retail_price", e.target.value)}
            className={pillInput}
          />
        </div>

        <div className={`${pillWrapper} sm:w-24 sm:shrink-0`}>
          <label htmlFor="discount_percent" className={pillLabel}>Wholesale %</label>
          <input
            id="discount_percent"
            name="discount_percent"
            type="number"
            step="0.01"
            value={fields.discount_percent}
            onChange={(e) => updateField("discount_percent", e.target.value)}
            className={pillInput}
          />
        </div>

        {isAdmin && (
          <div className={`${pillWrapperAdmin} sm:w-28 sm:shrink-0`}>
            <label htmlFor="my_cost" className={pillLabelAdmin}>Wholesale Cost</label>
            <input
              id="my_cost"
              name="my_cost"
              type="number"
              step="0.01"
              value={fields.my_cost}
              onChange={(e) => updateField("my_cost", e.target.value)}
              className={pillInput}
            />
          </div>
        )}

        <div className={`${pillWrapper} sm:w-24 sm:shrink-0`}>
          <label htmlFor="price_sold_for" className={pillLabel}>Sale Price</label>
          <input
            id="price_sold_for"
            name="price_sold_for"
            type="number"
            step="0.01"
            value={fields.price_sold_for}
            onChange={(e) => updateField("price_sold_for", e.target.value)}
            placeholder="—"
            className={pillInput}
          />
        </div>

        <div className={`${pillWrapper} sm:w-20 sm:shrink-0`}>
          <label htmlFor="retail_shipping" className={pillLabel}>S/H</label>
          <input
            id="retail_shipping"
            name="retail_shipping"
            type="number"
            step="0.01"
            value={fields.retail_shipping}
            onChange={(e) => updateField("retail_shipping", e.target.value)}
            className={pillInput}
          />
        </div>

      </div>

      {!isAdmin && (
        <input type="hidden" name="my_cost" value="0" />
      )}
      <input type="hidden" name="my_shipping" value={fields.my_shipping} />

      {/* Row 4: Notes */}
      <div className={pillWrapper}>
        <label htmlFor="notes" className={pillLabel}>Notes</label>
        <input
          id="notes"
          name="notes"
          type="text"
          value={fields.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="Additional notes…"
          className={pillInput}
        />
      </div>

      {/* Row 5: Image */}
      <div>
        <p className={`${pillLabel} mb-1.5`}>Image</p>
        <ImageUpload
          currentUrl={imageUrl}
          onUpload={(url) => setImageUrl(url)}
          onRemove={() => setImageUrl(null)}
          onUploadingChange={setUploading}
        />
      </div>

      {/* Actions — right-aligned, small buttons */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={close}
          className={`${buttonStyles.small} border border-border text-muted-foreground hover:bg-muted hover:text-foreground`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || uploading}
          className={`${buttonStyles.small} bg-primary text-white shadow-sm hover:bg-primary-hover disabled:opacity-50`}
        >
          {loading ? "Saving…" : uploading ? "Uploading…" : item ? "Done" : "Add Item"}
        </button>
      </div>
    </form>
  );
}
