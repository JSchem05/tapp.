import { loadSampleMenu } from "@/app/pos/actions";
import { PosClient } from "@/app/pos/pos-client";
import { getAuthedMerchant } from "@/lib/auth";
import type {
  Category,
  ItemModifierGroup,
  MenuItem,
  Modifier,
  ModifierGroup,
  Tag
} from "@/lib/types";
import { getBaseUrl } from "@/lib/url";
import { ArrowLeft, MenuSquare, ReceiptText } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export type PosModifierGroup = ModifierGroup & {
  modifiers: Modifier[];
};

export type PosMenuItem = MenuItem & {
  modifierGroups: PosModifierGroup[];
};

export default async function PosPage() {
  const { supabase, merchant } = await getAuthedMerchant();
  const [
    { data: categories },
    { data: items },
    { data: groups },
    { data: modifiers },
    { data: itemGroups },
    { data: tags }
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
    supabase.from("modifiers").select("*").returns<Modifier[]>(),
    supabase.from("item_modifier_groups").select("*").returns<ItemModifierGroup[]>(),
    supabase
      .from("tags")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("created_at")
      .returns<Tag[]>()
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

  if (!categories?.length || !items?.length) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-4">
        <div className="max-w-md rounded-[16px] bg-white p-8 text-center shadow-soft">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink text-white shadow-soft">
            <MenuSquare className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink">
            Set up your menu to start taking orders
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Add categories and items manually, or load sample café data to try the POS
            right away.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/pos/menu"
              className="inline-flex h-12 items-center justify-center rounded-[12px] bg-ink px-4 text-sm font-extrabold text-white"
            >
              Go to Menu Builder
            </Link>
            <form action={loadSampleMenu}>
              <button className="inline-flex h-12 w-full items-center justify-center rounded-[10px] bg-ink px-4 text-sm font-extrabold text-white">
                Load sample data
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-cream">
      <div className="grid h-full grid-rows-[56px_1fr]">
        <header className="flex h-14 items-center justify-between border-b border-line bg-white px-5">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-line bg-white px-3 text-sm font-bold text-ink hover:bg-[#FAFAFA]"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div>
              <p className="text-lg font-extrabold text-ink">{merchant.name}</p>
              <p className="text-xs text-muted">iPad POS</p>
            </div>
          </div>
          <div className="hidden text-sm font-semibold text-muted md:block">
            {new Intl.DateTimeFormat("en-MT", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Europe/Malta"
            }).format(new Date())}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/pos/menu"
              className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-line bg-white px-3 text-sm font-bold text-ink hover:bg-[#FAFAFA]"
            >
              <ReceiptText className="h-4 w-4" />
              Menu Builder
            </Link>
            <span className="text-sm font-semibold text-muted">Staff: Front counter</span>
          </div>
        </header>

        <PosClient
          merchantName={merchant.name}
          categories={uniqueCategories}
          items={dedupedMenuItems}
          tags={tags ?? []}
          baseUrl={getBaseUrl()}
        />
      </div>
    </main>
  );
}
