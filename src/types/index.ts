export type UserRole = "admin" | "collaborator" | "client";
export type UserStatus = "pending" | "approved" | "denied";
export type ProjectStatus = "draft" | "quote" | "accepted" | "completed";
export type FulfillmentType = "pickup" | "delivery";
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
  created_at: string;
  updated_at: string;
}

export type ClientItem = Omit<Item, "my_cost" | "my_shipping">;

export interface Product {
  id: string;
  model_number: string;
  name: string;
  type: string;
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
