export type ReceiptItem = {
  name: string;
  qty: number;
  price: number;
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
  ad_headline: string | null;
  ad_subtext: string | null;
  ad_cta_label: string | null;
  ad_cta_url: string | null;
  ad_bg_color: string | null;
  show_qr: boolean;
  show_wifi: boolean;
  show_ad: boolean;
  show_social: boolean;
  show_info: boolean;
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
  | "ad_headline"
  | "ad_subtext"
  | "ad_cta_label"
  | "ad_cta_url"
  | "ad_bg_color"
  | "show_qr"
  | "show_wifi"
  | "show_ad"
  | "show_social"
  | "show_info"
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
  items: ReceiptItem[];
  subtotal: number;
  vat: number;
  total: number;
  payment_method: PaymentMethod;
  is_latest: boolean;
  created_at: string;
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
  items: PosOrderItem[];
  subtotal: number;
  vat: number;
  total: number;
  payment_method: "card" | "cash";
  status: "open" | "completed" | "cancelled";
  created_at: string;
};
