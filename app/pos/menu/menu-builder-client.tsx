"use client";

/* eslint-disable @next/next/no-img-element */

import {
  createCategory,
  deleteCategory,
  deleteMenuItem,
  deleteModifier,
  deleteModifierGroup,
  saveMenuItem,
  saveModifier,
  saveModifierGroup,
  toggleMenuItemAvailability,
  updateCategory,
  updateCategoryOrder
} from "@/app/pos/actions";
import { formatCurrency } from "@/lib/money";
import type {
  Category,
  ItemModifierGroup,
  MenuItem,
  Modifier,
  ModifierGroup
} from "@/lib/types";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  GripVertical,
  ImagePlus,
  Pencil,
  Plus,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

type Tab = "categories" | "items" | "modifiers";

export function MenuBuilderClient({
  merchantName,
  categories,
  items,
  groups,
  modifiers,
  itemGroups,
  initialTab,
  error,
  backHref = "/pos"
}: {
  merchantName: string;
  categories: Category[];
  items: MenuItem[];
  groups: ModifierGroup[];
  modifiers: Modifier[];
  itemGroups: ItemModifierGroup[];
  initialTab?: string;
  error?: string;
  backHref?: string;
}) {
  const [tab, setTab] = useState<Tab>(
    initialTab === "items" || initialTab === "modifiers" ? initialTab : "categories"
  );

  return (
    <main className="min-h-screen bg-transparent px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 rounded-[16px] border border-line bg-white p-4 shadow-soft md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={backHref}
              className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-line bg-white text-ink hover:bg-[#FAFAFA]"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-sm font-semibold text-muted">Menu builder</p>
              <h1 className="text-2xl font-extrabold text-ink">{merchantName}</h1>
            </div>
          </div>
          <div className="grid grid-cols-3 rounded-full border border-line bg-white p-1 shadow-soft">
            {(["categories", "items", "modifiers"] as Tab[]).map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => setTab(candidate)}
                className={`h-10 rounded-full px-4 text-sm font-extrabold capitalize ${
                  tab === candidate ? "bg-ink text-white shadow-soft" : "text-muted hover:bg-[#FAFAFA]"
                }`}
              >
                {candidate}
              </button>
            ))}
          </div>
        </header>

        {error ? (
          <p className="mb-4 rounded-[10px] bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </p>
        ) : null}

        {tab === "categories" ? (
          <CategoriesTab categories={categories} items={items} />
        ) : null}
        {tab === "items" ? (
          <ItemsTab
            categories={categories}
            items={items}
            groups={groups}
            itemGroups={itemGroups}
          />
        ) : null}
        {tab === "modifiers" ? (
          <ModifiersTab groups={groups} modifiers={modifiers} />
        ) : null}
      </div>
    </main>
  );
}

