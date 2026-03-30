export type UserRole = "admin" | "collaborator" | "client" | "employee";
export type UserStatus = "pending" | "approved" | "denied";
export type ProjectStatus = "draft" | "quote" | "submitted" | "accepted" | "paid" | "preparing" | "shipped" | "received" | "completed" | "archived";
export type FulfillmentType = "pickup" | "delivery" | "white_glove";
export type DiscountType = "percent" | "amount";
export type AcceptanceStatus = "pending" | "accepted" | "rejected";

// Leads (from Astro marketing frontend)
export type LeadSource = "rent" | "lease" | "popup";
export type LeadStatus = "new" | "replied" | "in_progress" | "booked" | "lost";

export interface Lead {
  id: string;
  source: LeadSource;
  status: LeadStatus;
  name: string | null;
  email: string;
  phone: string | null;
  event_type: string | null;
  event_date: string | null;
  guest_count: string | null;
  business_name: string | null;
  business_type: string | null;
  location: string | null;
  interest: string | null;
  message: string | null;
  sms_consent: boolean;
  source_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  fbclid: string | null;
  landing_page: string | null;
  archived_at: string | null;
  created_at: string;
}

// Email Campaigns
export type CampaignType = "welcome_nurture" | "abandoned_booking" | "post_visit" | "win_back";
export type CampaignStepChannel = "email" | "sms";
export type LeadCampaignStatus = "active" | "stopped" | "completed";

export interface EmailCampaign {
  id: string;
  name: string;
  type: CampaignType;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignStep {
  id: string;
  campaign_id: string;
  step_number: number;
  channel: CampaignStepChannel;
  subject: string | null;
  body_html: string;
  delay_hours: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadCampaign {
  id: string;
  lead_id: string;
  campaign_id: string;
  current_step: number;
  status: LeadCampaignStatus;
  started_at: string;
  next_send_at: string | null;
  completed_at: string | null;
  campaign?: EmailCampaign;
  total_steps?: number;
}

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
  company_name: string | null;
  company_phone: string | null;
  company_email: string | null;
  website: string | null;
  instagram: string | null;
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
  additional_discount: number;
  shipping_address: string | null;
  share_token: string | null;
  contract_viewed_at: string | null;
  contract_signed_at: string | null;
  contract_signed_by: string | null;
  contract_signature_data: string | null;
  contract_initials_data: string | null;
  created_by: string | null;
  assigned_to: string | null;
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
export type PaymentMethod = "card" | "us_bank_account" | "cashapp" | "klarna" | "afterpay_clearpay" | "affirm" | "amazon_pay" | "link";
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
