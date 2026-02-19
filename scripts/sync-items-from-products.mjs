/**
 * One-time script: Sync ALL items from their linked products.
 * Run with: node scripts/sync-items-from-products.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env.local manually (no dotenv dependency)
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  console.log("Fetching items with linked products...");

  // Get all items that have a product_id
  const { data: items, error: itemsErr } = await supabase
    .from("items")
    .select("id, product_id, project_id, description, retail_price, price_sold_for, my_cost")
    .not("product_id", "is", null);

  if (itemsErr) {
    console.error("Failed to fetch items:", itemsErr.message);
    process.exit(1);
  }

  console.log(`Found ${items.length} items with linked products`);

  // Get unique product IDs
  const productIds = [...new Set(items.map((i) => i.product_id))];
  console.log(`Linked to ${productIds.length} unique products`);

  // Fetch all products
  const { data: products, error: productsErr } = await supabase
    .from("products")
    .select("id, retail_price, sales_price, cost, shipping, image_url, description, type, seller_merchant, model_number, name")
    .in("id", productIds);

  if (productsErr) {
    console.error("Failed to fetch products:", productsErr.message);
    process.exit(1);
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Update each item
  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    const product = productMap.get(item.product_id);
    if (!product) {
      skipped++;
      continue;
    }

    const { error: updateErr } = await supabase
      .from("items")
      .update({
        retail_price: product.retail_price,
        price_sold_for: product.sales_price,
        my_cost: product.cost,
        retail_shipping: product.shipping,
        image_url: product.image_url,
        description: product.description,
        item_type: product.type,
        seller_merchant: product.seller_merchant,
        model_number: product.model_number,
      })
      .eq("id", item.id);

    if (updateErr) {
      console.error(`  ✗ Failed to update item ${item.id}: ${updateErr.message}`);
    } else {
      updated++;
      console.log(`  ✓ Updated "${item.description}" — cost: $${item.my_cost} → $${product.cost}, selling: $${item.price_sold_for} → $${product.sales_price}`);
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(console.error);
