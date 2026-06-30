import { formatCurrency, formatDateTime } from "@/lib/money";
import type { Receipt, ReceiptItem } from "@/lib/types";

export function buildReceiptEmailHtml({
  merchantName,
  receipt,
  receiptUrl
}: {
  merchantName: string;
  receipt: Pick<
    Receipt,
    "items" | "subtotal" | "vat" | "total" | "payment_method" | "created_at"
  >;
  receiptUrl: string;
}) {
  const items = receipt.items as ReceiptItem[];
  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #E5E7EB;">
            <div style="font-weight:600;color:#111111;">${escapeHtml(item.name)}</div>
            <div style="font-size:13px;color:#6B7280;margin-top:4px;">
              Qty ${item.qty} × ${formatCurrency(item.price)}
            </div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #E5E7EB;text-align:right;font-weight:600;color:#111111;">
            ${formatCurrency(item.qty * item.price)}
          </td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#F7F4EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EF;padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(17,17,17,0.08);">
            <tr>
              <td style="padding:28px 28px 8px;">
                <h1 style="margin:0;font-size:22px;color:#111111;">${escapeHtml(merchantName)}</h1>
                <p style="margin:8px 0 0;font-size:14px;color:#6B7280;">${formatDateTime(receipt.created_at)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 0;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${itemRows}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#111111;">
                  <tr>
                    <td style="padding:4px 0;color:#6B7280;">Subtotal</td>
                    <td style="padding:4px 0;text-align:right;">${formatCurrency(receipt.subtotal)}</td>
                  </tr>
                  <tr>
                    <td style="padding:4px 0;color:#6B7280;">VAT 18%</td>
                    <td style="padding:4px 0;text-align:right;">${formatCurrency(receipt.vat)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 0 4px;font-size:16px;font-weight:700;">Total</td>
                    <td style="padding:12px 0 4px;text-align:right;font-size:24px;font-weight:700;color:#2563EB;">${formatCurrency(receipt.total)}</td>
                  </tr>
                </table>
                <p style="margin:16px 0 0;font-size:13px;color:#6B7280;">
                  Payment: <strong style="color:#111111;">${escapeHtml(receipt.payment_method)}</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;">
                <a href="${escapeHtml(receiptUrl)}" style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:600;">
                  View receipt online
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background:#FAFAFA;border-top:1px solid #E5E7EB;font-size:12px;color:#9CA3AF;text-align:center;">
                Powered by Tapp.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
