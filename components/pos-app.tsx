"use client";

import { PosClient } from "@/app/pos/pos-client";
import { MerchantSettingsPanel } from "@/components/merchant-settings-panel";
import { PosAnalyticsPanel } from "@/components/pos-analytics-panel";
import { PosReceiptsPanel } from "@/components/pos-receipts-panel";
import {
  PosSidebar,
  readSidebarCollapsed,
  writeSidebarCollapsed
} from "@/components/pos-sidebar";
import { PosTablesView } from "@/components/pos-tables-view";
import type { PosAppData, PosView } from "@/lib/pos/app-data";
import type { Merchant, OpenTableOrder, PosOrderItem } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

const VALID_VIEWS: PosView[] = ["pos", "tables", "receipts", "analytics", "settings"];

function parseView(value: string | null | undefined, mode: "owner" | "staff"): PosView {
  if (!value || !VALID_VIEWS.includes(value as PosView)) return "pos";
  if (mode === "staff" && (value === "analytics" || value === "settings")) return "pos";
  return value as PosView;
}

export type PosOrderBootstrap = {
  items: PosOrderItem[];
  orderId: string;
  tableId: string;
  staffId: string | null;
};

export function PosApp({
  mode,
  merchant,
  data,
  baseUrl,
  sandboxRecipient,
  initialView,
  headerSlot,
  embedded = false
}: {
  mode: "owner" | "staff";
  merchant: Merchant;
  data: PosAppData;
  baseUrl: string;
  sandboxRecipient?: string | null;
  initialView?: string;
  headerSlot?: ReactNode;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<PosView>(() =>
    parseView(initialView, mode)
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [orderBootstrap, setOrderBootstrap] = useState<PosOrderBootstrap | null>(null);

  useEffect(() => {
    setCollapsed(readSidebarCollapsed());
  }, []);

  const syncViewToUrl = useCallback(
    (view: PosView) => {
      const path = mode === "owner" ? "/pos" : "/staff";
      const next = view === "pos" ? path : `${path}?view=${view}`;
      window.history.replaceState(null, "", next);
    },
    [mode]
  );

  function changeView(view: PosView) {
    setActiveView(view);
    syncViewToUrl(view);
  }

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      writeSidebarCollapsed(next);
      return next;
    });
  }

  function toggleStaffSelection(staffId: string) {
    setSelectedStaffId((current) => (current === staffId ? null : staffId));
  }

  function handleOpenTableOrder(order: OpenTableOrder) {
    setOrderBootstrap({
      items: order.items,
      orderId: order.id,
      tableId: order.table_id,
      staffId: order.staff_id
    });
    if (order.staff_id) {
      setSelectedStaffId(order.staff_id);
    }
    changeView("pos");
  }

  function clearOrderBootstrap() {
    setOrderBootstrap(null);
  }

  return (
    <div
      className={`flex min-h-0 w-full overflow-hidden bg-cream ${
        embedded ? "min-h-[calc(100dvh-9rem)]" : "h-screen"
      }`}
    >
      <PosSidebar
        mode={mode}
        activeView={activeView}
        collapsed={collapsed}
        staff={data.pos.staff}
        selectedStaffId={selectedStaffId}
        onToggleCollapsed={toggleCollapsed}
        onViewChange={changeView}
        onSelectStaff={toggleStaffSelection}
        className={embedded ? "min-h-[calc(100dvh-9rem)]" : "h-screen"}
      />

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        {activeView === "pos" ? (
          <PosClient
            merchantName={merchant.name}
            categories={data.pos.categories}
            items={data.pos.items}
            tags={data.pos.tags}
            popularItemIds={data.pos.popularItemIds}
            baseUrl={baseUrl}
            selectedStaffId={selectedStaffId}
            tables={data.tables}
            orderBootstrap={orderBootstrap}
            onOrderBootstrapConsumed={clearOrderBootstrap}
            onTablesChanged={() => router.refresh()}
            headerSlot={headerSlot}
            embedded={embedded}
          />
        ) : null}

        {activeView === "tables" ? (
          <PosTablesView
            tables={data.tables}
            openOrders={data.openOrders}
            staffById={data.staffById}
            onOpenTableOrder={handleOpenTableOrder}
          />
        ) : null}

        {activeView === "receipts" ? (
          <PosReceiptsPanel
            mode={mode}
            merchantName={merchant.name}
            merchantProfile={merchant}
            receipts={data.receipts}
            tags={data.tags}
            staffById={data.staffById}
            baseUrl={baseUrl}
            sandboxRecipient={sandboxRecipient}
          />
        ) : null}

        {activeView === "analytics" && mode === "owner" ? (
          <PosAnalyticsPanel merchantName={merchant.name} {...data.analytics} />
        ) : null}

        {activeView === "settings" && mode === "owner" ? (
          <MerchantSettingsPanel
            merchant={merchant}
            tags={data.settings.tags}
            staff={data.settings.staff}
            sumupConnection={data.settings.sumupConnection}
            baseUrl={baseUrl}
          />
        ) : null}
      </div>
    </div>
  );
}
