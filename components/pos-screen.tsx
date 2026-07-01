import { PosClient } from "@/app/pos/pos-client";
import type { PosData } from "@/lib/pos/data";
import { getBaseUrl } from "@/lib/url";
import { ArrowLeft, MenuSquare, ReceiptText } from "lucide-react";
import Link from "next/link";

export function PosScreen({
  merchantName,
  data,
  mode,
  staffName
}: {
  merchantName: string;
  data: PosData;
  mode: "owner" | "staff";
  staffName?: string;
}) {
  const { categories, items, tags, staff, popularItemIds } = data;

  if (!categories.length || !items.length) {
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
            {mode === "owner"
              ? "Add categories and items in Menu Builder before taking POS orders."
              : "Add categories and items in Menu before taking orders."}
          </p>
          <div className="mt-6">
            <Link
              href={mode === "owner" ? "/pos/menu" : "/staff/menu"}
              className="inline-flex h-12 items-center justify-center rounded-[12px] bg-ink px-4 text-sm font-extrabold text-white"
            >
              Go to Menu
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (mode === "staff") {
    return (
      <PosClient
        merchantName={merchantName}
        staffName={staffName}
        categories={categories}
        items={items}
        tags={tags}
        staff={staff}
        popularItemIds={popularItemIds}
        baseUrl={getBaseUrl()}
        embedded
      />
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-cream">
      <div className="grid h-full grid-rows-[64px_1fr]">
        <header className="flex h-16 flex-nowrap items-center justify-between border-b border-line bg-white px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] border border-line bg-white px-3 text-sm font-bold text-ink hover:bg-[#FAFAFA]"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div className="h-8 w-px bg-line" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">
                {staffName ?? merchantName}
              </p>
              <p className="text-xs text-muted">
                {staffName ? `${merchantName} · iPad POS` : "iPad POS"}
              </p>
            </div>
          </div>
          <div className="hidden shrink-0 text-[13px] font-semibold text-muted md:block">
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
          </div>
        </header>

        <PosClient
          merchantName={merchantName}
          staffName={staffName}
          categories={categories}
          items={items}
          tags={tags}
          staff={staff}
          popularItemIds={popularItemIds}
          baseUrl={getBaseUrl()}
        />
      </div>
    </main>
  );
}
