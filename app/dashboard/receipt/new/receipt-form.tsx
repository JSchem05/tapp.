"use client";

import { createReceipt } from "@/app/dashboard/receipt/new/actions";
import { Button, Card, Input, Label, SecondaryButton, Select } from "@/components/ui";
import { calculateReceiptTotals, formatCurrency } from "@/lib/money";
import type { PaymentMethod, ReceiptItem, Tag } from "@/lib/types";
import { Minus, Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";

type DraftItem = ReceiptItem & { key: string };

export function ReceiptForm({
  tags,
  defaultTagId,
  error
}: {
  tags: Tag[];
  defaultTagId?: string;
  error?: string;
}) {
  const [items, setItems] = useState<DraftItem[]>([
    { key: crypto.randomUUID(), name: "", qty: 1, price: 0 }
  ]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Card");

  const totals = useMemo(() => calculateReceiptTotals(items), [items]);
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
    <form action={createReceipt} className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <input type="hidden" name="items" value={serializedItems} />

      <Card className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-ink">New receipt</h1>
          <p className="mt-1 text-sm text-coffee/65">
            Send the latest sale to the NFC puck at the counter.
          </p>
        </div>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>NFC puck</Label>
            <Select name="tag_id" defaultValue={defaultTagId ?? tags[0]?.id} required>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.label} ({tag.tag_code})
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select
              name="payment_method"
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as PaymentMethod)
              }
            >
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
              <option value="Other">Other</option>
            </Select>
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
                className="grid gap-3 rounded-2xl border border-coffee/10 bg-white p-3 sm:grid-cols-[1fr_90px_120px_40px]"
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
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={item.qty}
                    onChange={(event) =>
                      updateItem(item.key, { qty: Number(event.target.value) })
                    }
                    required
                  />
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
      </Card>

      <Card className="h-fit lg:sticky lg:top-5">
        <h2 className="text-lg font-bold text-ink">Summary</h2>
        <div className="mt-5 space-y-3">
          <SummaryRow label="Subtotal" value={formatCurrency(totals.subtotal)} />
          <SummaryRow label="VAT 18%" value={formatCurrency(totals.vat)} />
          <div className="flex items-center justify-between border-t border-coffee/10 pt-4">
            <span className="font-semibold text-ink">Total</span>
            <span className="text-2xl font-bold text-ink">
              {formatCurrency(totals.total)}
            </span>
          </div>
        </div>
        <Button type="submit" className="mt-6 w-full">
          <Save className="h-4 w-4" />
          Save receipt
        </Button>
      </Card>
    </form>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-coffee/65">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
