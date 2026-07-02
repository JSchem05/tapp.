"use client";

import { PosClient } from "@/app/pos/pos-client";
import { MerchantSettingsPanel } from "@/components/merchant-settings-panel";
import { PosBottomBar } from "@/components/pos-bottom-bar";
import { PosDashboardPanel } from "@/components/pos-dashboard-panel";
import { PosMenuPanel } from "@/components/pos-menu-panel";
import { PosReceiptsPanel } from "@/components/pos-receipts-panel";
import { PosTablesView } from "@/components/pos-tables-view";
import { useOfflineOrderQueue } from "@/lib/offline-queue";
import type { PosAppData, PosView } from "@/lib/pos/app-data";
import { ownerAppPath, staffAppPath } from "@/lib/pos/view-routes";
import type { Merchant, OpenTableOrder, PosOrderItem } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const OWNER_VIEWS: PosView[] = [
  "dashboard",
  "pos",
  "tables",
  "receipts",
  "menu",
  "settings"
];
const STAFF_VIEWS: PosView[] = ["pos", "tables", "receipts", "menu"];

function parseView(
  value: string | null | undefined,
  mode: "owner" | "staff"
): PosView {
  const allowed = mode === "owner" ? OWNER_VIEWS : STAFF_VIEWS;
  const fallback: PosView = mode === "owner" ? "dashboard" : "pos";
  if (!value || !allowed.includes(value as PosView)) return fallback;
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
  menuTab,
  dashboardTag,
  menuError,
  settingsSaved,
  settingsError,
  dashboardError
}: {
  mode: "owner" | "staff";
  merchant: Merchant;
  data: PosAppData;
  baseUrl: string;
  sandboxRecipient?: string | null;
  initialView?: string;
  menuTab?: string;
  dashboardTag?: string;
  menuError?: string;
  settingsSaved?: boolean;
  settingsError?: string;
  dashboardError?: string;
}) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<PosView>(() =>
    parseView(initialView, mode)
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [orderBootstrap, setOrderBootstrap] = useState<PosOrderBootstrap | null>(null);
  const [dashboardTagId, setDashboardTagId] = useState(dashboardTag ?? "");
  const offlineQueue = useOfflineOrderQueue();

  useEffect(() => {
    if (dashboardTag) setDashboardTagId(dashboardTag);
  }, [dashboardTag]);

  const syncViewToUrl = useCallback(
    (view: PosView, query?: Record<string, string>) => {
      const path =
        mode === "owner"
          ? ownerAppPath(view, query)
          : staffAppPath(view, query);
      window.history.replaceState(null, "", path);
    },
    [mode]
  );

  useEffect(() => {
    const parsed = parseView(initialView, mode);
    setActiveView(parsed);
    if (initialView && initialView !== parsed) {
      syncViewToUrl(parsed);
    }
  }, [initialView, mode, syncViewToUrl]);

  function changeView(view: PosView, query?: Record<string, string>) {
    setActiveView(view);
    syncViewToUrl(view, query);
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
    <div className="relative flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-cream">
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        {activeView === "dashboard" && mode === "owner" ? (
          <PosDashboardPanel
            merchant={merchant}
            tags={data.tags}
            receipts={data.receipts}
            latestByTagId={data.dashboard.latestByTagId}
            chartData={data.dashboard.chartData}
            totalRevenue={data.dashboard.totalRevenue}
            receiptsToday={data.dashboard.receiptsToday}
            avgTransaction={data.dashboard.avgTransaction}
            monthlyRevenue={data.dashboard.monthlyRevenue}
            selectedTagId={dashboardTagId}
            error={dashboardError}
            onNavigate={changeView}
          />
        ) : null}

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
            onQueueOffline={offlineQueue.enqueue}
            embedded={mode === "staff"}
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

        {activeView === "menu" ? (
          <PosMenuPanel
            merchantId={merchant.id}
            merchantName={merchant.name}
            categories={data.menu.categories}
            items={data.menu.items}
            groups={data.menu.groups}
            modifiers={data.menu.modifiers}
            itemGroups={data.menu.itemGroups}
            initialTab={menuTab}
            error={menuError}
            backHref={mode === "owner" ? "/pos" : "/staff"}
          />
        ) : null}

        {activeView === "settings" && mode === "owner" ? (
          <>
            {settingsSaved ? (
              <div className="border-b border-line bg-green-50 px-6 py-2 text-sm font-semibold text-green-700">
                Settings saved.
              </div>
            ) : null}
            {settingsError ? (
              <div className="border-b border-line bg-red-50 px-6 py-2 text-sm font-semibold text-red-700">
                {settingsError}
              </div>
            ) : null}
            <MerchantSettingsPanel
              merchant={merchant}
              tags={data.settings.tags}
              staff={data.settings.staff}
              sumupConnection={data.settings.sumupConnection}
              baseUrl={baseUrl}
            />
          </>
        ) : null}
      </div>

      {offlineQueue.pendingCount > 0 || offlineQueue.syncing ? (
        <div className="pointer-events-none absolute bottom-[84px] right-4 z-50">
          <div className="animate-tapp-toast flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-ink shadow-lift">
            <span
              className={`h-2 w-2 rounded-full ${
                offlineQueue.syncing ? "animate-pulse bg-blue" : "bg-warning"
              }`}
            />
            {offlineQueue.syncing
              ? "Syncing offline orders…"
              : `${offlineQueue.pendingCount} order${
                  offlineQueue.pendingCount === 1 ? "" : "s"
                } waiting for connection`}
          </div>
        </div>
      ) : null}

      <PosBottomBar
        mode={mode}
        activeView={activeView}
        staff={data.pos.staff}
        selectedStaffId={selectedStaffId}
        onViewChange={changeView}
        onSelectStaff={toggleStaffSelection}
      />
    </div>
  );
}
