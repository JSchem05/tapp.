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
  created_at: string;
};

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
