import { PosApp } from "@/components/pos-app";
import { PosEmptyMenuGate } from "@/components/pos-empty-menu-gate";
import type { PosAppData } from "@/lib/pos/app-data";
import { getResendSandboxRecipient } from "@/lib/resend-config";
import { getBaseUrl } from "@/lib/url";
import type { Merchant } from "@/lib/types";

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
    return <PosEmptyMenuGate mode={mode} staff={data.pos.staff} />;
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
