"use client";

import { createReceipt } from "@/app/dashboard/receipt/new/actions";
import { ReceiptCard } from "@/components/receipt-view";
import { Card, Input, Label, SecondaryButton } from "@/components/ui";
import { calculateReceiptTotals, formatCurrency } from "@/lib/money";
import type { PaymentMethod, ReceiptItem, Tag } from "@/lib/types";
import { Minus, Plus, ReceiptText } from "lucide-react";
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
    payment_method: paymentMethod
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
    <form action={createReceipt} className="grid gap-5 lg:grid-cols-[1fr_420px]">
      <input type="hidden" name="items" value={serializedItems} />
      <input type="hidden" name="tag_id" value={selectedTagId} />
      <input type="hidden" name="payment_method" value={paymentMethod} />

      <Card className="space-y-5">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-amber">
            New sale
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
            Create receipt
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
          <Label>NFC counter</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedTagId(tag.id)}
                className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                  selectedTagId === tag.id
                    ? "border-amber bg-amber text-white"
                    : "border-line bg-white text-ink hover:border-amber"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Items</h2>
            <SecondaryButton type="button" onClick={addItem} className="h-9 px-3">
              <Plus className="h-4 w-4" />
              Add item
            </SecondaryButton>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.key}
                className="grid gap-3 rounded-2xl border border-line bg-white p-3 sm:grid-cols-[1fr_132px_120px_40px]"
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
                      className="flex h-full w-10 items-center justify-center text-muted hover:text-amber"
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
                      className="flex h-full w-10 items-center justify-center text-muted hover:text-amber"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(event) =>
                      updateItem(item.key, { price: Number(event.target.value) })
                    }
                    required
                  />
                </div>
                <div className="flex items-end">
                  <SecondaryButton
                    type="button"
                    aria-label="Remove item"
                    onClick={() => removeItem(item.key)}
                    className="h-11 w-full px-0"
                    disabled={items.length === 1}
                  >
                    <Minus className="h-4 w-4" />
                  </SecondaryButton>
                </div>
              </div>
            ))}
          </div>
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
                    ? "border-amber bg-amber text-white"
                    : "border-line bg-white text-ink hover:border-amber"
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-cream p-4">
          <SummaryRow label="Subtotal" value={formatCurrency(totals.subtotal)} />
          <SummaryRow label="VAT 18%" value={formatCurrency(totals.vat)} />
          <SummaryRow label="Total" value={formatCurrency(totals.total)} strong />
        </div>

        <button className="flex h-14 w-full items-center justify-center gap-2 rounded-[10px] bg-ink px-4 text-base font-bold text-white transition hover:bg-black">
          <ReceiptText className="h-5 w-5" />
          Create Receipt
        </button>
      </Card>

      <aside className="h-fit lg:sticky lg:top-5">
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
