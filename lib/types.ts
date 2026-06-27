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
