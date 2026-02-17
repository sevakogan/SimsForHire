export type UserRole = "admin" | "collaborator" | "client" | "employee";
export type UserStatus = "pending" | "approved" | "denied";
export type ProjectStatus = "draft" | "quote" | "submitted" | "accepted" | "paid" | "preparing" | "shipped" | "received" | "completed";
export type FulfillmentType = "pickup" | "delivery" | "white_glove";
export type DiscountType = "percent" | "amount";
export type AcceptanceStatus = "pending" | "accepted" | "rejected";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  client_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  name: string;
  status: ProjectStatus;
  invoice_number: string | null;
  invoice_link: string | null;
  invoice_link_2: string | null;
  date_required: string | null;
  fulfillment_type: FulfillmentType;
  notes: string;
  tax_percent: number;
  discount_percent: number;
  discount_type: DiscountType;
  discount_amount: number;
  share_token: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: string;
  project_id: string;
  item_number: number;
  item_type: string;
  category: ProductCategory;
  description: string;
  item_link: string | null;
  retail_price: number;
  retail_shipping: number;
  discount_percent: number;
  my_cost: number;
  my_shipping: number;
  price_sold_for: number | null;
  image_url: string | null;
  notes: string;
  model_number: string;
  product_id: string | null;
  quantity: number;
  seller_merchant: string;
  acceptance_status: AcceptanceStatus;
  client_note: string | null;
  client_note_read_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientItem = Omit<Item, "my_cost" | "my_shipping">;

export type ProductCategory = "product" | "service";

export interface Product {
  id: string;
  model_number: string;
  name: string;
  type: string;
  category: ProductCategory;
  description: string;
  retail_price: number;
  cost: number;
  sales_price: number;
  shipping: number;
  image_url: string | null;
  notes: string;
  manufacturer_website: string | null;
  seller_merchant: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ClientProduct = Omit<Product, "cost">;

export interface ProductSearchResult {
  id: string;
  model_number: string;
  name: string;
  type: string;
  category: ProductCategory;
  description: string;
  retail_price: number;
  cost?: number;
  sales_price: number;
  shipping: number;
  image_url: string | null;
  seller_merchant: string;
}

export function isAdminRole(role: UserRole): boolean {
  return role === "admin" || role === "collaborator";
}

/** Returns true for roles that can see the internal dashboard (admin, collaborator, employee) */
export function isInternalRole(role: UserRole): boolean {
  return role === "admin" || role === "collaborator" || role === "employee";
}

/** Returns true specifically for the employee role */
export function isEmployeeRole(role: UserRole): boolean {
  return role === "employee";
}

// Shipments
export type ShipmentStatus = "label_created" | "in_transit" | "out_for_delivery" | "delivered";

export interface Shipment {
  id: string;
  project_id: string;
  carrier_name: string;
  tracking_url: string;
  tracking_number: string;
  status: ShipmentStatus;
  notes: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Contact Messages
export interface ContactMessage {
  id: string;
  project_id: string;
  sender_name: string;
  sender_email: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

// Payments
export type PaymentMethod = "card" | "us_bank_account" | "cashapp";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded" | "expired";

export interface PaymentSettings {
  id: string;
  stripe_publishable_key: string;
  stripe_secret_key: string;
  stripe_webhook_secret: string;
  payments_enabled: boolean;
  accepted_payment_methods: PaymentMethod[];
  updated_at: string;
}

export interface Payment {
  id: string;
  project_id: string;
  stripe_session_id: string;
  stripe_payment_intent_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  customer_email: string | null;
  created_at: string;
  updated_at: string;
}
