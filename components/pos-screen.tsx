import { PosApp } from "@/components/pos-app";
import { PosSidebar } from "@/components/pos-sidebar";
import type { PosAppData } from "@/lib/pos/app-data";
import { getResendSandboxRecipient } from "@/lib/resend-config";
import { getBaseUrl } from "@/lib/url";
import type { Merchant } from "@/lib/types";
import { MenuSquare } from "lucide-react";
import Link from "next/link";

export function PosScreen({
  merchant,
  data,
  mode,
  searchParams
}: {
  merchant: Merchant;
  data: PosAppData;
  mode: "owner" | "staff";
  searchParams?: {
    view?: string;
    tab?: string;
    tag?: string;
    error?: string;
    saved?: string;
  };
}) {
  const baseUrl = getBaseUrl();
  const sandboxRecipient = getResendSandboxRecipient();
  const { categories, items } = data.pos;

  if (!categories.length || !items.length) {
    return (
      <main className="flex min-h-screen bg-cream">
        <PosSidebar
          mode={mode}
          activeView={mode === "owner" ? "dashboard" : "menu"}
          collapsed={false}
          staff={data.pos.staff}
          selectedStaffId={null}
          onToggleCollapsed={() => undefined}
          onViewChange={() => undefined}
          onSelectStaff={() => undefined}
          className="min-h-screen"
        />
        <div className="flex flex-1 items-center justify-center px-4">
          <div className="max-w-md rounded-[16px] bg-white p-8 text-center shadow-soft">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink text-white shadow-soft">
              <MenuSquare className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink">
              Set up your menu to start taking orders
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              Add categories and items in Menu before taking orders.
            </p>
            <div className="mt-6">
              <Link
                href={mode === "owner" ? "/pos?view=menu" : "/staff?view=menu"}
                className="inline-flex h-12 items-center justify-center rounded-[12px] bg-ink px-4 text-sm font-extrabold text-white"
              >
                Go to Menu
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={mode === "owner" ? "h-screen overflow-hidden bg-cream" : undefined}>
      <PosApp
        mode={mode}
        merchant={merchant}
        data={data}
        baseUrl={baseUrl}
        sandboxRecipient={sandboxRecipient}
        initialView={searchParams?.view}
        menuTab={searchParams?.tab}
        dashboardTag={searchParams?.tag}
        menuError={searchParams?.view === "menu" ? searchParams.error : undefined}
        dashboardError={searchParams?.view === "dashboard" ? searchParams.error : undefined}
        settingsSaved={searchParams?.view === "settings" ? Boolean(searchParams.saved) : false}
        settingsError={searchParams?.view === "settings" ? searchParams.error : undefined}
      />
    </main>
  );
}
