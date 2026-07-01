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
import { createClient } from "@/lib/supabase/browser";
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
import { useMemo, useRef, useState, useTransition } from "react";

type Tab = "categories" | "items" | "modifiers";

export function MenuBuilderClient({
  merchantId,
  categories,
  items,
  groups,
  modifiers,
  itemGroups,
  initialTab,
  error
}: {
  merchantId: string;
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
          merchantId={merchantId}
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
  items,
  merchantId
}: {
  categories: Category[];
  firstTimeSetup: boolean;
  groups: ModifierGroup[];
  itemGroups: ItemModifierGroup[];
  items: MenuItem[];
  merchantId: string;
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
            <ItemEditor categories={categories} groups={groups} merchantId={merchantId} />
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
              merchantId={merchantId}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={emptyTitle}
          primaryAction={
            <ItemEditor categories={categories} groups={groups} merchantId={merchantId} />
          }
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
  item,
  merchantId
}: {
  attachedGroupIds: string[];
  categories: Category[];
  categoryName: string;
  groups: ModifierGroup[];
  item: MenuItem;
  merchantId: string;
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
          merchantId={merchantId}
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
  item,
  merchantId
}: {
  attachedGroupIds?: string[];
  categories: Category[];
  groups: ModifierGroup[];
  item?: MenuItem;
  merchantId: string;
}) {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState({
    name: item?.name ?? "",
    category_id: item?.category_id ?? categories[0]?.id ?? "",
    price: String(item?.price ?? ""),
    description: item?.description ?? "",
    is_available: item?.is_available ?? true,
    groupIds: attachedGroupIds,
    imageUrl: item?.image_url ?? ""
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadToast, setUploadToast] = useState("");
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    required: false,
    multi_select: false,
    options: [
      { name: "", price_delta: "0" },
      { name: "", price_delta: "0" }
    ]
  });
  const attachedGroups = groups.filter((group) => state.groupIds.includes(group.id));
  const availableGroups = groups.filter((group) => !state.groupIds.includes(group.id));

  function showUploadError(message: string) {
    setUploadError(message);
    setUploadToast(message);
  }

  async function uploadImage(file: File) {
    setUploadError("");
    setUploadToast("");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      showUploadError("Upload a JPG, PNG, WebP, or GIF image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showUploadError("Image must be 5MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const safeName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();
      const path = `${merchantId}/item-${Date.now()}-${safeName || "image"}.${extension}`;
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("menu-images")
        .upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: true
        });

      if (error) {
        showUploadError(error.message);
        return;
      }

      const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
      setState((current) => ({ ...current, imageUrl: data.publicUrl }));
    } catch (caught) {
      showUploadError(caught instanceof Error ? caught.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function detachGroup(groupId: string) {
    setState({
      ...state,
      groupIds: state.groupIds.filter((id) => id !== groupId)
    });
  }

  function attachGroup(groupId: string) {
    setState({
      ...state,
      groupIds: [...state.groupIds, groupId]
    });
  }

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
      {uploadToast ? (
        <div
          role="alert"
          className="animate-tapp-toast fixed bottom-5 right-5 z-[60] max-w-[320px] rounded-[14px] bg-red-50 px-4 py-3 text-sm font-bold text-red-700 shadow-lift"
        >
          {uploadToast}
        </div>
      ) : null}
      {open ? (
        <ModalFrame onClose={() => setOpen(false)}>
          <form action={saveMenuItem}>
            <input type="hidden" name="id" value={item?.id ?? ""} />
            <input type="hidden" name="existing_image_url" value={state.imageUrl} />
            <input type="hidden" name="is_available" value={String(state.is_available)} />
            <ModalTitle eyebrow={item ? "Edit item" : "Add item"} title="Menu item" />
            <div className="grid gap-5">
              <section className="border-b border-line pb-5">
                <p className="mb-2 text-sm font-bold text-muted">Image</p>
                <label
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const [file] = Array.from(event.dataTransfer.files);
                    if (file) void uploadImage(file);
                  }}
                  className="group relative flex aspect-square w-full max-w-[180px] cursor-pointer items-center justify-center overflow-hidden rounded-[16px] border border-dashed border-line bg-white text-center shadow-soft"
                >
                  {state.imageUrl ? (
                    <img
                      src={state.imageUrl}
                      alt={state.name || "Item image preview"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="px-5">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-blueSoft text-blue">
                        <ImagePlus className="h-5 w-5" />
                      </div>
                      <p className="mt-3 text-sm font-bold text-ink">
                        Upload item image
                      </p>
                      <p className="mt-1 text-xs text-muted">Drop or choose an image</p>
                    </div>
                  )}
                  <span className="absolute inset-x-3 bottom-3 hidden rounded-full bg-ink/85 px-3 py-2 text-xs font-bold text-white group-hover:block">
                    {uploading ? "Uploading..." : state.imageUrl ? "Change" : "Choose image"}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.gif"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      if (file) void uploadImage(file);
                    }}
                  />
                </label>
                {uploadError ? (
                  <p className="mt-2 rounded-[10px] bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                    {uploadError}
                  </p>
                ) : null}
              </section>

              <section className="grid gap-4 border-b border-line pb-5">
                <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                  <Field label="Name">
                    <input
                      name="name"
                      value={state.name}
                      onChange={(event) => setState({ ...state, name: event.target.value })}
                      className="field"
                      required
                    />
                  </Field>
                  <Field label="Price">
                    <div className="flex h-11 items-center rounded-[10px] border border-line bg-white transition focus-within:border-blue focus-within:ring-4 focus-within:ring-blue/15">
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
                </div>
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
              <label className="flex items-center justify-between rounded-[12px] border border-line p-3">
                <span>
                  <span className="block text-sm font-bold text-ink">Available</span>
                  <span className="text-xs text-muted">Show this item in the POS grid</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setState({ ...state, is_available: !state.is_available })
                  }
                  className={`relative h-7 w-12 rounded-full transition ${
                    state.is_available ? "bg-blue" : "bg-[#E5E7EB]"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                      state.is_available ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </label>
              </section>

              <section>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-ink">Modifier groups</p>
                    <p className="text-xs text-muted">
                      Attach coffee-shop options like size, milk, syrup, and extras.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewGroupOpen((value) => !value)}
                    className="h-9 rounded-full border border-line bg-white px-3 text-xs font-bold text-ink hover:bg-[#FAFAFA]"
                  >
                    Create new group
                  </button>
                </div>

                {attachedGroups.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {attachedGroups.map((group) => (
                      <span
                        key={group.id}
                        className="inline-flex items-center gap-2 rounded-full bg-blueSoft px-3 py-1.5 text-xs font-bold text-ink"
                      >
                        {group.name}
                        <button
                          type="button"
                          onClick={() => detachGroup(group.id)}
                          className="text-muted hover:text-ink"
                          aria-label={`Detach ${group.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}

                {state.groupIds.map((groupId) => (
                  <input
                    key={groupId}
                    type="hidden"
                    name="modifier_group_ids"
                    value={groupId}
                  />
                ))}

                <div className="mt-3 grid gap-2">
                  {availableGroups.length > 0 ? (
                    availableGroups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => attachGroup(group.id)}
                        className="flex items-center justify-between rounded-[12px] border border-line bg-white p-3 text-left hover:bg-[#FAFAFA]"
                      >
                        <span>
                          <span className="block text-sm font-bold text-ink">
                            {group.name}
                          </span>
                          <span className="text-xs text-muted">
                            {group.required ? "Required" : "Optional"}
                            {group.multi_select ? " · Multi-select" : " · Single-select"}
                          </span>
                        </span>
                        <Plus className="h-4 w-4 text-muted" />
                      </button>
                    ))
                  ) : (
                    <p className="rounded-[12px] border border-line bg-white p-3 text-sm text-muted">
                      All existing modifier groups are attached.
                    </p>
                  )}
                </div>

                {newGroupOpen ? (
                  <div className="mt-3 rounded-[16px] border border-line bg-white p-4">
                    <input
                      type="hidden"
                      name="new_modifier_group_enabled"
                      value={newGroup.name.trim() ? "true" : "false"}
                    />
                    <Field label="New group name">
                      <input
                        name="new_modifier_group_name"
                        value={newGroup.name}
                        onChange={(event) =>
                          setNewGroup({ ...newGroup, name: event.target.value })
                        }
                        className="field"
                        placeholder="Milk"
                      />
                    </Field>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <ToggleField
                        checked={newGroup.required}
                        label="Required"
                        name="new_modifier_group_required"
                        onChange={() =>
                          setNewGroup({ ...newGroup, required: !newGroup.required })
                        }
                      />
                      <ToggleField
                        checked={newGroup.multi_select}
                        label="Multi-select"
                        name="new_modifier_group_multi_select"
                        onChange={() =>
                          setNewGroup({
                            ...newGroup,
                            multi_select: !newGroup.multi_select
                          })
                        }
                      />
                    </div>
                    <div className="mt-4 grid gap-2">
                      {newGroup.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            name="new_modifier_option_names"
                            value={option.name}
                            onChange={(event) => {
                              const options = [...newGroup.options];
                              options[index] = { ...option, name: event.target.value };
                              setNewGroup({ ...newGroup, options });
                            }}
                            className="field min-w-0 flex-1"
                            placeholder="Oat milk"
                          />
                          <div className="flex h-10 w-[110px] items-center rounded-[10px] border border-line bg-white">
                            <span className="pl-3 text-sm font-bold text-muted">€</span>
                            <input
                              name="new_modifier_option_prices"
                              value={option.price_delta}
                              onChange={(event) => {
                                const options = [...newGroup.options];
                                options[index] = {
                                  ...option,
                                  price_delta: event.target.value
                                };
                                setNewGroup({ ...newGroup, options });
                              }}
                              className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setNewGroup({
                                ...newGroup,
                                options: newGroup.options.filter((_, optionIndex) => optionIndex !== index)
                              })
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-red-50 text-red-700"
                            aria-label="Remove option"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setNewGroup({
                          ...newGroup,
                          options: [...newGroup.options, { name: "", price_delta: "0" }]
                        })
                      }
                      className="mt-3 text-sm font-bold text-blue"
                    >
                      Add option
                    </button>
                  </div>
                ) : null}
              </section>
            </div>
            <button className="mt-6 h-12 w-full rounded-[10px] bg-blue text-sm font-bold text-white">
              Save item
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 w-full text-center text-sm font-semibold text-muted"
            >
              Cancel
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

function ToggleField({
  checked,
  label,
  name,
  onChange
}: {
  checked: boolean;
  label: string;
  name: string;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-[12px] border border-line bg-white p-3">
      <span className="text-sm font-bold text-ink">{label}</span>
      <input type="hidden" name={name} value={checked ? "on" : "off"} />
      <button
        type="button"
        onClick={onChange}
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-blue" : "bg-[#E5E7EB]"
        }`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
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
