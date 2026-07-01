import type { Category, MenuItem } from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

type CategoryForDedupe = Pick<
  Category,
  "id" | "merchant_id" | "name" | "sort_order" | "created_at"
>;
type MenuItemForDedupe = Pick<
  MenuItem,
  "id" | "merchant_id" | "category_id" | "name" | "price" | "sort_order" | "created_at"
>;

export function normalizeCategoryDisplayName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeCategoryName(name: string) {
  return normalizeCategoryDisplayName(name).toLowerCase();
}

export async function dedupeMerchantCategories(
  supabase: SupabaseClient,
  merchantId: string
) {
  const { data: categories } = await supabase
    .from("categories")
    .select("id, merchant_id, name, sort_order, created_at")
    .eq("merchant_id", merchantId)
    .returns<CategoryForDedupe[]>();

  const categoriesByName = new Map<string, CategoryForDedupe[]>();
  for (const category of categories ?? []) {
    const key = normalizeCategoryName(category.name);
    categoriesByName.set(key, [...(categoriesByName.get(key) ?? []), category]);
  }

  for (const duplicateSet of Array.from(categoriesByName.values())) {
    if (duplicateSet.length <= 1) continue;

    const [keep, ...duplicates] = duplicateSet.sort(compareCategoriesForDedupe);
    const duplicateIds = duplicates.map((category) => category.id);

    await supabase
      .from("menu_items")
      .update({ category_id: keep.id })
      .eq("merchant_id", merchantId)
      .in("category_id", duplicateIds);

    await supabase
      .from("categories")
      .delete()
      .eq("merchant_id", merchantId)
      .in("id", duplicateIds);
  }

  await dedupeMerchantMenuItems(supabase, merchantId);
}

async function dedupeMerchantMenuItems(supabase: SupabaseClient, merchantId: string) {
  const { data: items } = await supabase
    .from("menu_items")
    .select("id, merchant_id, category_id, name, price, sort_order, created_at")
    .eq("merchant_id", merchantId)
    .returns<MenuItemForDedupe[]>();

  const itemsByFingerprint = new Map<string, MenuItemForDedupe[]>();
  for (const item of items ?? []) {
    const key = [
      item.category_id,
      normalizeCategoryName(item.name),
      Number(item.price).toFixed(2)
    ].join("::");
    itemsByFingerprint.set(key, [...(itemsByFingerprint.get(key) ?? []), item]);
  }

  for (const duplicateSet of Array.from(itemsByFingerprint.values())) {
    if (duplicateSet.length <= 1) continue;

    const [, ...duplicates] = duplicateSet.sort(compareMenuItemsForDedupe);
    const duplicateIds = duplicates.map((item) => item.id);

    await supabase
      .from("menu_items")
      .delete()
      .eq("merchant_id", merchantId)
      .in("id", duplicateIds);
  }
}

function compareCategoriesForDedupe(
  first: CategoryForDedupe,
  second: CategoryForDedupe
) {
  const createdDelta = Date.parse(first.created_at) - Date.parse(second.created_at);
  if (createdDelta !== 0) return createdDelta;

  if (first.sort_order !== second.sort_order) {
    return first.sort_order - second.sort_order;
  }

  return first.id.localeCompare(second.id);
}

function compareMenuItemsForDedupe(first: MenuItemForDedupe, second: MenuItemForDedupe) {
  const createdDelta = Date.parse(first.created_at) - Date.parse(second.created_at);
  if (createdDelta !== 0) return createdDelta;

  if (first.sort_order !== second.sort_order) {
    return first.sort_order - second.sort_order;
  }

  return first.id.localeCompare(second.id);
}
