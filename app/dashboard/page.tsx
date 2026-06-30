import { createTag } from "@/app/dashboard/actions";
import { HeaderClock, OpenClosedToggle } from "@/components/dashboard-status";
import { ReceiptCard } from "@/components/receipt-view";
import { Input, Label } from "@/components/ui";
import { RevenueChart } from "@/app/dashboard/revenue-chart";
import { formatCurrency, formatDateTime } from "@/lib/money";
import { getOwnerContext } from "@/lib/merchant-context";
import type { Receipt, Tag } from "@/lib/types";
import {
  CircleAlert,
  Maximize2,
  Plus,
  ReceiptText,
  Wifi
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { error?: string; tag?: string; tag_added?: string };
}) {
  const { supabase, merchant } = await getOwnerContext();

  const [{ data: tags }, { data: receipts }, { data: latestReceipts }, { data: staffMembers }] =
    await Promise.all([
      supabase
        .from("tags")
        .select("*")
        .eq("merchant_id", merchant.id)
        .order("created_at", { ascending: true })
        .returns<Tag[]>(),
      supabase
        .from("receipts")
        .select("*")
        .eq("merchant_id", merchant.id)
        .order("created_at", { ascending: false })
        .limit(200)
        .returns<Receipt[]>(),
      supabase
        .from("receipts")
        .select("*")
        .eq("merchant_id", merchant.id)
        .eq("is_latest", true)
        .returns<Receipt[]>(),
      supabase
        .from("staff")
        .select("id, name")
        .eq("merchant_id", merchant.id)
    ]);

  const counters = tags ?? [];
  const allReceipts = receipts ?? [];
  const awaitingReceipts = allReceipts
    .filter((receipt) => receipt.awaiting_items)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const latestByTag = new Map(
    (latestReceipts ?? []).map((receipt) => [receipt.tag_id, receipt])
  );
  const tagById = new Map(counters.map((tag) => [tag.id, tag]));
  const staffById = new Map((staffMembers ?? []).map((member) => [member.id, member.name]));
  const todayKey = new Date().toISOString().slice(0, 10);
  const receiptsToday = allReceipts.filter((receipt) =>
    receipt.created_at.startsWith(todayKey)
  );
  const totalRevenue = allReceipts.reduce((sum, receipt) => sum + Number(receipt.total), 0);
  const avgTransaction = allReceipts.length ? totalRevenue / allReceipts.length : 0;
  const selectedCounter =
    counters.find((tag) => tag.id === searchParams?.tag) ?? counters[0] ?? null;
  const selectedReceipt = selectedCounter
    ? latestByTag.get(selectedCounter.id) ??
      allReceipts.find((receipt) => receipt.tag_id === selectedCounter.id) ??
      null
    : null;
  const chartData = buildRevenueData(allReceipts);
  const monthlyRevenue = revenueForMonth(allReceipts, 0);

  return (
    <div className="animate-tapp-fade -mx-6 -my-8 lg:-mx-8">
      <header className="flex h-16 flex-nowrap items-center justify-between px-8">
        <div aria-hidden="true" />
        <div className="flex shrink-0 flex-nowrap items-center gap-3">
          <OpenClosedToggle />
          <HeaderClock />
          <Link
            href="/dashboard/receipt/new"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-blue px-4 text-sm font-bold text-white shadow-soft transition hover:bg-blueDark"
          >
            <Plus className="h-4 w-4" />
            New receipt
          </Link>
        </div>
      </header>

      <section className="mx-8 mb-6 mt-8">
        <h1 className="text-[28px] font-bold leading-[1.2] tracking-tight text-ink">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted">Overview for {merchant.name}</p>
      </section>

      {searchParams?.error ? (
        <p className="mx-8 mb-6 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
          {searchParams.error}
        </p>
      ) : null}

      {awaitingReceipts.length > 0 ? (
        <section className="mx-8 mb-6 rounded-[16px] border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <CircleAlert className="h-4 w-4 text-amber-700" />
            <p className="text-sm font-semibold text-amber-900">
              Awaiting items ({awaitingReceipts.length})
            </p>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {awaitingReceipts.map((receipt) => (
              <Link
                key={receipt.id}
                href={`/dashboard/receipt/new?awaiting=${receipt.id}`}
                className="rounded-[12px] border border-amber-200 bg-white px-3 py-2 text-sm hover:bg-amber-100/30"
              >
                <p className="font-semibold text-ink">
                  {tagById.get(receipt.tag_id)?.label ?? "Counter"} -{" "}
                  {formatCurrency(receipt.total)}
                </p>
                <p className="text-xs text-muted">{formatDateTime(receipt.created_at)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-8 mb-6 grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-4">
        <StatCard
          dark
          label="Total Revenue"
          trend={`+${formatCurrency(monthlyRevenue)} this month`}
          value={formatCurrency(totalRevenue)}
        />
        <StatCard
          label="Receipts today"
          trend={`${receiptsToday.length} recorded today`}
          value={String(receiptsToday.length)}
        />
        <StatCard
          label="Avg transaction"
          trend={`Across ${allReceipts.length} receipts`}
          value={formatCurrency(avgTransaction)}
        />
        <StatCard
          label="Active counters"
          trend={`${counters.length} ready for NFC`}
          value={String(counters.length)}
        />
      </section>

      <section className="mx-8 mb-6 grid grid-cols-[1.6fr_1fr] items-start gap-4">
        <section id="analytics" className="rounded-[16px] border border-line bg-white p-6 shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Total Revenue</h2>
            <button
              type="button"
              aria-label="Expand revenue chart"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:bg-[#FAFAFA]"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
          <RevenueChart data={chartData} />
        </section>

        <LiveReceiptCard
          merchantLogoUrl={merchant.logo_url}
          merchantName={merchant.name}
          receipt={selectedReceipt}
          selectedCounter={selectedCounter}
        />
      </section>

      <section className="mx-8 mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">NFC Counters</h2>
          <AddCounterMenu />
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {counters.length > 0 ? (
            counters.map((tag) => (
              <CounterCard key={tag.id} latest={latestByTag.get(tag.id)} tag={tag} />
            ))
          ) : (
            <div className="col-span-full flex min-h-[220px] flex-col items-center justify-center rounded-[16px] border border-dashed border-line bg-white p-6 text-center shadow-soft">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blueSoft text-blue">
                <Wifi className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">
                Add your first counter to get started
              </p>
              <div className="mt-4">
                <AddCounterMenu />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mx-8 mb-8 overflow-hidden rounded-[16px] border border-line bg-white">
        <div className="flex items-center justify-between p-6">
          <h2 className="text-base font-semibold text-ink">Recent Receipts</h2>
          <Link href="/dashboard/receipts" className="text-sm font-bold text-ink">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <thead>
              <tr className="text-[13px] font-semibold text-muted">
                <th className="px-6 pb-4">Counter</th>
                <th className="px-6 pb-4">Items</th>
                <th className="px-6 pb-4">Total</th>
                <th className="px-6 pb-4">Payment</th>
                <th className="px-6 pb-4">Status</th>
                <th className="px-6 pb-4" aria-label="Receipt action" />
              </tr>
            </thead>
            <tbody>
              {allReceipts.length > 0 ? (
                allReceipts.slice(0, 10).map((receipt) => (
                  <tr
                    key={receipt.id}
                    className="h-14 border-b border-[#F3F4F6] transition hover:bg-[#FAFAFA]"
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F0F0F0] text-ink">
                          <ReceiptText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-ink">
                            {tagById.get(receipt.tag_id)?.label ?? "Counter"}
                          </p>
                          <p className="text-xs text-muted">
                            {formatDateTime(receipt.created_at)}
                          </p>
                          {receipt.staff_id && staffById.get(receipt.staff_id) ? (
                            <p className="text-xs text-muted">
                              Rung up by {staffById.get(receipt.staff_id)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted">
                      {formatItemSummary(receipt)}
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-ink">
                      {formatCurrency(receipt.total)}
                    </td>
                    <td className="px-6 py-3">
                      <span className="rounded-full bg-[#F0F0F0] px-3 py-1 text-xs font-bold text-ink">
                        {receipt.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {receipt.awaiting_items ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                          Awaiting items
                        </span>
                      ) : (
                        <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
                          Paid
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link
                        href={
                          receipt.awaiting_items
                            ? `/dashboard/receipt/new?awaiting=${receipt.id}`
                            : `/r/${receipt.id}`
                        }
                        className="text-sm font-bold text-ink"
                      >
                        {receipt.awaiting_items ? "Complete" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blueSoft text-blue">
                        <ReceiptText className="h-5 w-5" />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-ink">
                        No receipts yet today
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
  dark = false
}: {
  label: string;
  value: string;
  trend: string;
  dark?: boolean;
}) {
  return (
    <section
      className={`rounded-[16px] p-6 ${
        dark
          ? "bg-ink text-white"
          : "border border-line bg-white text-ink shadow-soft"
      }`}
    >
      <p className={`text-[13px] font-medium ${dark ? "text-white/60" : "text-muted"}`}>
        {label}
      </p>
      <p className={`mt-3 font-bold leading-none ${dark ? "text-[32px]" : "text-[28px]"}`}>
        {value}
      </p>
      <p className={`mt-3 text-xs font-semibold ${dark ? "text-emerald-400" : "text-sage"}`}>
        {trend}
      </p>
    </section>
  );
}

function LiveReceiptCard({
  merchantName,
  merchantLogoUrl,
  selectedCounter,
  receipt
}: {
  merchantName: string;
  merchantLogoUrl?: string | null;
  selectedCounter: Tag | null;
  receipt: Receipt | null;
}) {
  const newReceiptHref = selectedCounter
    ? `/dashboard/receipt/new?tag=${selectedCounter.id}`
    : "/dashboard/receipt/new";

  return (
    <section className="rounded-[16px] border border-line bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-baseline gap-3">
          <p className="shrink-0 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            Live receipt
          </p>
          <h2 className="truncate text-lg font-semibold text-ink">
            {selectedCounter?.label ?? "No counter"}
          </h2>
        </div>
        <Link
          href={newReceiptHref}
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full bg-ink px-3 text-xs font-bold text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </Link>
      </div>

      {receipt ? (
        <ReceiptCard
          className="mt-5 border-0 p-0 shadow-none hover:shadow-none"
          compact
          merchantLogoUrl={merchantLogoUrl}
          merchantName={merchantName}
          receipt={receipt}
        />
      ) : (
        <div className="mt-5 flex min-h-[360px] flex-col items-center justify-center rounded-[12px] border border-dashed border-line text-center">
          <ReceiptText className="h-6 w-6 text-muted" />
          <p className="mt-3 text-sm font-semibold text-ink">No live receipt yet</p>
          <p className="mt-1 text-xs text-muted">Select a counter or create a receipt.</p>
        </div>
      )}
    </section>
  );
}

function AddCounterMenu() {
  return (
    <details className="relative">
      <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white">
        <Plus className="h-4 w-4" />
        Add counter
      </summary>
      <form
        action={createTag}
        className="absolute right-0 z-10 mt-2 grid w-[360px] gap-3 rounded-[16px] border border-line bg-white p-4 text-left shadow-lift"
      >
        <div className="space-y-2">
          <Label>Counter label</Label>
          <Input name="label" placeholder="Garden Bar" required />
        </div>
        <div className="space-y-2">
          <Label>Tag code</Label>
          <Input name="tag_code" placeholder="GARDEN01" />
        </div>
        <button className="h-10 rounded-[10px] bg-ink text-sm font-bold text-white">
          Add
        </button>
      </form>
    </details>
  );
}

function CounterCard({ tag, latest }: { tag: Tag; latest?: Receipt }) {
  return (
    <article className="flex min-h-[220px] flex-col rounded-[16px] border border-line bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blueSoft text-blue">
          <Wifi className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{tag.label}</p>
          <p className="text-xs font-semibold text-muted">{tag.tag_code}</p>
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-muted">
        Last receipt: {latest ? formatDateTime(latest.created_at) : "None yet"}
      </p>
      <div className="mt-auto grid grid-cols-[35fr_65fr] gap-2 pt-5">
        <Link
          href={`/dashboard?tag=${tag.id}`}
          className="flex h-9 items-center justify-center rounded-[10px] border border-line bg-white text-sm font-bold text-ink transition hover:bg-[#FAFAFA]"
        >
          Select
        </Link>
        <Link
          href={`/dashboard/receipt/new?tag=${tag.id}`}
          className="flex h-9 items-center justify-center rounded-[10px] bg-blue text-sm font-bold text-white transition hover:bg-blueDark"
        >
          New Receipt
        </Link>
      </div>
    </article>
  );
}

function formatItemSummary(receipt: Receipt) {
  if (receipt.awaiting_items) return "Awaiting items";
  if (!receipt.items.length) return "No items";

  const [firstItem] = receipt.items;
  const remaining = receipt.items.length - 1;
  return remaining > 0 ? `${firstItem.name} + ${remaining} more` : firstItem.name;
}

function buildRevenueData(receipts: Receipt[]) {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = `${month.getFullYear()}-${month.getMonth()}`;
    const revenue = receipts
      .filter((receipt) => {
        const created = new Date(receipt.created_at);
        return `${created.getFullYear()}-${created.getMonth()}` === key;
      })
      .reduce((sum, receipt) => sum + Number(receipt.total), 0);
    return {
      month: new Intl.DateTimeFormat("en-MT", { month: "short" }).format(month),
      revenue
    };
  });
}

function revenueForMonth(receipts: Receipt[], monthOffset: number) {
  const now = new Date();
  const month = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  const key = `${month.getFullYear()}-${month.getMonth()}`;

  return receipts
    .filter((receipt) => {
      const created = new Date(receipt.created_at);
      return `${created.getFullYear()}-${created.getMonth()}` === key;
    })
    .reduce((sum, receipt) => sum + Number(receipt.total), 0);
}