function CategoriesTab({
  categories,
  items
}: {
  categories: Category[];
  items: MenuItem[];
}) {
  const [ordered, setOrdered] = useState(categories);
  const sensors = useSensors(useSensor(PointerSensor));
  const [, startTransition] = useTransition();

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ordered.findIndex((category) => category.id === active.id);
    const newIndex = ordered.findIndex((category) => category.id === over.id);
    const next = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(next);
    startTransition(() => updateCategoryOrder(next.map((category) => category.id)));
  }

  return (
    <section className="space-y-5">
      <PanelHeader
        title="Categories"
        description="Drag to reorder how tabs appear on the POS."
        action={
          <form action={createCategory} className="flex gap-2">
            <input
              name="name"
              placeholder="Add Category"
              className="h-11 rounded-[10px] border border-line bg-white px-3 text-sm outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
            />
            <button className="h-11 rounded-[10px] bg-ink px-4 text-sm font-extrabold text-white">
              Add
            </button>
          </form>
        }
      />

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <SortableContext items={ordered.map((category) => category.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {ordered.map((category) => (
              <SortableCategoryRow
                key={category.id}
                category={category}
                itemCount={items.filter((item) => item.category_id === category.id).length}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function SortableCategoryRow({
  category,
  itemCount
}: {
  category: Category;
  itemCount: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: category.id
  });
  const [name, setName] = useState(category.name);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="grid gap-3 rounded-[16px] border border-line bg-white p-4 shadow-soft md:grid-cols-[auto_1fr_auto_auto]"
    >
      <button
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-line bg-white text-muted"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <form action={updateCategory} className="flex gap-2">
        <input type="hidden" name="id" value={category.id} />
        <input
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="h-11 min-w-0 flex-1 rounded-[10px] border border-line bg-white px-3 font-bold outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
        />
        <button className="h-11 rounded-[10px] border border-line bg-white px-3 text-sm font-bold text-ink hover:bg-[#FAFAFA]">
          Save
        </button>
      </form>
      <p className="self-center text-sm font-bold text-muted">{itemCount} items</p>
      <form action={deleteCategory}>
        <input type="hidden" name="id" value={category.id} />
        <button className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-red-50 text-red-700">
          <Trash2 className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function ItemsTab({
  categories,
  items,
  groups,
  itemGroups
}: {
  categories: Category[];
  items: MenuItem[];
  groups: ModifierGroup[];
  itemGroups: ItemModifierGroup[];
}) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? items : items.filter((item) => item.category_id === filter);
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  return (
    <section className="space-y-5">
      <PanelHeader
        title="Items"
        description="Create menu items and attach modifiers."
        action={<ItemEditor categories={categories} groups={groups} />}
      />
      <select
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        className="h-11 rounded-[10px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
      >
        <option value="all">All categories</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="grid gap-4 rounded-[16px] border border-line bg-white p-4 shadow-soft transition hover:bg-[#FAFAFA] md:grid-cols-[64px_1fr_auto_auto_auto]"
          >
            <ItemThumb item={item} />
            <div>
              <p className="font-extrabold text-ink">{item.name}</p>
              <p className="text-sm text-muted">
                {categoryById.get(item.category_id)?.name ?? "No category"} ·{" "}
                {formatCurrency(Number(item.price))}
              </p>
            </div>
            <form action={toggleMenuItemAvailability}>
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="is_available" value={String(item.is_available)} />
              <button
                className={`h-9 rounded-full px-3 text-xs font-extrabold ${
                  item.is_available ? "bg-[#ECFDF5] text-green-700" : "bg-white/50 text-muted"
                }`}
              >
                {item.is_available ? "Available" : "Hidden"}
              </button>
            </form>
            <ItemEditor
              categories={categories}
              groups={groups}
              item={item}
              attachedGroupIds={itemGroups
                .filter((link) => link.item_id === item.id)
                .map((link) => link.group_id)}
            />
            <form action={deleteMenuItem}>
              <input type="hidden" name="id" value={item.id} />
              <button className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-red-50 text-red-700">
                <Trash2 className="h-4 w-4" />
              </button>
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}

function ItemEditor({
  categories,
  groups,
  item,
  attachedGroupIds = []
}: {
  categories: Category[];
  groups: ModifierGroup[];
  item?: MenuItem;
  attachedGroupIds?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState({
    name: item?.name ?? "",
    category_id: item?.category_id ?? categories[0]?.id ?? "",
    price: String(item?.price ?? ""),
    description: item?.description ?? "",
    is_available: item?.is_available ?? true,
    groupIds: attachedGroupIds
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] bg-ink px-3 text-sm font-bold text-white"
      >
        {item ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {item ? "Edit" : "Add Item"}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            action={saveMenuItem}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[20px] border border-line bg-white p-6 shadow-lift"
          >
            <input type="hidden" name="id" value={item?.id ?? ""} />
            <input type="hidden" name="existing_image_url" value={item?.image_url ?? ""} />
            <input
              type="hidden"
              name="is_available"
              value={String(state.is_available)}
            />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-muted">
                  {item ? "Edit Item" : "Add Item"}
                </p>
                <h2 className="mt-1 text-2xl font-extrabold text-ink">
                  Menu item
                </h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-muted">
                Close
              </button>
            </div>
            <div className="mt-5 grid gap-4">
              <Field label="Name">
                <input name="name" value={state.name} onChange={(event) => setState({ ...state, name: event.target.value })} className="field" required />
              </Field>
              <Field label="Category">
                <select name="category_id" value={state.category_id} onChange={(event) => setState({ ...state, category_id: event.target.value })} className="field">
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Price">
                <div className="flex h-11 items-center rounded-[10px] border border-line bg-white">
                  <span className="pl-3 font-bold text-muted">€</span>
                  <input name="price" value={state.price} onChange={(event) => setState({ ...state, price: event.target.value })} className="min-w-0 flex-1 px-2 outline-none" required />
                </div>
              </Field>
              <Field label="Description">
                <textarea name="description" value={state.description} onChange={(event) => setState({ ...state, description: event.target.value })} className="min-h-24 rounded-[10px] border border-line bg-white px-3 py-2 outline-none focus:border-ink focus:ring-4 focus:ring-ink/10" />
              </Field>
              <Field label="Image">
                <label className="flex cursor-pointer items-center gap-3 rounded-[16px] border border-dashed border-line bg-white p-4 hover:bg-[#FAFAFA]">
                  <ImagePlus className="h-5 w-5 text-ink" />
                  <span className="text-sm font-bold text-muted">Upload item image</span>
                  <input name="image" type="file" accept="image/*" className="sr-only" />
                </label>
              </Field>
              <Field label="Modifier groups">
                <div className="grid gap-2 sm:grid-cols-2">
                  {groups.map((group) => {
                    const checked = state.groupIds.includes(group.id);
                    return (
                      <label key={group.id} className="flex items-center gap-2 rounded-[12px] border border-line p-3 text-sm font-bold">
                        <input
                          type="checkbox"
                          name="modifier_group_ids"
                          value={group.id}
                          checked={checked}
                          onChange={() =>
                            setState({
                              ...state,
                              groupIds: checked
                                ? state.groupIds.filter((id) => id !== group.id)
                                : [...state.groupIds, group.id]
                            })
                          }
                        />
                        {group.name}
                      </label>
                    );
                  })}
                </div>
              </Field>
            </div>
            <button className="mt-6 h-12 w-full rounded-[10px] bg-ink text-sm font-extrabold text-white">
              Save item
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}

function ModifiersTab({
  groups,
  modifiers
}: {
  groups: ModifierGroup[];
  modifiers: Modifier[];
}) {
  return (
    <section className="space-y-5">
      <PanelHeader
        title="Modifiers"
        description="Build size, milk, sugar, and other upsell options."
        action={<ModifierGroupForm />}
      />
      <div className="space-y-3">
        {groups.map((group) => (
          <details key={group.id} className="rounded-[16px] border border-line bg-white p-4 shadow-soft">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div>
                <p className="text-lg font-extrabold text-ink">{group.name}</p>
                <div className="mt-2 flex gap-2">
                  {group.required ? <Badge>Required</Badge> : null}
                  {group.multi_select ? <Badge>Multi-select</Badge> : <Badge>Single</Badge>}
                  <Badge>{modifiers.filter((modifier) => modifier.group_id === group.id).length} options</Badge>
                </div>
              </div>
              <ChevronText />
            </summary>
            <div className="mt-5 space-y-3 border-t border-line pt-4">
              <ModifierGroupForm group={group} />
              {modifiers
                .filter((modifier) => modifier.group_id === group.id)
                .map((modifier) => (
                  <ModifierForm key={modifier.id} groupId={group.id} modifier={modifier} />
                ))}
              <ModifierForm groupId={group.id} />
              <form action={deleteModifierGroup}>
                <input type="hidden" name="id" value={group.id} />
                <button className="mt-2 rounded-[10px] bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                  Delete group
                </button>
              </form>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function ModifierGroupForm({ group }: { group?: ModifierGroup }) {
  const [state, setState] = useState({
    name: group?.name ?? "",
    required: group?.required ?? false,
    multi_select: group?.multi_select ?? false
  });

  return (
    <form action={saveModifierGroup} className="grid gap-2 rounded-[16px] border border-line bg-white p-3 shadow-soft md:grid-cols-[1fr_auto_auto_auto]">
      <input type="hidden" name="id" value={group?.id ?? ""} />
      <input name="name" value={state.name} onChange={(event) => setState({ ...state, name: event.target.value })} placeholder="Group name" className="field" />
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" name="required" checked={state.required} onChange={() => setState({ ...state, required: !state.required })} />
        Required
      </label>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" name="multi_select" checked={state.multi_select} onChange={() => setState({ ...state, multi_select: !state.multi_select })} />
        Multi
      </label>
      <button className="rounded-[10px] bg-ink px-3 py-2 text-sm font-bold text-white">
        {group ? "Save" : "Add Group"}
      </button>
    </form>
  );
}

function ModifierForm({
  groupId,
  modifier
}: {
  groupId: string;
  modifier?: Modifier;
}) {
  const [state, setState] = useState({
    name: modifier?.name ?? "",
    price_delta: String(modifier?.price_delta ?? 0)
  });

  return (
    <form action={saveModifier} className="grid gap-2 md:grid-cols-[1fr_120px_auto_auto]">
      <input type="hidden" name="id" value={modifier?.id ?? ""} />
      <input type="hidden" name="group_id" value={groupId} />
      <input name="name" value={state.name} onChange={(event) => setState({ ...state, name: event.target.value })} placeholder="Modifier name" className="field" />
      <input name="price_delta" value={state.price_delta} onChange={(event) => setState({ ...state, price_delta: event.target.value })} className="field" />
      <button className="rounded-[10px] bg-ink px-3 py-2 text-sm font-bold text-white">
        {modifier ? "Save" : "Add"}
      </button>
      {modifier ? (
        <button formAction={deleteModifier} className="rounded-[10px] bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          Delete
        </button>
      ) : null}
    </form>
  );
}

function PanelHeader({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-[16px] border border-line bg-white p-5 shadow-soft md:flex-row md:items-center">
      <div>
        <p className="text-sm font-semibold text-muted">{title}</p>
        <h2 className="mt-1 text-2xl font-extrabold text-ink">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-muted">
      {label}
      {children}
    </label>
  );
}

function ItemThumb({ item }: { item: MenuItem }) {
  if (item.image_url) {
    return <img src={item.image_url} alt={item.name} className="h-16 w-16 rounded-2xl object-cover" />;
  }
  return (
    <div className="solid-mark flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-extrabold text-white shadow-soft">
      {item.name[0]?.toUpperCase()}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-extrabold text-ink">
      {children}
    </span>
  );
}

function ChevronText() {
  return <span className="text-sm font-bold text-muted">Expand</span>;
}
