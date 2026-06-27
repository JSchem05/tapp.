import type { ReceiptItem } from "@/lib/types";

export const VAT_RATE = 0.18;

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateReceiptTotals(items: ReceiptItem[]) {
  const subtotal = roundMoney(
    items.reduce((sum, item) => sum + item.qty * item.price, 0)
  );
  const vat = roundMoney(subtotal * VAT_RATE);
  const total = roundMoney(subtotal + vat);

  return { subtotal, vat, total };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-MT", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("en-MT", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Malta"
  }).format(new Date(value));
}
