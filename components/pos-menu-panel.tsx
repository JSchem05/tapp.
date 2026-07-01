"use client";

import { MenuBuilderClient } from "@/app/pos/menu/menu-builder-client";
import type {
  Category,
  ItemModifierGroup,
  MenuItem,
  Modifier,
  ModifierGroup
} from "@/lib/types";

export function PosMenuPanel({
  merchantId,
  merchantName,
  categories,
  items,
  groups,
  modifiers,
  itemGroups,
  initialTab,
  error,
  backHref
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
  return (
    <div className="h-full overflow-y-auto bg-cream">
      <MenuBuilderClient
        merchantId={merchantId}
        merchantName={merchantName}
        categories={categories}
        items={items}
        groups={groups}
        modifiers={modifiers}
        itemGroups={itemGroups}
        initialTab={initialTab}
        error={error}
        backHref={backHref}
      />
    </div>
  );
}
