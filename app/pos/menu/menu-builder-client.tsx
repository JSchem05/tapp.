"use client";

/* eslint-disable @next/next/no-img-element */

import {
  createCategory,
  deleteCategory,
  deleteMenuItem,
  deleteModifier,
  deleteModifierGroup,
  loadSampleMenu,
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
  Check,
  ChevronRight,
  GripVertical,
  ImagePlus,
  MenuSquare,
  Pencil,
  Plus,
  Trash2,
  X
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";

type Tab = "categories" | "items" | "modifiers";

export function MenuBuilderClient({
  categories,
  items,
  groups,
  modifiers,
  itemGroups,
  initialTab,
  error
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
  const firstTimeSetup = categories.length === 0 && items.length === 0;

  return (
    <div className="animate-tapp-fade pb-8">
      <header className="mx-8 flex min-h-16 flex-nowrap items-center justify-between pt-8">
        <div>
          <h1 className="text-[28px] font-bold leading-[1.2] tracking-tight text-ink">
            Menu Builder
          </h1>
          <p className="mt-1 text-sm text-muted">
            Manage categories, items, and modifiers
          </p>
        </div>
        <div aria-hidden="true" />
      </header>

      {error ? (
        <p className="mx-8 mt-6 rounded-[10px] bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mx-8 my-6 flex gap-2">
        {(["categories", "items", "modifiers"] as Tab[]).map((candidate) => (
          <button
            key={candidate}
            type="button"
            onClick={() => setTab(candidate)}
            className={`h-9 rounded-full border px-4 text-sm font-bold capitalize ${
              tab === candidate
                ? "border-ink bg-ink text-white"
                : "border-line bg-white text-ink hover:bg-[#FAFAFA]"
            }`}
          >
            {candidate}
          </button>
        ))}
      </div>

      {tab === "categories" ? (
        <CategoriesTab
          categories={categories}
          firstTimeSetup={firstTimeSetup}
          items={items}
        />
      ) : null}
      {tab === "items" ? (
        <ItemsTab
          categories={categories}
          firstTimeSetup={firstTimeSetup}
          groups={groups}
          itemGroups={itemGroups}
          items={items}
        />
      ) : null}
      {tab === "modifiers" ? (
        <ModifiersTab groups={groups} modifiers={modifiers} />
      ) : null}
    </div>
  );
}

function CategoriesTab({
  categories,
  firstTimeSetup,
  items
}: {
  categories: Category[];
  firstTimeSetup: boolean;
  items: MenuItem[];
}) {
  const [ordered, setOrdered] = useState(categories);
  const [editorOpen, setEditorOpen] = useState(false);
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
    <section className="mx-8">
      <SectionHeader
        title="Categories"
        action={
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            Add category
          </button>
        }
      />

      {ordered.length > 0 ? (
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <SortableContext
            items={ordered.map((category) => category.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="mt-4">
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
      ) : (
        <EmptyState
          title="No categories yet"
          primaryAction={
            <button
              type="button"
              onClick={() => setEditorOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white"
            >
              <Plus className="h-4 w-4" />
              Add category
            </button>
          }
          secondaryAction={firstTimeSetup ? <LoadSampleButton /> : null}
        />
      )}

      {editorOpen ? (
        <CategoryEditorModal onClose={() => setEditorOpen(false)} />
      ) : null}
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
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="mb-2 flex items-center rounded-[16px] border border-line bg-white p-4 shadow-soft"
    >
      <button
        type="button"
        className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-line bg-white text-muted"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${category.name}`}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <p className="truncate text-sm font-semibold text-ink">{category.name}</p>
        <span className="shrink-0 rounded-full bg-[#F0F0F0] px-2 py-1 text-xs font-semibold text-muted">
          {itemCount} items
        </span>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-white text-muted hover:text-ink"
          aria-label={`Edit ${category.name}`}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <form action={deleteCategory}>
          <input type="hidden" name="id" value={category.id} />
          <button
            className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-red-50 text-red-700"
            aria-label={`Delete ${category.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </form>
      </div>

      {editorOpen ? (
        <CategoryEditorModal category={category} onClose={() => setEditorOpen(false)} />
      ) : null}
    </div>
  );
}

function CategoryEditorModal({
  category,
  onClose
}: {
  category?: Category;
  onClose: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");

  return (
    <ModalFrame onClose={onClose}>
      <form action={category ? updateCategory : createCategory}>
        <input type="hidden" name="id" value={category?.id ?? ""} />
        <ModalTitle eyebrow={category ? "Edit category" : "Add category"} title="Category" />
        <Field label="Category name">
          <input
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="field"
            placeholder="Coffee"
            required
          />
        </Field>
        <button className="mt-6 h-12 w-full rounded-[10px] bg-blue text-sm font-bold text-white">
          Save category
        </button>
      </form>
    </ModalFrame>
  );
}

function ItemsTab({
  categories,
  firstTimeSetup,
  groups,
  itemGroups,
  items
}: {
  categories: Category[];
  firstTimeSetup: boolean;
  groups: ModifierGroup[];
  itemGroups: ItemModifierGroup[];
  items: MenuItem[];
}) {
  const [filter, setFilter] = useState("all");
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );
  const filtered =
    filter === "all" ? items : items.filter((item) => item.category_id === filter);
  const emptyTitle = filter === "all" ? "No items yet" : "No items in this category";

  return (
    <section className="mx-8">
      <SectionHeader
        title="Items"
        action={
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="h-9 rounded-[10px] border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <ItemEditor categories={categories} groups={groups} />
          </div>
        }
      />

      {filtered.length > 0 ? (
        <div className="mt-4">
          {filtered.map((item) => (
            <ItemRow
              key={item.id}
              attachedGroupIds={itemGroups
                .filter((link) => link.item_id === item.id)
                .map((link) => link.group_id)}
              categories={categories}
              categoryName={categoryById.get(item.category_id)?.name ?? "No category"}
              groups={groups}
              item={item}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={emptyTitle}
          primaryAction={<ItemEditor categories={categories} groups={groups} />}
          secondaryAction={firstTimeSetup ? <LoadSampleButton /> : null}
        />
      )}
    </section>
  );
}

function ItemRow({
  attachedGroupIds,
  categories,
  categoryName,
  groups,
  item
}: {
  attachedGroupIds: string[];
  categories: Category[];
  categoryName: string;
  groups: ModifierGroup[];
  item: MenuItem;
}) {
  return (
    <div className="mb-2 flex items-center rounded-[16px] border border-line bg-white p-4 shadow-soft">
      <ItemThumb item={item} />
      <div className="ml-3 min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
        <p className="mt-0.5 truncate text-xs text-muted">{categoryName}</p>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-3">
        <p className="min-w-[72px] text-right text-sm font-semibold text-ink">
          {formatCurrency(Number(item.price))}
        </p>
        <form action={toggleMenuItemAvailability}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="is_available" value={String(item.is_available)} />
          <button
            className={`relative h-7 w-12 rounded-full transition ${
              item.is_available ? "bg-blue" : "bg-[#E5E7EB]"
            }`}
            aria-label={`${item.is_available ? "Hide" : "Show"} ${item.name}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                item.is_available ? "left-6" : "left-1"
              }`}
            />
          </button>
        </form>
        <ItemEditor
          attachedGroupIds={attachedGroupIds}
          categories={categories}
          groups={groups}
          item={item}
        />
        <form action={deleteMenuItem}>
          <input type="hidden" name="id" value={item.id} />
          <button
            className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-red-50 text-red-700"
            aria-label={`Delete ${item.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function ItemEditor({
  attachedGroupIds = [],
  categories,
  groups,
  item
}: {
  attachedGroupIds?: string[];
  categories: Category[];
  groups: ModifierGroup[];
  item?: MenuItem;
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
        className={
          item
            ? "flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-white text-muted hover:text-ink"
            : "inline-flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white"
        }
        aria-label={item ? `Edit ${item.name}` : "Add item"}
      >
        {item ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {item ? null : "Add item"}
      </button>
      {open ? (
        <ModalFrame onClose={() => setOpen(false)}>
          <form action={saveMenuItem}>
            <input type="hidden" name="id" value={item?.id ?? ""} />
            <input type="hidden" name="existing_image_url" value={item?.image_url ?? ""} />
            <input type="hidden" name="is_available" value={String(state.is_available)} />
            <ModalTitle eyebrow={item ? "Edit item" : "Add item"} title="Menu item" />
            <div className="grid gap-4">
              <Field label="Name">
                <input
                  name="name"
                  value={state.name}
                  onChange={(event) => setState({ ...state, name: event.target.value })}
                  className="field"
                  required
                />
              </Field>
              <Field label="Category">
                <select
                  name="category_id"
                  value={state.category_id}
                  onChange={(event) =>
                    setState({ ...state, category_id: event.target.value })
                  }
                  className="field"
                  required
                >
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
                  <input
                    name="price"
                    value={state.price}
                    onChange={(event) => setState({ ...state, price: event.target.value })}
                    className="min-w-0 flex-1 bg-transparent px-2 outline-none"
                    required
                  />
                </div>
              </Field>
              <Field label="Description">
                <textarea
                  name="description"
                  value={state.description}
                  onChange={(event) =>
                    setState({ ...state, description: event.target.value })
                  }
                  className="min-h-24 rounded-[10px] border border-line bg-white px-3 py-2 outline-none focus:border-ink focus:ring-4 focus:ring-ink/10"
                />
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
                  {groups.length > 0 ? (
                    groups.map((group) => {
                      const checked = state.groupIds.includes(group.id);
                      return (
                        <label
                          key={group.id}
                          className="flex items-center gap-2 rounded-[12px] border border-line p-3 text-sm font-bold text-ink"
                        >
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
                    })
                  ) : (
                    <p className="text-sm text-muted">No modifier groups yet.</p>
                  )}
                </div>
              </Field>
            </div>
            <button className="mt-6 h-12 w-full rounded-[10px] bg-blue text-sm font-bold text-white">
              Save item
            </button>
          </form>
        </ModalFrame>
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
  const [groupEditorOpen, setGroupEditorOpen] = useState(false);

  return (
    <section className="mx-8">
      <SectionHeader
        title="Modifiers"
        action={
          <button
            type="button"
            onClick={() => setGroupEditorOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white"
          >
            <Plus className="h-4 w-4" />
            Add group
          </button>
        }
      />

      {groups.length > 0 ? (
        <div className="mt-4">
          {groups.map((group) => (
            <ModifierGroupRow
              key={group.id}
              group={group}
              modifiers={modifiers.filter((modifier) => modifier.group_id === group.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No modifier groups yet"
          primaryAction={
            <button
              type="button"
              onClick={() => setGroupEditorOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white"
            >
              <Plus className="h-4 w-4" />
              Add group
            </button>
          }
        />
      )}

      {groupEditorOpen ? (
        <ModifierGroupModal onClose={() => setGroupEditorOpen(false)} />
      ) : null}
    </section>
  );
}

function ModifierGroupRow({
  group,
  modifiers
}: {
  group: ModifierGroup;
  modifiers: Modifier[];
}) {
  const [open, setOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  return (
    <div className="mb-2 rounded-[16px] border border-line bg-white p-4 shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center text-left"
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink">{group.name}</p>
          {group.required ? <InlineBadge>Required</InlineBadge> : null}
          {group.multi_select ? <InlineBadge>Multi-select</InlineBadge> : null}
        </div>
        <ChevronRight
          className={`h-4 w-4 shrink-0 text-muted transition ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>

      {open ? (
        <div className="mt-4 border-t border-[#F3F4F6] pt-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-muted">{modifiers.length} options</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-line bg-white text-muted hover:text-ink"
                aria-label={`Edit ${group.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <form action={deleteModifierGroup}>
                <input type="hidden" name="id" value={group.id} />
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-red-50 text-red-700"
                  aria-label={`Delete ${group.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
          <div className="grid gap-2">
            {modifiers.map((modifier) => (
              <ModifierOptionRow key={modifier.id} groupId={group.id} modifier={modifier} />
            ))}
            <ModifierOptionRow groupId={group.id} />
          </div>
        </div>
      ) : null}

      {editorOpen ? (
        <ModifierGroupModal group={group} onClose={() => setEditorOpen(false)} />
      ) : null}
    </div>
  );
}

function ModifierGroupModal({
  group,
  onClose
}: {
  group?: ModifierGroup;
  onClose: () => void;
}) {
  const [state, setState] = useState({
    name: group?.name ?? "",
    required: group?.required ?? false,
    multi_select: group?.multi_select ?? false
  });

  return (
    <ModalFrame onClose={onClose}>
      <form action={saveModifierGroup}>
        <input type="hidden" name="id" value={group?.id ?? ""} />
        <ModalTitle eyebrow={group ? "Edit group" : "Add group"} title="Modifier group" />
        <div className="grid gap-4">
          <Field label="Group name">
            <input
              name="name"
              value={state.name}
              onChange={(event) => setState({ ...state, name: event.target.value })}
              className="field"
              placeholder="Milk"
              required
            />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 rounded-[12px] border border-line p-3 text-sm font-bold text-ink">
              <input
                type="checkbox"
                name="required"
                checked={state.required}
                onChange={() => setState({ ...state, required: !state.required })}
              />
              Required
            </label>
            <label className="flex items-center gap-2 rounded-[12px] border border-line p-3 text-sm font-bold text-ink">
              <input
                type="checkbox"
                name="multi_select"
                checked={state.multi_select}
                onChange={() =>
                  setState({ ...state, multi_select: !state.multi_select })
                }
              />
              Multi-select
            </label>
          </div>
        </div>
        <button className="mt-6 h-12 w-full rounded-[10px] bg-blue text-sm font-bold text-white">
          Save group
        </button>
      </form>
    </ModalFrame>
  );
}

function ModifierOptionRow({
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
    <form action={saveModifier} className="flex items-center gap-2">
      <input type="hidden" name="id" value={modifier?.id ?? ""} />
      <input type="hidden" name="group_id" value={groupId} />
      <input
        name="name"
        value={state.name}
        onChange={(event) => setState({ ...state, name: event.target.value })}
        placeholder={modifier ? "Option name" : "Add option"}
        className="field min-w-0 flex-1"
        required={!modifier}
      />
      <div className="flex h-10 w-[120px] items-center rounded-[10px] border border-line bg-white">
        <span className="pl-3 text-sm font-bold text-muted">€</span>
        <input
          name="price_delta"
          value={state.price_delta}
          onChange={(event) => setState({ ...state, price_delta: event.target.value })}
          className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
        />
      </div>
      <button
        className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-ink text-white"
        aria-label={modifier ? "Save option" : "Add option"}
      >
        {modifier ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </button>
      {modifier ? (
        <button
          formAction={deleteModifier}
          className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-red-50 text-red-700"
          aria-label="Remove option"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </form>
  );
}

function SectionHeader({
  action,
  title
}: {
  action: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="flex shrink-0 items-center gap-2">{action}</div>
    </div>
  );
}

function EmptyState({
  primaryAction,
  secondaryAction,
  title
}: {
  primaryAction: React.ReactNode;
  secondaryAction?: React.ReactNode;
  title: string;
}) {
  return (
    <div className="mt-4 flex min-h-[240px] flex-col items-center justify-center rounded-[16px] border border-dashed border-line bg-white p-6 text-center shadow-soft">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blueSoft text-blue">
        <MenuSquare className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      <div className="mt-4 flex items-center gap-2">
        {primaryAction}
        {secondaryAction}
      </div>
    </div>
  );
}

function LoadSampleButton() {
  return (
    <form action={loadSampleMenu}>
      <button className="inline-flex h-10 items-center rounded-full border border-line bg-white px-4 text-sm font-bold text-ink hover:bg-[#FAFAFA]">
        Load sample menu
      </button>
    </form>
  );
}

function Field({
  children,
  label
}: {
  children: React.ReactNode;
  label: string;
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
    return (
      <img
        src={item.image_url}
        alt={item.name}
        className="h-11 w-11 shrink-0 rounded-[10px] object-cover"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-blue text-sm font-bold text-white">
      {item.name[0]?.toUpperCase()}
    </div>
  );
}

function InlineBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 rounded-full bg-[#F0F0F0] px-2 py-1 text-[11px] font-semibold text-muted">
      {children}
    </span>
  );
}

function ModalFrame({
  children,
  onClose
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="animate-tapp-fade max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-[24px] border border-line bg-white p-6 shadow-lift">
        <div className="mb-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="text-sm font-semibold text-muted">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold text-ink">{title}</h2>
    </div>
  );
}
