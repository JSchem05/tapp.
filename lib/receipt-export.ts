import { formatCurrency, formatDateTime } from "@/lib/money";
import type { Receipt, Tag } from "@/lib/types";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildReceiptsCsv(
  receipts: Receipt[],
  tagById: Map<string, Tag>,
  staffById: Record<string, string>
) {
  const header = [
    "Receipt number",
    "Date",
    "Counter",
    "Items",
    "Subtotal",
    "VAT",
    "Total",
    "Payment",
    "Staff",
    "Status"
  ].join(",");

  const rows = receipts.map((receipt) => {
    const tagLabel = tagById.get(receipt.tag_id)?.label ?? "Counter";
    const itemSummary = receipt.awaiting_items
      ? "Awaiting items"
      : receipt.items.map((item) => `${item.name} x${item.qty}`).join("; ");
    const staffName = receipt.staff_id ? staffById[receipt.staff_id] ?? "" : "";
    const status = receipt.awaiting_items
      ? "Awaiting items"
      : receipt.is_latest
        ? "Live"
        : "Saved";

    return [
      receipt.receipt_number != null ? String(receipt.receipt_number) : "",
      csvEscape(formatDateTime(receipt.created_at)),
      csvEscape(tagLabel),
      csvEscape(itemSummary),
      formatCurrency(receipt.subtotal),
      formatCurrency(receipt.vat),
      formatCurrency(receipt.total),
      receipt.payment_method,
      csvEscape(staffName),
      status
    ].join(",");
  });

  return [header, ...rows].join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
