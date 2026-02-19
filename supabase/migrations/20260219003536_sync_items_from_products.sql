-- One-time bulk sync: update ALL items from their linked products.
-- This pushes current product pricing (retail, sales, cost, shipping, etc.)
-- into every item that has a product_id, regardless of project status.

UPDATE items i
SET
  retail_price    = p.retail_price,
  price_sold_for  = p.sales_price,
  my_cost         = p.cost,
  retail_shipping = p.shipping,
  image_url       = p.image_url,
  description     = p.description,
  item_type       = p.type,
  seller_merchant = p.seller_merchant,
  model_number    = p.model_number
FROM products p
WHERE i.product_id = p.id;
