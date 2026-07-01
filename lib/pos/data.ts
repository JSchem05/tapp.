import type {
  Category,
  ItemModifierGroup,
  MenuItem,
  Modifier,
  ModifierGroup,
  Staff,
  Tag
} from "@/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PosModifierGroup = ModifierGroup & {
  modifiers: Modifier[];
};

export type PosMenuItem = MenuItem & {
  modifierGroups: PosModifierGroup[];
};

export type PosData = {
  categories: Category[];
  items: PosMenuItem[];
  tags: Tag[];
  staff: Staff[];
  popularItemIds: string[];
};

function countItemFrequency(
  rows: Array<{ items: Array<{ item_id?: string; name?: string; qty?: number }> }>,
  nameToId: Map<string, string>
) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const item of row.items ?? []) {
      const id =
        item.item_id ??
        (item.name ? nameToId.get(item.name.trim().toLowerCase()) : undefined);
      if (!id) continue;
      counts.set(id, (counts.get(id) ?? 0) + (Number(item.qty) || 1));
    }
  }
  return counts;
}

async function loadPopularItemIds(
  supabase: SupabaseClient,
  merchantId: string,
  menuItems: PosMenuItem[]
): Promise<string[]> {
  const nameToId = new Map(
    menuItems.map((item) => [item.name.trim().toLowerCase(), item.id])
  );

  const [{ data: orders }, { data: receipts }] = await Promise.all([
    supabase
      .from("orders")
      .select("items")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("receipts")
      .select("items")
      .eq("merchant_id", merchantId)
      .order("created_at", { ascending: false })
      .limit(500)
  ]);

  const counts = countItemFrequency(
    [...(orders ?? []), ...(receipts ?? [])],
    nameToId
  );

  const ranked = Array.from(counts.entries())
    .sort((first, second) => second[1] - first[1])
    .map(([id]) => id)
    .filter((id) => menuItems.some((item) => item.id === id));

  if (ranked.length >= 4) {
    return ranked.slice(0, 4);
  }

  const fallback = menuItems
    .filter((item) => item.is_available && !ranked.includes(item.id))
    .sort((first, second) => first.sort_order - second.sort_order)
    .map((item) => item.id);

  return [...ranked, ...fallback].slice(0, 4);
}

export async function loadPosData(
  supabase: SupabaseClient,
  merchantId: string
): Promise<PosData> {
  const [
    { data: categories },
    { data: items },
    { data: groups },
    { data: modifiers },
    { data: itemGroups },
    { data: tags },
    { data: staff }
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("sort_order")
      .returns<Category[]>(),
    supabase
      .from("menu_items")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("sort_order")
      .returns<MenuItem[]>(),
    supabase
      .from("modifier_groups")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("created_at")
      .returns<ModifierGroup[]>(),
    supabase.from("modifiers").select("*").returns<Modifier[]>(),
    supabase.from("item_modifier_groups").select("*").returns<ItemModifierGroup[]>(),
    supabase
      .from("tags")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("created_at")
      .returns<Tag[]>(),
    supabase
      .from("staff")
      .select("*")
      .eq("merchant_id", merchantId)
      .order("created_at")
      .returns<Staff[]>()
  ]);

  const modifierMap = new Map<string, Modifier[]>();
  for (const modifier of modifiers ?? []) {
    modifierMap.set(modifier.group_id, [
      ...(modifierMap.get(modifier.group_id) ?? []),
      modifier
    ]);
  }

  const groupMap = new Map(
    (groups ?? []).map((group) => [
      group.id,
      { ...group, modifiers: modifierMap.get(group.id) ?? [] }
    ])
  );

  const itemGroupMap = new Map<string, PosModifierGroup[]>();
  for (const link of itemGroups ?? []) {
    const group = groupMap.get(link.group_id);
    if (group) {
      itemGroupMap.set(link.item_id, [
        ...(itemGroupMap.get(link.item_id) ?? []),
        group
      ]);
    }
  }

  const menuItems: PosMenuItem[] = (items ?? []).map((item) => ({
    ...item,
    modifierGroups: itemGroupMap.get(item.id) ?? []
  }));

  const uniqueCategories: Category[] = [];
  const categoryIdByName = new Map<string, string>();
  for (const category of categories ?? []) {
    const key = category.name.trim().toLowerCase();
    const existingId = categoryIdByName.get(key);
    if (!existingId) {
      uniqueCategories.push(category);
      categoryIdByName.set(key, category.id);
    }
  }

  const categoryRemap = new Map(
    (categories ?? []).map((category) => [
      category.id,
      categoryIdByName.get(category.name.trim().toLowerCase()) ?? category.id
    ])
  );

  const dedupedMenuItems = menuItems.map((item) => ({
    ...item,
    category_id: categoryRemap.get(item.category_id) ?? item.category_id
  }));

  const popularItemIds = await loadPopularItemIds(
    supabase,
    merchantId,
    dedupedMenuItems
  );

  return {
    categories: uniqueCategories,
    items: dedupedMenuItems,
    tags: tags ?? [],
    staff: staff ?? [],
    popularItemIds
  };
}
