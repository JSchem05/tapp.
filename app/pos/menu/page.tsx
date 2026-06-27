import { MenuBuilderClient } from "@/app/pos/menu/menu-builder-client";
import { getAuthedMerchant } from "@/lib/auth";
import type {
  Category,
  ItemModifierGroup,
  MenuItem,
  Modifier,
  ModifierGroup
} from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PosMenuPage({
  searchParams
}: {
  searchParams?: { tab?: string; error?: string };
}) {
  const { supabase, merchant } = await getAuthedMerchant();
  const [
    { data: categories },
    { data: items },
    { data: groups },
    { data: modifiers },
    { data: itemGroups }
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("sort_order")
      .returns<Category[]>(),
    supabase
      .from("menu_items")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("sort_order")
      .returns<MenuItem[]>(),
    supabase
      .from("modifier_groups")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("created_at")
      .returns<ModifierGroup[]>(),
    supabase.from("modifiers").select("*").order("created_at").returns<Modifier[]>(),
    supabase.from("item_modifier_groups").select("*").returns<ItemModifierGroup[]>()
  ]);

  return (
    <MenuBuilderClient
      merchantName={merchant.name}
      categories={categories ?? []}
      items={items ?? []}
      groups={groups ?? []}
      modifiers={modifiers ?? []}
      itemGroups={itemGroups ?? []}
      initialTab={searchParams?.tab}
      error={searchParams?.error}
    />
  );
}
