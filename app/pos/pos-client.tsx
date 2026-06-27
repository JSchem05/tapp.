"use client";

/* eslint-disable @next/next/no-img-element */

import { completePosOrder } from "@/app/pos/actions";
import type { PosMenuItem } from "@/app/pos/page";
import { formatCurrency, roundMoney } from "@/lib/money";
import type {
  Category,
  PosModifierSelection,
  PosOrderItem,
  Tag
} from "@/lib/types";
import {
  Check,
  ChevronRight,
  Minus,
  Plus,
  Search,
  Trash2,
  X
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState, useTransition } from "react";

type ModalState = {
  item: PosMenuItem;
  qty: number;
  comment: string;
  selections: Record<string, string[]>;
};

type PaymentState = {
  method: "card" | "cash";
  tendered: string;
};

export function PosClient({
  merchantName,
  categories,
  items,
  tags,
  baseUrl
}: {
  merchantName: string;
  categories: Category[];
  items: PosMenuItem[];
  tags: Tag[];
  baseUrl: string;
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [orderItems, setOrderItems] = useState<PosOrderItem[]>([]);
  const [selectedTagId, setSelectedTagId] = useState(tags[0]?.id ?? "");
  const [serviceMode, setServiceMode] = useState<"dine-in" | "takeaway">("dine-in");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentState>({
    method: "card",
    tendered: ""
  });
  const [successUrl, setSuccessUrl] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const filteredItems = items.filter((item) => {
    const categoryMatch = activeCategory ? item.category_id === activeCategory : true;
    const searchMatch = item.name.toLowerCase().includes(query.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const totals = useMemo(() => {
    const subtotal = roundMoney(
      orderItems.reduce((sum, item) => {
        const modifierTotal = item.modifiers.reduce(
          (modSum, modifier) => modSum + modifier.price_delta,
          0
        );
        return sum + (item.price + modifierTotal) * item.qty;
      }, 0)
    );
    const vat = roundMoney(subtotal * 0.18);
    const total = roundMoney(subtotal + vat);
    return { subtotal, vat, total };
  }, [orderItems]);

  const selectedTag = tags.find((tag) => tag.id === selectedTagId);
  const change =
    payment.method === "cash" ? roundMoney(Number(payment.tendered || 0) - totals.total) : 0;

  function openItem(item: PosMenuItem) {
    if (!item.is_available) return;
    const initialSelections: Record<string, string[]> = {};
    for (const group of item.modifierGroups) {
      initialSelections[group.id] =
        group.required && group.modifiers[0] ? [group.modifiers[0].id] : [];
    }
    setModal({ item, qty: 1, comment: "", selections: initialSelections });
  }

  function selectedModifiers(state: ModalState) {
    return state.item.modifierGroups.flatMap((group) =>
      (state.selections[group.id] ?? [])
        .map((modifierId) => {
          const modifier = group.modifiers.find((candidate) => candidate.id === modifierId);
          if (!modifier) return null;
          return {
            group_id: group.id,
            group_name: group.name,
            modifier_id: modifier.id,
            name: modifier.name,
            price_delta: Number(modifier.price_delta)
          } satisfies PosModifierSelection;
        })
        .filter(Boolean)
    ) as PosModifierSelection[];
  }

  function addModalItem() {
    if (!modal) return;
    const requiredMissing = modal.item.modifierGroups.some(
      (group) => group.required && (modal.selections[group.id] ?? []).length === 0
    );
    if (requiredMissing) {
      setError("Choose all required modifiers.");
      return;
    }

    setOrderItems((current) => [
      ...current,
      {
        item_id: modal.item.id,
        name: modal.item.name,
        qty: modal.qty,
        price: Number(modal.item.price),
        modifiers: selectedModifiers(modal),
        comment: modal.comment
      }
    ]);
    setError("");
    setModal(null);
  }

  function updateQty(index: number, delta: number) {
    setOrderItems((current) =>
      current
        .map((item, itemIndex) =>
          itemIndex === index ? { ...item, qty: Math.max(0, item.qty + delta) } : item
        )
        .filter((item) => item.qty > 0)
    );
  }

  function removeItem(index: number) {
    setOrderItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function resetOrder() {
    setOrderItems([]);
    setPaymentOpen(false);
    setSuccessUrl("");
    setError("");
  }

  function submitOrder(status: "open" | "completed") {
    setError("");
    startTransition(async () => {
      try {
        const result = await completePosOrder({
          tagId: selectedTagId,
          items: orderItems,
          paymentMethod: payment.method,
          status
        });
        if (result.status === "completed") {
          const url = selectedTag ? `${baseUrl}/t/${selectedTag.tag_code}` : baseUrl;
          setSuccessUrl(url);
          setPaymentOpen(false);
          window.setTimeout(resetOrder, 3000);
        } else {
          resetOrder();
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Order failed.");
      }
    });
  }

  return (
    <div className="grid min-h-0 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)]">
      <section className="flex min-h-0 flex-col rounded-[28px] border border-line bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-ink">{merchantName}</h1>
            <p className="text-sm text-muted">Staff: Front counter</p>
          </div>
          <div className="flex h-12 min-w-[220px] items-center rounded-full bg-cream px-4">
            <Search className="h-5 w-5 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search menu"
              className="min-w-0 flex-1 bg-transparent px-3 text-base outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`h-12 shrink-0 rounded-full px-5 text-base font-extrabold ${
                activeCategory === category.id
                  ? "bg-amber text-white shadow-soft"
                  : "border border-line bg-white text-ink"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        <div className="mt-4 grid min-h-0 flex-1 grid-cols-2 gap-4 overflow-y-auto pr-1 md:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openItem(item)}
              className={`relative min-h-[138px] overflow-hidden rounded-[20px] border border-line bg-white p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift ${
                !item.is_available ? "opacity-45" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <ItemImage item={item} />
                <div className="min-w-0">
                  <p className="line-clamp-2 text-lg font-extrabold leading-tight text-ink">
                    {item.name}
                  </p>
                  <p className="mt-1 text-base font-extrabold text-amber">
                    {formatCurrency(Number(item.price))}
                  </p>
                </div>
              </div>
              {item.description ? (
                <p className="mt-3 line-clamp-2 text-sm text-muted">{item.description}</p>
              ) : null}
              <span className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white">
                <Plus className="h-5 w-5" />
              </span>
              {!item.is_available ? (
                <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-extrabold text-muted">
                  Unavailable
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <aside className="flex min-h-0 flex-col rounded-[28px] border border-line bg-white p-5 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-amber">
              Order Details
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-ink">
              Current order
            </h2>
          </div>
          <button
            type="button"
            onClick={resetOrder}
            className="h-10 rounded-[10px] border border-line bg-white px-3 text-sm font-bold text-ink hover:border-amber hover:text-amber"
          >
            Reset Order
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 rounded-full bg-cream p-1">
          {(["dine-in", "takeaway"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setServiceMode(mode)}
              className={`h-11 rounded-full text-sm font-extrabold ${
                serviceMode === mode ? "bg-white text-ink shadow-soft" : "text-muted"
              }`}
            >
              {mode === "dine-in" ? "Dine In" : "Takeaway"}
            </button>
          ))}
        </div>

        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {orderItems.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-line bg-cream p-8 text-center">
              <p className="text-lg font-extrabold text-ink">No items yet</p>
              <p className="mt-1 text-sm text-muted">Tap menu items to build an order.</p>
            </div>
          ) : (
            orderItems.map((item, index) => {
              const lineTotal =
                (item.price +
                  item.modifiers.reduce((sum, modifier) => sum + modifier.price_delta, 0)) *
                item.qty;
              return (
                <div key={`${item.item_id}-${index}`} className="rounded-[18px] border border-line bg-white p-4 shadow-sm">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-extrabold text-ink">{item.name}</p>
                      {item.modifiers.length > 0 ? (
                        <p className="mt-1 text-sm text-muted">
                          {item.modifiers.map((modifier) => modifier.name).join(", ")}
                        </p>
                      ) : null}
                      {item.comment ? (
                        <p className="mt-1 text-sm italic text-muted">{item.comment}</p>
                      ) : null}
                    </div>
                    <p className="font-extrabold text-ink">{formatCurrency(lineTotal)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex h-10 items-center rounded-full border border-line">
                      <button type="button" onClick={() => updateQty(index, -1)} className="flex h-full w-10 items-center justify-center">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-extrabold">{item.qty}</span>
                      <button type="button" onClick={() => updateQty(index, 1)} className="flex h-full w-10 items-center justify-center">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button type="button" onClick={() => removeItem(index)} className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <TotalRow label="Subtotal" value={formatCurrency(totals.subtotal)} />
          <TotalRow label="VAT 18%" value={formatCurrency(totals.vat)} />
          <div className="mt-3 flex items-center justify-between border-t border-line pt-4">
            <span className="text-xl font-extrabold text-ink">Total</span>
            <span className="text-4xl font-extrabold text-ink">
              {formatCurrency(totals.total)}
            </span>
          </div>
          <button type="button" className="mt-3 flex h-12 w-full items-center justify-between rounded-[10px] border border-line bg-white px-4 text-sm font-bold text-muted">
            Add Discount <ChevronRight className="h-4 w-4" />
          </button>
          <label className="mt-3 block text-sm font-bold text-muted">
            Select Counter
            <select
              value={selectedTagId}
              onChange={(event) => setSelectedTagId(event.target.value)}
              className="mt-2 h-12 w-full rounded-[10px] border border-line bg-white px-3 text-base font-bold text-ink"
            >
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.label} ({tag.tag_code})
                </option>
              ))}
            </select>
          </label>
          {error ? <p className="mt-3 rounded-[10px] bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={orderItems.length === 0 || isPending}
              onClick={() => submitOrder("open")}
              className="h-14 rounded-[10px] border border-line bg-white text-base font-extrabold text-ink disabled:opacity-40"
            >
              Open Bill
            </button>
            <button
              type="button"
              disabled={orderItems.length === 0 || isPending}
              onClick={() => setPaymentOpen(true)}
              className="h-14 rounded-[10px] bg-amber text-base font-extrabold text-white shadow-soft disabled:opacity-40"
            >
              Pay Now
            </button>
          </div>
        </div>
      </aside>

      {modal ? (
        <ModifierModal
          state={modal}
          setState={setModal}
          onClose={() => setModal(null)}
          onAdd={addModalItem}
        />
      ) : null}

      {paymentOpen ? (
        <PaymentModal
          total={totals.total}
          payment={payment}
          setPayment={setPayment}
          change={change}
          isPending={isPending}
          onClose={() => setPaymentOpen(false)}
          onConfirm={() => submitOrder("completed")}
        />
      ) : null}

      {successUrl ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-sm">
          <div className="animate-tapp-fade rounded-[28px] bg-white p-8 text-center shadow-lift">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
              <Check className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-ink">Receipt is live</h2>
            <p className="mt-2 break-all text-sm text-muted">{successUrl}</p>
            <div className="mt-5 inline-flex rounded-2xl border border-line p-3">
              <QRCodeSVG value={successUrl} size={160} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ItemImage({ item }: { item: PosMenuItem }) {
  if (item.image_url) {
    return (
      <img
        src={item.image_url}
        alt={item.name}
        className="h-14 w-14 rounded-2xl object-cover"
      />
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber/15 text-xl font-extrabold text-amber">
      {item.name[0]?.toUpperCase()}
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-extrabold text-ink">{value}</span>
    </div>
  );
}

function ModifierModal({
  state,
  setState,
  onClose,
  onAdd
}: {
  state: ModalState;
  setState: (state: ModalState) => void;
  onClose: () => void;
  onAdd: () => void;
}) {
  const selectedMods = state.item.modifierGroups.flatMap((group) =>
    (state.selections[group.id] ?? [])
      .map((id) => group.modifiers.find((modifier) => modifier.id === id))
      .filter(Boolean)
  );
  const unitPrice = roundMoney(
    Number(state.item.price) +
      selectedMods.reduce((sum, modifier) => sum + Number(modifier?.price_delta ?? 0), 0)
  );

  function toggle(groupId: string, modifierId: string, multi: boolean) {
    const current = state.selections[groupId] ?? [];
    const next = multi
      ? current.includes(modifierId)
        ? current.filter((id) => id !== modifierId)
        : [...current, modifierId]
      : [modifierId];
    setState({
      ...state,
      selections: { ...state.selections, [groupId]: next }
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/30 p-0 backdrop-blur-sm md:items-center md:p-4">
      <div className="animate-tapp-fade max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-6 shadow-lift md:max-w-xl md:rounded-[28px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-ink">{state.item.name}</h2>
            <p className="text-sm text-muted">{formatCurrency(Number(state.item.price))} base</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-cream">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          {state.item.modifierGroups.map((group) => (
            <section key={group.id}>
              <p className="text-sm font-extrabold text-ink">
                {group.name} {group.required ? <span className="text-red-600">*</span> : null}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {group.modifiers.map((modifier) => {
                  const selected = (state.selections[group.id] ?? []).includes(modifier.id);
                  return (
                    <button
                      key={modifier.id}
                      type="button"
                      onClick={() => toggle(group.id, modifier.id, group.multi_select)}
                      className={`min-h-12 rounded-full border px-4 text-sm font-extrabold ${
                        selected
                          ? "border-amber bg-amber text-white"
                          : "border-line bg-white text-ink"
                      }`}
                    >
                      {modifier.name}
                      {Number(modifier.price_delta) ? ` +${formatCurrency(Number(modifier.price_delta))}` : ""}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <textarea
          value={state.comment}
          onChange={(event) => setState({ ...state, comment: event.target.value })}
          placeholder="Add a note for the kitchen..."
          className="mt-5 min-h-24 w-full rounded-[10px] border border-line px-3 py-3 text-sm outline-none focus:border-amber focus:ring-4 focus:ring-amber/15"
        />

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex h-12 items-center rounded-full border border-line">
            <button type="button" onClick={() => setState({ ...state, qty: Math.max(1, state.qty - 1) })} className="flex h-full w-12 items-center justify-center">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-12 text-center text-lg font-extrabold">{state.qty}</span>
            <button type="button" onClick={() => setState({ ...state, qty: state.qty + 1 })} className="flex h-full w-12 items-center justify-center">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <p className="text-2xl font-extrabold text-ink">
            {formatCurrency(unitPrice * state.qty)}
          </p>
        </div>

        <button
          type="button"
          onClick={onAdd}
          className="mt-5 h-14 w-full rounded-[10px] bg-ink text-base font-extrabold text-white"
        >
          Add to order
        </button>
      </div>
    </div>
  );
}

function PaymentModal({
  total,
  payment,
  setPayment,
  change,
  isPending,
  onClose,
  onConfirm
}: {
  total: number;
  payment: PaymentState;
  setPayment: (payment: PaymentState) => void;
  change: number;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/30 p-4 backdrop-blur-sm">
      <div className="animate-tapp-fade w-full max-w-md rounded-[28px] bg-white p-6 shadow-lift">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber">
              Payment
            </p>
            <h2 className="mt-2 text-4xl font-extrabold text-ink">
              {formatCurrency(total)}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-cream">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {(["cash", "card"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPayment({ ...payment, method })}
              className={`h-20 rounded-[20px] border text-xl font-extrabold ${
                payment.method === method
                  ? "border-amber bg-amber text-white"
                  : "border-line bg-white text-ink"
              }`}
            >
              {method === "cash" ? "Cash" : "Card"}
            </button>
          ))}
        </div>
        {payment.method === "cash" ? (
          <div className="mt-5">
            <label className="text-sm font-bold text-muted">Amount tendered</label>
            <input
              value={payment.tendered}
              onChange={(event) => setPayment({ ...payment, tendered: event.target.value })}
              inputMode="decimal"
              placeholder="0.00"
              className="mt-2 h-12 w-full rounded-[10px] border border-line px-3 text-lg font-bold outline-none focus:border-amber focus:ring-4 focus:ring-amber/15"
            />
            <p className="mt-2 text-sm font-bold text-muted">
              Change: <span className="text-ink">{formatCurrency(Math.max(0, change))}</span>
            </p>
          </div>
        ) : (
          <p className="mt-5 rounded-[14px] bg-cream px-4 py-3 text-sm text-muted">
            Card confirmation only for now. Stripe Terminal can connect here later.
          </p>
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={onConfirm}
          className="mt-6 h-14 w-full rounded-[10px] bg-ink text-base font-extrabold text-white disabled:opacity-50"
        >
          Confirm Payment
        </button>
      </div>
    </div>
  );
}
