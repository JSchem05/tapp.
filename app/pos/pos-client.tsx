"use client";

/* eslint-disable @next/next/no-img-element */

import { completePosOrder } from "@/app/pos/actions";
import type { PosMenuItem } from "@/app/pos/page";
import { formatCurrency, roundMoney } from "@/lib/money";
import type {
  Category,
  PosModifierSelection,
  PosOrderItem,
  Staff,
  Tag
} from "@/lib/types";
import {
  Check,
  ChevronRight,
  Maximize2,
  Minus,
  Pencil,
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
  staff,
  baseUrl
}: {
  merchantName: string;
  categories: Category[];
  items: PosMenuItem[];
  tags: Tag[];
  staff: Staff[];
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
  const [staffPinCode, setStaffPinCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const orderQtyByItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of orderItems) {
      map.set(item.item_id, (map.get(item.item_id) ?? 0) + item.qty);
    }
    return map;
  }, [orderItems]);
  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      map.set(item.category_id, (map.get(item.category_id) ?? 0) + 1);
    }
    return map;
  }, [items]);

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
  const staffByPin = useMemo(
    () => new Map(staff.map((member) => [member.pin_code, member])),
    [staff]
  );
  const selectedStaff = staffByPin.get(staffPinCode);
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

  function addSimpleItem(item: PosMenuItem) {
    if (!item.is_available) return;
    setOrderItems((current) => [
      ...current,
      {
        item_id: item.id,
        name: item.name,
        qty: 1,
        price: Number(item.price),
        modifiers: [],
        comment: ""
      }
    ]);
  }

  function openOrderItem(orderItem: PosOrderItem) {
    const source = items.find((item) => item.id === orderItem.item_id);
    if (source) openItem(source);
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
    setStaffPinCode("");
  }

  function submitOrder(status: "open" | "completed") {
    setError("");
    startTransition(async () => {
      try {
        const result = await completePosOrder({
          tagId: selectedTagId,
          items: orderItems,
          paymentMethod: payment.method,
          status,
          staffPinCode
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
    <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[65%_35%]">
      <section className="flex h-[calc(100vh-56px)] min-h-0 flex-col overflow-y-auto bg-cream p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-bold text-ink">Menu</h1>
            <p className="text-xs text-muted">{merchantName}</p>
          </div>
          <div className="flex h-10 min-w-[220px] items-center rounded-[10px] border border-line bg-white px-3 focus-within:border-ink focus-within:ring-4 focus-within:ring-ink/10">
            <Search className="h-4 w-4 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search menu"
              className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setActiveCategory(category.id)}
              className={`flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-semibold ${
                activeCategory === category.id
                  ? "border-ink bg-ink text-white"
                  : "border-line bg-white text-ink hover:bg-[#FAFAFA]"
              }`}
            >
              {category.name}
              <span className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                activeCategory === category.id ? "bg-white/20 text-white" : "bg-[#F0F0F0] text-muted"
              }`}>
                {categoryCounts.get(category.id) ?? 0}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-3 pr-1 md:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => addSimpleItem(item)}
              className={`relative overflow-hidden rounded-[12px] border border-line bg-white text-left transition hover:shadow-lift ${
                !item.is_available ? "opacity-45" : ""
              }`}
            >
              <div className="relative h-[120px] bg-[#F5F5F5]">
                <ItemImage item={item} />
                <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-muted shadow-sm">
                  <Maximize2 className="h-3.5 w-3.5" />
                </span>
                {orderQtyByItem.get(item.id) ? (
                  <span className="absolute left-2 top-2 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-ink px-1.5 text-xs font-bold text-white">
                    {orderQtyByItem.get(item.id)}
                  </span>
                ) : null}
              </div>
              <div className="relative min-h-[64px] p-3 pr-12">
                <p className="line-clamp-1 text-sm font-semibold text-ink">{item.name}</p>
                <p className="mt-1 text-[13px] font-medium text-muted">
                  {formatCurrency(Number(item.price))}
                </p>
              </div>
              <span
                onClick={(event) => {
                  event.stopPropagation();
                  openItem(item);
                }}
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white"
              >
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

      <aside className="flex h-[calc(100vh-56px)] min-h-0 flex-col border-l border-line bg-white">
        <div className="flex h-12 items-center justify-between gap-2 border-b border-line px-4">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wide text-muted">Order Details</p>
          </div>
          <button
            type="button"
            onClick={resetOrder}
            className="h-8 rounded-[10px] border border-line bg-white px-3 text-xs font-bold text-ink hover:bg-[#FAFAFA]"
          >
            Reset Order
          </button>
          <select
            value={serviceMode}
            onChange={(event) => setServiceMode(event.target.value as "dine-in" | "takeaway")}
            className="h-8 rounded-[10px] border border-line bg-white px-2 text-xs font-bold text-ink"
          >
            <option value="dine-in">Dine In</option>
            <option value="takeaway">Takeaway</option>
          </select>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {orderItems.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div>
                <p className="text-sm font-bold text-ink">No items yet</p>
                <p className="mt-1 text-sm text-muted">Tap menu items to build an order.</p>
              </div>
            </div>
          ) : (
            orderItems.map((item, index) => {
              const lineTotal =
                (item.price +
                  item.modifiers.reduce((sum, modifier) => sum + modifier.price_delta, 0)) *
                item.qty;
              return (
                <div key={`${item.item_id}-${index}`} className="grid grid-cols-[44px_1fr_auto_auto] gap-3 border-b border-line p-3">
                  <OrderThumb name={item.name} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                      {item.modifiers.length > 0 ? (
                        <p className="mt-0.5 truncate text-xs text-muted">
                          {item.modifiers.map((modifier) => modifier.name).join(", ")}
                        </p>
                      ) : null}
                      {item.comment ? (
                        <p className="mt-0.5 truncate text-xs italic text-muted">{item.comment}</p>
                      ) : null}
                    <p className="mt-2 text-sm font-bold text-ink">{formatCurrency(lineTotal)}</p>
                    </div>
                  <div className="flex flex-col items-end gap-2">
                    <button type="button" onClick={() => openOrderItem(item)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-muted hover:text-ink">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex h-8 items-center rounded-lg border border-line">
                      <button type="button" onClick={() => updateQty(index, -1)} className="flex h-full w-8 items-center justify-center text-muted hover:text-ink">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                      <button type="button" onClick={() => updateQty(index, 1)} className="flex h-full w-8 items-center justify-center text-muted hover:text-ink">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeItem(index)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-line p-4">
          <TotalRow label="Subtotal" value={formatCurrency(totals.subtotal)} />
          <TotalRow label="Discount" value="-" />
          <TotalRow label="Tax 18%" value={formatCurrency(totals.vat)} />
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <span className="text-[15px] font-semibold text-ink">Total Payment</span>
            <span className="text-xl font-bold text-ink">
              {formatCurrency(totals.total)}
            </span>
          </div>
          <button type="button" className="mt-3 flex h-10 w-full items-center justify-between rounded-[10px] bg-[#F0F0F0] px-3 text-sm font-semibold text-ink">
            Add Discount <ChevronRight className="h-4 w-4" />
          </button>
          <label className="mt-3 grid grid-cols-[1fr_auto] items-center gap-2 text-sm font-semibold text-ink">
            Select Counter
            <select
              value={selectedTagId}
              onChange={(event) => setSelectedTagId(event.target.value)}
              className="h-9 rounded-[10px] border border-line bg-white px-3 text-sm font-bold text-ink"
            >
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.label} ({tag.tag_code})
                </option>
              ))}
            </select>
          </label>
          <div className="mt-3 rounded-[12px] border border-line bg-[#FAFAFA] p-3">
            <p className="text-sm font-semibold text-ink">Who&apos;s ringing this up?</p>
            <p className="mt-0.5 text-xs text-muted">
              Optional 4-digit PIN for staff tagging.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={staffPinCode}
                onChange={(event) =>
                  setStaffPinCode(event.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="----"
                inputMode="numeric"
                className="h-10 w-24 rounded-[10px] border border-line bg-white px-3 text-sm font-bold tracking-[0.3em] text-ink outline-none focus:border-ink"
              />
              {staffPinCode ? (
                <button
                  type="button"
                  onClick={() => setStaffPinCode("")}
                  className="h-10 rounded-[10px] border border-line bg-white px-3 text-xs font-semibold text-ink"
                >
                  Clear
                </button>
              ) : null}
            </div>
            {staffPinCode.length > 0 ? (
              <p className="mt-2 text-xs font-semibold text-muted">
                {selectedStaff ? `Tagged: ${selectedStaff.name}` : "PIN not recognized yet"}
              </p>
            ) : null}
          </div>
          {error ? <p className="mt-3 rounded-[10px] bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
          <div className="mt-4 grid grid-cols-[2fr_3fr] gap-2">
            <button
              type="button"
              disabled={orderItems.length === 0 || isPending}
              onClick={() => submitOrder("open")}
              className="h-12 rounded-[10px] border border-line bg-white text-sm font-bold text-ink disabled:opacity-40"
            >
              Open Bill
            </button>
            <button
              type="button"
              disabled={orderItems.length === 0 || isPending}
              onClick={() => setPaymentOpen(true)}
              className="h-12 rounded-[10px] bg-ink text-sm font-bold text-white transition hover:bg-clay disabled:opacity-40"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="animate-tapp-fade rounded-[20px] bg-white p-8 text-center shadow-lift">
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
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#F5F5F5] text-[32px] font-bold text-muted">
      {item.name[0]?.toUpperCase()}
    </div>
  );
}

function OrderThumb({ name }: { name: string }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-sm font-bold text-muted">
      {name[0]?.toUpperCase()}
    </div>
  );
}

function ItemImageThumb({ item }: { item: PosMenuItem }) {
  if (item.image_url) {
    return (
      <img
        src={item.image_url}
        alt={item.name}
        className="h-20 w-20 rounded-[12px] object-cover"
      />
    );
  }

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-[12px] bg-[#F5F5F5] text-3xl font-bold text-muted">
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
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-0">
      <div className="animate-tapp-fade max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] bg-white p-6 shadow-lift md:max-w-2xl">
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-[#DDDDDD]" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <ItemImageThumb item={state.item} />
            <div>
              <h2 className="text-xl font-semibold text-ink">{state.item.name}</h2>
              <p className="text-sm text-muted">{formatCurrency(Number(state.item.price))} base</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-5 border-t border-line pt-5">
          {state.item.modifierGroups.map((group) => (
            <section key={group.id}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
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
                          ? "border-ink bg-ink text-white"
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
          className="mt-5 min-h-24 w-full rounded-[10px] border border-line bg-white px-3 py-3 text-sm outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
        />

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex h-11 items-center gap-2">
            <button type="button" onClick={() => setState({ ...state, qty: Math.max(1, state.qty - 1) })} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F0F0F0]">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-lg font-extrabold">{state.qty}</span>
            <button type="button" onClick={() => setState({ ...state, qty: state.qty + 1 })} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F0F0F0]">
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
          className="mt-5 h-[52px] w-full rounded-[10px] bg-ink text-base font-extrabold text-white"
        >
          Add to order
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full text-center text-sm font-semibold text-muted"
        >
          Cancel
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="animate-tapp-fade w-full max-w-[400px] rounded-[20px] bg-white p-8 shadow-lift">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-muted">Payment</p>
            <h2 className="mt-2 text-4xl font-bold text-ink">
              {formatCurrency(total)}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white">
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
                  ? "border-ink bg-[#F0F0F0] text-ink"
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
              className="mt-2 h-12 w-full rounded-[10px] border border-line bg-white px-3 text-lg font-bold outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
            />
            <p className="mt-2 text-sm font-bold text-muted">
              Change: <span className="text-ink">{formatCurrency(Math.max(0, change))}</span>
            </p>
          </div>
        ) : (
          <p className="mt-5 rounded-[14px] border border-line bg-[#FAFAFA] px-4 py-3 text-sm text-muted">
            Card confirmation only for now. Stripe Terminal can connect here later.
          </p>
        )}
        <button
          type="button"
          disabled={isPending}
          onClick={onConfirm}
          className="mt-6 h-[52px] w-full rounded-[10px] bg-ink text-base font-extrabold text-white transition hover:bg-clay disabled:opacity-50"
        >
          Confirm Payment
        </button>
      </div>
    </div>
  );
}
