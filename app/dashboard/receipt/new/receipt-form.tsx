"use client";

import { createReceipt } from "@/app/dashboard/receipt/new/actions";
import { ReceiptCard } from "@/components/receipt-view";
import { Card, Input, Label, SecondaryButton } from "@/components/ui";
import { calculateReceiptTotals, formatCurrency } from "@/lib/money";
import type { PaymentMethod, ReceiptItem, Tag } from "@/lib/types";
import { Minus, Plus, ReceiptText, X } from "lucide-react";
import { useMemo, useState } from "react";

type DraftItem = ReceiptItem & { key: string };

export function ReceiptForm({
  tags,
  defaultTagId,
  error,
  merchantName,
  merchantLogoUrl
}: {
  tags: Tag[];
  defaultTagId?: string;
  error?: string;
  merchantName: string;
  merchantLogoUrl?: string | null;
}) {
  const [selectedTagId, setSelectedTagId] = useState(defaultTagId ?? tags[0]?.id);
  const [items, setItems] = useState<DraftItem[]>([
    { key: crypto.randomUUID(), name: "", qty: 1, price: 0 }
  ]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Card");

  const totals = useMemo(() => calculateReceiptTotals(items), [items]);
  const previewItems = items
    .map(({ name, qty, price }) => ({
      name: name.trim() || "Untitled item",
      qty: Number(qty) || 0,
      price: Number(price) || 0
    }))
    .filter((item) => item.qty > 0);
  const previewReceipt = {
    id: "preview",
    created_at: new Date().toISOString(),
    items: previewItems.length
      ? previewItems
      : [{ name: "Flat white", qty: 1, price: 4.2 }],
    subtotal: totals.subtotal,
    vat: totals.vat,
    total: totals.total,
    payment_method: paymentMethod,
    customer_email: null
  };
  const serializedItems = JSON.stringify(
    items.map(({ name, qty, price }) => ({ name, qty, price }))
  );

  function updateItem(key: string, patch: Partial<ReceiptItem>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item))
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      { key: crypto.randomUUID(), name: "", qty: 1, price: 0 }
    ]);
  }

  function removeItem(key: string) {
    setItems((current) =>
      current.length === 1 ? current : current.filter((item) => item.key !== key)
    );
  }

  return (
    <form action={createReceipt} className="animate-tapp-fade grid gap-6 lg:grid-cols-[minmax(0,1fr)_430px]">
      <input type="hidden" name="items" value={serializedItems} />
      <input type="hidden" name="tag_id" value={selectedTagId} />
      <input type="hidden" name="payment_method" value={paymentMethod} />

      <Card className="space-y-6 p-6">
        <div>
          <p className="text-sm font-semibold text-muted">New receipt</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
            Build the customer receipt
          </h1>
          <p className="mt-1 text-sm text-muted">
            Choose a counter, add items, and push the receipt live.
          </p>
        </div>

        {error ? (
          <p className="rounded-[10px] bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label>Counter</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedTagId(tag.id)}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                  selectedTagId === tag.id
                    ? "border-ink bg-ink text-white shadow-soft"
                    : "border-line bg-white text-ink shadow-sm hover:bg-[#FAFAFA] hover:shadow-soft"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-extrabold text-ink">Items</h2>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.key}
                className="grid gap-3 rounded-[16px] border border-line bg-white p-3 shadow-sm sm:grid-cols-[1fr_132px_140px_44px]"
              >
                <div className="space-y-2">
                  <Label className="text-xs">Item name</Label>
                  <Input
                    value={item.name}
                    onChange={(event) =>
                      updateItem(item.key, { name: event.target.value })
                    }
                    placeholder={index === 0 ? "Flat white" : "Item name"}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Qty</Label>
                  <div className="flex h-11 items-center rounded-[10px] border border-line bg-white">
                    <button
                      type="button"
                      onClick={() =>
                        updateItem(item.key, { qty: Math.max(1, item.qty - 1) })
                      }
                      className="flex h-full w-10 items-center justify-center text-muted hover:text-ink"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      value={item.qty}
                      onChange={(event) =>
                        updateItem(item.key, { qty: Number(event.target.value) })
                      }
                      className="h-full min-w-0 flex-1 border-x border-line text-center text-sm font-bold outline-none"
                      inputMode="decimal"
                    />
                    <button
                      type="button"
                      onClick={() => updateItem(item.key, { qty: item.qty + 1 })}
                      className="flex h-full w-10 items-center justify-center text-muted hover:text-ink"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Price</Label>
                  <div className="flex h-11 items-center rounded-[10px] border border-line bg-white shadow-sm focus-within:border-ink focus-within:ring-4 focus-within:ring-ink/10">
                    <span className="pl-3 text-sm font-bold text-muted">€</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(event) =>
                        updateItem(item.key, { price: Number(event.target.value) })
                      }
                      className="h-full min-w-0 flex-1 rounded-[10px] border-0 bg-transparent px-2 text-sm text-ink outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <SecondaryButton
                    type="button"
                    aria-label="Remove item"
                    onClick={() => removeItem(item.key)}
                    className="h-11 w-full px-0"
                    disabled={items.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </SecondaryButton>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-line bg-white text-sm font-extrabold text-ink transition hover:bg-[#FAFAFA] hover:shadow-soft"
          >
            <Plus className="h-4 w-4" />
            Add item
          </button>
        </div>

        <div className="space-y-2">
          <Label>Payment method</Label>
          <div className="flex flex-wrap gap-2">
            {(["Card", "Cash", "Other"] as PaymentMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                  paymentMethod === method
                    ? "border-ink bg-ink text-white shadow-soft"
                    : "border-line bg-white text-ink shadow-sm hover:bg-[#FAFAFA] hover:shadow-soft"
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[16px] border border-line bg-white p-4">
          <SummaryRow label="Subtotal" value={formatCurrency(totals.subtotal)} />
          <SummaryRow label="VAT 18%" value={formatCurrency(totals.vat)} />
          <SummaryRow label="Total" value={formatCurrency(totals.total)} strong />
        </div>

        <button className="flex h-14 w-full items-center justify-center gap-2 rounded-[10px] bg-ink px-4 text-base font-extrabold text-white shadow-soft transition hover:bg-clay hover:shadow-lift">
          <ReceiptText className="h-5 w-5" />
          Create Receipt
        </button>
      </Card>

      <aside className="h-fit space-y-3 lg:sticky lg:top-20">
        <div>
          <p className="text-sm font-semibold text-muted">Preview</p>
          <h2 className="mt-1 text-xl font-extrabold text-ink">
            What your customer sees
          </h2>
        </div>
        <ReceiptCard
          merchantName={merchantName}
          merchantLogoUrl={merchantLogoUrl}
          receipt={previewReceipt}
        />
      </aside>
    </form>
  );
}

function SummaryRow({
  label,
  value,
  strong = false
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted">{label}</span>
      <span className={strong ? "text-lg font-bold text-ink" : "font-semibold text-ink"}>
        {value}
      </span>
    </div>
  );
}
