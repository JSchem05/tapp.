export type ReceiptItem = {
  name: string;
  qty: number;
  price: number;
  modifiers?: Array<{
    group_id?: string;
    group_name?: string;
    modifier_id?: string;
    name: string;
    price_delta?: number;
  }>;
  comment?: string;
};

export type PaymentMethod = "Card" | "Cash" | "Other";

export type Merchant = {
  id: string;
  name: string;
  email: string;
  slug: string;
  logo_url: string | null;
  tagline: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  address: string | null;
  wifi_name: string | null;
  wifi_password: string | null;
  google_review_url: string | null;
  ad_headline: string | null;
  ad_subtext: string | null;
  ad_cta_label: string | null;
  ad_cta_url: string | null;
  ad_bg_color: string | null;
  show_promo: boolean;
  promo_headline: string | null;
  promo_subtext: string | null;
  promo_cta_label: string | null;
  promo_cta_url: string | null;
  promo_color: string | null;
  loyalty_goal: number | null;
  loyalty_reward: string | null;
  show_qr: boolean;
  show_wifi: boolean;
  show_ad: boolean;
  show_review: boolean;
  show_loyalty: boolean;
  show_email_opt_in: boolean;
  show_social: boolean;
  show_info: boolean;
  show_business_details: boolean;
  vat_number: string | null;
  created_at: string;
};

export type ReceiptMerchantProfile = Pick<
  Merchant,
  | "name"
  | "logo_url"
  | "tagline"
  | "phone"
  | "website"
  | "instagram"
  | "address"
  | "wifi_name"
  | "wifi_password"
  | "google_review_url"
  | "ad_headline"
  | "ad_subtext"
  | "ad_cta_label"
  | "ad_cta_url"
  | "ad_bg_color"
  | "show_promo"
  | "promo_headline"
  | "promo_subtext"
  | "promo_cta_label"
  | "promo_cta_url"
  | "promo_color"
  | "loyalty_goal"
  | "loyalty_reward"
  | "show_qr"
  | "show_wifi"
  | "show_ad"
  | "show_review"
  | "show_loyalty"
  | "show_email_opt_in"
  | "show_social"
  | "show_info"
  | "show_business_details"
  | "vat_number"
>;

export type Tag = {
  id: string;
  merchant_id: string;
  tag_code: string;
  label: string;
  created_at: string;
};

export type Receipt = {
  id: string;
  merchant_id: string;
  tag_id: string;
  staff_id: string | null;
  items: ReceiptItem[];
  subtotal: number;
  vat: number;
  total: number;
  payment_method: PaymentMethod;
  awaiting_items: boolean;
  is_latest: boolean;
  receipt_number: number | null;
  customer_email: string | null;
  created_at: string;
};

export type Customer = {
  id: string;
  merchant_id: string;
  email: string;
  first_seen: string;
  last_seen: string;
  visit_count: number;
};

export type LoyaltyCard = {
  id: string;
  merchant_id: string;
  customer_id: string;
  stamps: number;
  redeemed_count: number;
};

export type Category = {
  id: string;
  merchant_id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type MenuItem = {
  id: string;
  merchant_id: string;
  category_id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  created_at: string;
};

export type ModifierGroup = {
  id: string;
  merchant_id: string;
  name: string;
  required: boolean;
  multi_select: boolean;
  created_at: string;
};

export type Modifier = {
  id: string;
  group_id: string;
  name: string;
  price_delta: number;
  created_at: string;
};

export type ItemModifierGroup = {
  item_id: string;
  group_id: string;
};

export type PosModifierSelection = {
  group_id: string;
  group_name: string;
  modifier_id: string;
  name: string;
  price_delta: number;
};

export type PosOrderItem = {
  item_id: string;
  name: string;
  qty: number;
  price: number;
  modifiers: PosModifierSelection[];
  comment: string;
};

export type Order = {
  id: string;
  merchant_id: string;
  tag_id: string;
  staff_id: string | null;
  items: PosOrderItem[];
  subtotal: number;
  vat: number;
  total: number;
  payment_method: "card" | "cash";
  status: "open" | "completed" | "cancelled";
  created_at: string;
};

export type Staff = {
  id: string;
  merchant_id: string;
  name: string;
  code: string;
  created_at: string;
};

export type PosConnection = {
  id: string;
  merchant_id: string;
  provider: string;
  access_token: string;
  refresh_token: string | null;
  external_merchant_id: string | null;
  created_at: string;
};
