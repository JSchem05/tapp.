import { Card } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/money";
import type { Receipt, ReceiptItem } from "@/lib/types";
import { CreditCard, ReceiptText } from "lucide-react";

export function ReceiptView({
  merchantName,
  receipt,
  compact = false
}: {
  merchantName: string;
  receipt: Pick<
    Receipt,
    "created_at" | "items" | "subtotal" | "vat" | "total" | "payment_method"
  >;
  compact?: boolean;
}) {
  const items = receipt.items as ReceiptItem[];

  return (
    <Card className={compact ? "p-4" : "p-5 sm:p-6"}>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-clay">
            Receipt
          </p>
          <h1 className="mt-1 text-2xl font-bold text-ink">{merchantName}</h1>
          <p className="mt-1 text-sm text-coffee/65">
            {formatDateTime(receipt.created_at)}
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cream text-coffee">
          <ReceiptText className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-3 border-y border-dashed border-coffee/15 py-5">
        {items.map((item, index) => (
          <div key={`${item.name}-${index}`} className="grid grid-cols-[1fr_auto] gap-4">
            <div>
              <p className="font-medium text-ink">{item.name}</p>
              <p className="mt-1 text-sm text-coffee/60">
                {item.qty} x {formatCurrency(item.price)}
              </p>
            </div>
            <p className="font-semibold text-ink">
              {formatCurrency(item.qty * item.price)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <ReceiptRow label="Subtotal" value={formatCurrency(receipt.subtotal)} />
        <ReceiptRow label="VAT 18%" value={formatCurrency(receipt.vat)} />
        <div className="flex items-center justify-between border-t border-coffee/10 pt-4">
          <span className="text-base font-semibold text-ink">Total</span>
          <span className="text-2xl font-bold text-ink">
            {formatCurrency(receipt.total)}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-2xl bg-cream px-4 py-3 text-sm">
        <span className="inline-flex items-center gap-2 font-medium text-coffee">
          <CreditCard className="h-4 w-4" />
          Payment
        </span>
        <span className="font-semibold text-ink">{receipt.payment_method}</span>
      </div>
    </Card>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-coffee/65">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
