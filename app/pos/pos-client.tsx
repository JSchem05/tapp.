"use client";

/* eslint-disable @next/next/no-img-element */

import { completePosOrder } from "@/app/pos/actions";
import type { PosMenuItem } from "@/lib/pos/data";
import { formatCurrency, roundMoney } from "@/lib/money";
import type {
  Category,
  PosModifierSelection,
  PosOrderItem,
  Staff,
  Tag
} from "@/lib/types";
import { AppModal, AppModalBody, AppModalFooter, AppModalHeader } from "@/components/app-modal";
import { PosSidebar } from "@/components/pos-sidebar";
import {
  Banknote,
  Check,
  Coffee,
  Cookie,
  CreditCard,
  Croissant,
  GlassWater,
  Minus,
  Pencil,
  Plus,
  ReceiptText,
  Salad,
  Search,
  Trash2,
  UtensilsCrossed,
  Wine,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useMemo, useState, useTransition, type ReactNode } from "react";

const PASTEL_PALETTE = ["#E8F0FE", "#E6F7EF", "#FEF3E2", "#F0EBFC", "#FDEDF3"] as const;

type ModalState = {
  item: PosMenuItem;
  qty: number;
  comment: string;
  selections: Record<string, string[]>;
  editIndex?: number;
};

type PaymentState = {
  method: "card" | "cash";
  tendered: string;
};

export function PosClient({
  categories,
  items,
  tags,
  staff,
  popularItemIds,
  baseUrl,
  mode,
  headerSlot,
  embedded = false
}: {
  merchantName: string;
  staffName?: string;
  categories: Category[];
  items: PosMenuItem[];
  tags: Tag[];
  staff: Staff[];
  popularItemIds: string[];
  baseUrl: string;
  mode: "owner" | "staff";
  headerSlot?: ReactNode;
  embedded?: boolean;
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [orderItems, setOrderItems] = useState<PosOrderItem[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState(tags[0]?.id ?? "");
  const [counterEditOpen, setCounterEditOpen] = useState(false);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [payment, setPayment] = useState<PaymentState>({
    method: "card",
    tendered: ""
  });
  const [successUrl, setSuccessUrl] = useState("");
  const [error, setError] = useState("");
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

  const itemById = useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items]
  );

  const searchActive = query.trim().length > 0;

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const searchMatch = normalizedQuery
        ? item.name.toLowerCase().includes(normalizedQuery)
        : true;
      const categoryMatch = searchActive
        ? true
        : activeCategory
          ? item.category_id === activeCategory
          : true;
      return searchMatch && categoryMatch;
    });
  }, [activeCategory, items, query, searchActive]);

  const popularItems = useMemo(
    () =>
      popularItemIds
        .map((id) => itemById.get(id))
        .filter((item): item is PosMenuItem => Boolean(item)),
    [itemById, popularItemIds]
  );

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

  function openItem(item: PosMenuItem, existing?: PosOrderItem, editIndex?: number) {
    if (!item.is_available) return;
    const initialSelections: Record<string, string[]> = {};
    for (const group of item.modifierGroups) {
      const existingSelections =
        existing?.modifiers
          .filter((modifier) => modifier.group_id === group.id)
          .map((modifier) => modifier.modifier_id) ?? [];
      initialSelections[group.id] = existingSelections.length
        ? existingSelections
        : group.required && group.modifiers[0]
          ? [group.modifiers[0].id]
          : [];
    }
    setModal({
      item,
      qty: existing?.qty ?? 1,
      comment: existing?.comment ?? "",
      selections: initialSelections,
      editIndex
    });
  }

  function addSimpleItem(item: PosMenuItem) {
    if (!item.is_available) return;
    setOrderItems((current) =>
      addOrMergeOrderItem(current, {
        item_id: item.id,
        name: item.name,
        qty: 1,
        price: Number(item.price),
        modifiers: [],
        comment: ""
      })
    );
  }

  function handleItemCardTap(item: PosMenuItem) {
    if (!item.is_available) return;
    if (item.modifierGroups.length > 0) {
      openItem(item);
      return;
    }
    addSimpleItem(item);
  }

  function incrementItemQty(item: PosMenuItem) {
    if (!item.is_available) return;
    addSimpleItem(item);
  }

  function decrementItemQty(item: PosMenuItem) {
    const qty = orderQtyByItem.get(item.id) ?? 0;
    if (qty <= 0) return;
    setOrderItems((current) => {
      let remaining = 1;
      return current
        .map((orderItem) => {
          if (orderItem.item_id !== item.id || remaining === 0) return orderItem;
          if (orderItem.qty <= remaining) {
            remaining -= orderItem.qty;
            return { ...orderItem, qty: 0 };
          }
          const nextQty = orderItem.qty - remaining;
          remaining = 0;
          return { ...orderItem, qty: nextQty };
        })
        .filter((orderItem) => orderItem.qty > 0);
    });
  }

  function openOrderItem(orderItem: PosOrderItem, index: number) {
    const source = items.find((item) => item.id === orderItem.item_id);
    if (source) openItem(source, orderItem, index);
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

    const nextItem: PosOrderItem = {
      item_id: modal.item.id,
      name: modal.item.name,
      qty: modal.qty,
      price: Number(modal.item.price),
      modifiers: selectedModifiers(modal),
      comment: modal.comment.trim()
    };

    setOrderItems((current) =>
      typeof modal.editIndex === "number"
        ? addOrMergeOrderItem(current, nextItem, modal.editIndex)
        : addOrMergeOrderItem(current, nextItem)
    );
    setError("");
    setModal(null);
  }

  function removeModalItem() {
    if (typeof modal?.editIndex !== "number") return;
    removeItem(modal.editIndex);
    setModal(null);
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

  function toggleStaffSelection(staffId: string) {
    setSelectedStaffId((current) => (current === staffId ? null : staffId));
  }

  function submitOrder(status: "open" | "completed") {
    setError("");
    startTransition(async () => {
      try {
        const result = await completePosOrder({
          tagId: selectedTagId,
          staffId: selectedStaffId,
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
    <>
    <div
      className={`flex min-h-0 w-full bg-cream ${
        embedded ? "min-h-[calc(100dvh-9rem)]" : "h-screen"
      }`}
    >
      <PosSidebar
        mode={mode}
        staff={staff}
        selectedStaffId={selectedStaffId}
        onSelectStaff={toggleStaffSelection}
        className={embedded ? "min-h-[calc(100dvh-9rem)]" : "h-screen"}
      />
      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col ${
          embedded ? "min-h-[calc(100dvh-9rem)]" : "h-screen"
        }`}
      >
        {headerSlot}
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_400px]">
      <section className="flex min-h-0 flex-col overflow-y-auto bg-cream">
        <div className="px-6 py-3">
          <div className="flex h-11 w-full items-center rounded-[10px] border border-line bg-white px-3 focus-within:border-blue focus-within:ring-4 focus-within:ring-blue/10">
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search menu"
              className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 px-6 pb-4">
          {categories.map((category, index) => {
            const active = !searchActive && activeCategory === category.id;
            const pastel = PASTEL_PALETTE[index % PASTEL_PALETTE.length];
            const Icon = categoryIcon(category.name);
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setActiveCategory(category.id);
                  setQuery("");
                }}
                className={`flex h-[100px] flex-col rounded-[16px] p-5 text-left transition ${
                  active ? "border-2 border-blue" : "border-2 border-transparent"
                }`}
                style={{ backgroundColor: pastel }}
              >
                <Icon className="h-5 w-5 text-ink/70" />
                <p className="mt-auto truncate text-[15px] font-semibold text-ink">
                  {category.name}
                </p>
                <p className="text-xs text-muted">
                  {categoryCounts.get(category.id) ?? 0} items
                </p>
              </button>
            );
          })}
        </div>

        {popularItems.length > 0 ? (
          <div className="shrink-0">
            <p className="px-6 pb-2 text-sm font-semibold text-ink">Popular</p>
            <div className="grid grid-cols-4 gap-3 px-6 pb-4">
              {popularItems.map((item) => (
                <PosItemCard
                  key={`popular-${item.id}`}
                  item={item}
                  qty={orderQtyByItem.get(item.id) ?? 0}
                  onCardTap={() => handleItemCardTap(item)}
                  onIncrement={() => incrementItemQty(item)}
                  onDecrement={() => decrementItemQty(item)}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-4 gap-3 px-6 pb-6">
          {filteredItems.map((item) => (
            <PosItemCard
              key={item.id}
              item={item}
              qty={orderQtyByItem.get(item.id) ?? 0}
              onCardTap={() => handleItemCardTap(item)}
              onIncrement={() => incrementItemQty(item)}
              onDecrement={() => decrementItemQty(item)}
            />
          ))}
        </div>
      </section>

      <aside className="flex h-full min-h-0 w-[400px] flex-col border-l border-line bg-white">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-4">
          <p className="truncate text-sm font-semibold text-ink">
            {selectedTag?.label ?? "Order"}
          </p>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setCounterEditOpen((open) => !open)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:text-ink"
              aria-label="Change counter"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            {counterEditOpen ? (
              <div className="absolute right-0 top-10 z-10 w-48 rounded-[10px] border border-line bg-white p-2 shadow-soft">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      setSelectedTagId(tag.id);
                      setCounterEditOpen(false);
                    }}
                    className={`flex w-full rounded-[8px] px-3 py-2 text-left text-sm font-semibold ${
                      selectedTagId === tag.id
                        ? "bg-blueSoft text-blue"
                        : "text-ink hover:bg-[#FAFAFA]"
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {orderItems.length === 0 ? (
            <div className="flex h-full items-center justify-center py-8 text-center">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blueSoft text-blue">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-bold text-ink">No items yet</p>
                <p className="mt-1 text-sm text-muted">Tap any menu item to add it</p>
              </div>
            </div>
          ) : (
            <div>
              {orderItems.map((item, index) => {
                const lineTotal =
                  (item.price +
                    item.modifiers.reduce((sum, modifier) => sum + modifier.price_delta, 0)) *
                  item.qty;
                return (
                  <div
                    key={`${item.item_id}-${index}`}
                    className="flex items-center gap-3 border-b border-[#F3F4F6] py-2.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-xs font-bold text-ink">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {item.name} x{item.qty}
                      </p>
                      {item.modifiers.length > 0 ? (
                        <p className="truncate text-xs text-muted">
                          {item.modifiers.map((modifier) => modifier.name).join(", ")}
                        </p>
                      ) : null}
                      {item.comment ? (
                        <p className="truncate text-xs italic text-muted">{item.comment}</p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-sm font-bold text-ink">
                      {formatCurrency(lineTotal)}
                    </p>
                    <button
                      type="button"
                      onClick={() => openOrderItem(item, index)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:text-ink"
                      aria-label={`Edit ${item.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:text-red-600"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-line px-5 py-4">
          <TotalRow label="Subtotal" value={formatCurrency(totals.subtotal)} />
          <TotalRow label="VAT 18%" value={formatCurrency(totals.vat)} />
          <div className="my-3 border-t border-line" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Total</span>
            <span className="text-[22px] font-bold text-ink">
              {formatCurrency(totals.total)}
            </span>
          </div>

          <div className="my-4 grid grid-cols-2 gap-2">
            {(
              [
                { method: "cash" as const, label: "Cash", Icon: Banknote },
                { method: "card" as const, label: "Card", Icon: CreditCard }
              ] as const
            ).map(({ method, label, Icon }) => {
              const selected = payment.method === method;
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPayment({ ...payment, method })}
                  className={`rounded-[10px] border px-3 py-3 text-center transition ${
                    selected
                      ? "border-2 border-blue bg-blueSoft"
                      : "border border-line bg-white"
                  }`}
                >
                  <Icon className="mx-auto h-5 w-5 text-ink" />
                  <p className="mt-1 text-[13px] font-semibold text-ink">{label}</p>
                </button>
              );
            })}
          </div>

          {error ? (
            <p className="mb-3 rounded-[10px] bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            disabled={orderItems.length === 0 || isPending}
            onClick={() => submitOrder("open")}
            className="mb-2 h-10 w-full rounded-[10px] border border-line bg-white text-sm font-bold text-ink disabled:opacity-40"
          >
            Open Bill
          </button>
          <button
            type="button"
            disabled={orderItems.length === 0 || isPending}
            onClick={() => setPaymentOpen(true)}
            className="h-[52px] w-full rounded-[10px] bg-ink text-sm font-bold text-white transition hover:bg-inkSoft disabled:opacity-40"
          >
            Place Order
          </button>
        </div>
      </aside>
        </div>
      </div>
    </div>

      {modal ? (
        <ModifierModal
          state={modal}
          setState={setModal}
          onClose={() => setModal(null)}
          onAdd={addModalItem}
          onRemove={removeModalItem}
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
        <AppModal open onClose={() => setSuccessUrl("")} resetKey={successUrl}>
          <AppModalHeader>
            <h2 className="text-center text-3xl font-extrabold text-ink">Receipt is live</h2>
          </AppModalHeader>
          <AppModalBody className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
              <Check className="h-8 w-8" />
            </div>
            <p className="mt-4 break-all text-sm text-muted">{successUrl}</p>
            <div className="mt-5 inline-flex rounded-2xl border border-line p-3">
              <QRCodeSVG value={successUrl} size={160} />
            </div>
          </AppModalBody>
        </AppModal>
      ) : null}
    </>
  );
}

function PosItemCard({
  item,
  qty,
  onCardTap,
  onIncrement,
  onDecrement
}: {
  item: PosMenuItem;
  qty: number;
  onCardTap: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <article
      className={`flex flex-col rounded-[12px] border border-line bg-white p-3.5 ${
        !item.is_available ? "opacity-45" : ""
      }`}
    >
      <button type="button" onClick={onCardTap} className="w-full text-left">
        <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
        <p className="mt-1 text-[13px] font-semibold text-blue">
          {formatCurrency(Number(item.price))}
        </p>
      </button>
      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDecrement();
          }}
          disabled={qty === 0 || !item.is_available}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted disabled:opacity-30"
          aria-label={`Decrease ${item.name}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="text-sm font-bold text-ink">{qty}</span>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onIncrement();
          }}
          disabled={!item.is_available}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted hover:text-ink disabled:opacity-30"
          aria-label={`Increase ${item.name}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      {!item.is_available ? (
        <p className="mt-2 text-center text-xs font-bold text-muted">Unavailable</p>
      ) : null}
    </article>
  );
}

function categoryIcon(name: string): LucideIcon {
  const normalized = name.trim().toLowerCase();
  if (normalized.includes("coffee") || normalized.includes("drink")) return Coffee;
  if (normalized.includes("pastry") || normalized.includes("bake")) return Croissant;
  if (normalized.includes("snack")) return Cookie;
  if (normalized.includes("salad") || normalized.includes("food")) return Salad;
  if (normalized.includes("wine") || normalized.includes("bar")) return Wine;
  if (normalized.includes("water") || normalized.includes("juice")) return GlassWater;
  return UtensilsCrossed;
}

function addOrMergeOrderItem(
  current: PosOrderItem[],
  nextItem: PosOrderItem,
  replaceIndex?: number
) {
  const matchIndex = current.findIndex(
    (item, index) => index !== replaceIndex && isSameOrderLine(item, nextItem)
  );

  if (matchIndex >= 0) {
    return current
      .map((item, index) =>
        index === matchIndex ? { ...item, qty: item.qty + nextItem.qty } : item
      )
      .filter((_, index) => index !== replaceIndex);
  }

  if (typeof replaceIndex === "number") {
    return current.map((item, index) => (index === replaceIndex ? nextItem : item));
  }

  return [...current, nextItem];
}

function isSameOrderLine(first: PosOrderItem, second: PosOrderItem) {
  return (
    first.item_id === second.item_id &&
    first.comment.trim() === second.comment.trim() &&
    modifierSignature(first.modifiers) === modifierSignature(second.modifiers)
  );
}

function modifierSignature(modifiers: PosModifierSelection[]) {
  return modifiers
    .map((modifier) => `${modifier.group_id}:${modifier.modifier_id}`)
    .sort()
    .join("|");
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
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

function ModifierModal({
  state,
  setState,
  onClose,
  onAdd,
  onRemove
}: {
  state: ModalState;
  setState: (state: ModalState) => void;
  onClose: () => void;
  onAdd: () => void;
  onRemove: () => void;
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

  const editing = typeof state.editIndex === "number";

  return (
    <AppModal open onClose={onClose} resetKey={state.item.id}>
      <AppModalHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <ItemImageThumb item={state.item} />
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-ink">{state.item.name}</h2>
              <p className="text-sm text-muted">
                {formatCurrency(Number(state.item.price))} base
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </AppModalHeader>

      <AppModalBody>
        <div className="space-y-5 border-t border-line pt-5">
          {state.item.modifierGroups.length > 0 ? (
            state.item.modifierGroups.map((group) => (
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
                        className={`min-h-10 rounded-full border px-4 text-sm font-bold ${
                          selected
                            ? "border-ink bg-ink text-white"
                            : "border-line bg-white text-ink"
                        }`}
                      >
                        {modifier.name}
                        {Number(modifier.price_delta)
                          ? ` +${formatCurrency(Number(modifier.price_delta))}`
                          : ""}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          ) : (
            <section>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted">
                Ingredients
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-ink">
                  Standard
                </span>
                <span className="rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-ink">
                  No changes
                </span>
              </div>
            </section>
          )}
        </div>

        <textarea
          value={state.comment}
          onChange={(event) => setState({ ...state, comment: event.target.value })}
          placeholder="Add a note for the kitchen..."
          className="mt-5 min-h-24 w-full rounded-[10px] border border-line bg-white px-3 py-3 text-sm outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
        />

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex h-11 items-center gap-2">
            <button
              type="button"
              onClick={() => setState({ ...state, qty: Math.max(1, state.qty - 1) })}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F0F0F0]"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-lg font-extrabold">{state.qty}</span>
            <button
              type="button"
              onClick={() => setState({ ...state, qty: state.qty + 1 })}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F0F0F0]"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-muted">Live total</p>
            <p className="text-2xl font-extrabold text-ink">
              {formatCurrency(unitPrice * state.qty)}
            </p>
          </div>
        </div>
      </AppModalBody>

      <AppModalFooter>
        <button
          type="button"
          onClick={onAdd}
          className="h-[52px] w-full rounded-[10px] bg-blue text-base font-extrabold text-white"
        >
          {editing ? "Update order" : "Add to order"}
        </button>
        {editing ? (
          <button
            type="button"
            onClick={onRemove}
            className="mt-3 h-10 w-full rounded-[10px] text-sm font-bold text-red-600"
          >
            Remove
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full text-center text-sm font-semibold text-muted"
          >
            Cancel
          </button>
        )}
      </AppModalFooter>
    </AppModal>
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
    <AppModal open onClose={onClose} containerClassName="max-w-[400px]">
      <AppModalHeader>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-muted">Payment</p>
            <h2 className="mt-2 text-4xl font-bold text-ink">
              {formatCurrency(total)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </AppModalHeader>

      <AppModalBody>
        <div className="grid grid-cols-2 gap-3">
          {(["cash", "card"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => setPayment({ ...payment, method })}
              className={`h-20 rounded-[20px] border text-xl font-extrabold ${
                payment.method === method
                  ? "border-blue bg-blueSoft text-ink"
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
      </AppModalBody>

      <AppModalFooter>
        <button
          type="button"
          disabled={isPending}
          onClick={onConfirm}
          className="h-[52px] w-full rounded-[10px] bg-ink text-base font-extrabold text-white transition hover:bg-clay disabled:opacity-50"
        >
          Confirm Payment
        </button>
      </AppModalFooter>
    </AppModal>
  );
}
