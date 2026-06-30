import { createTag } from "@/app/dashboard/actions";
import { RevenueChart } from "@/app/dashboard/revenue-chart";
import { Input, Label } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/money";
import { getOwnerContext } from "@/lib/merchant-context";
import type { Receipt, Tag } from "@/lib/types";
import { CircleAlert, Plus, ReceiptText, Wifi } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { error?: string; tag_added?: string };
}) {
  const { supabase, merchant } = await getOwnerContext();

  const [{ data: tags }, { data: receipts }, { data: latestReceipts }] =
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
        .returns<Receipt[]>()
    ]);

  const allReceipts = receipts ?? [];
  const awaitingReceipts = allReceipts
    .filter((receipt) => receipt.awaiting_items)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const latestByTag = new Map(
    (latestReceipts ?? []).map((receipt) => [receipt.tag_id, receipt])
  );
  const tagById = new Map((tags ?? []).map((tag) => [tag.id, tag]));
  const todayKey = new Date().toISOString().slice(0, 10);
  const receiptsToday = allReceipts.filter((receipt) =>
    receipt.created_at.startsWith(todayKey)
  );
  const totalRevenue = allReceipts.reduce((sum, receipt) => sum + Number(receipt.total), 0);
  const avgTransaction = allReceipts.length ? totalRevenue / allReceipts.length : 0;
  const chartData = buildRevenueData(allReceipts);

  return (
    <div className="animate-tapp-fade space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Overview for {merchant.name}</p>
      </div>

      {searchParams?.error ? (
        <p className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
          {searchParams.error}
        </p>
      ) : null}
      {awaitingReceipts.length > 0 ? (
        <section className="rounded-[16px] border border-amber-200 bg-amber-50 p-4">
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
                  {tagById.get(receipt.tag_id)?.label ?? "Counter"} - {formatCurrency(receipt.total)}
                </p>
                <p className="text-xs text-muted">{formatDateTime(receipt.created_at)}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard dark label="Total Revenue" value={formatCurrency(totalRevenue)} />
        <StatCard label="Receipts today" value={String(receiptsToday.length)} />
        <StatCard label="Avg transaction" value={formatCurrency(avgTransaction)} />
        <StatCard label="Active counters" value={String(tags?.length ?? 0)} />
      </div>

      <section id="analytics" className="rounded-[16px] bg-white p-6 shadow-soft">
        <h2 className="mb-4 text-base font-semibold text-ink">Total Revenue</h2>
        <RevenueChart data={chartData} />
      </section>

      <section className="overflow-hidden rounded-[16px] bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">Recent Receipts</h2>
          <Link href="/dashboard/receipts" className="text-sm font-bold text-ink">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-line text-[13px] font-semibold text-muted">
                <th className="px-5 py-3">Counter</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {allReceipts.slice(0, 10).map((receipt) => (
                <tr key={receipt.id} className="h-[52px] border-b border-line">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0F0F0] text-ink">
                        <ReceiptText className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ink">
                          {tagById.get(receipt.tag_id)?.label ?? "Counter"}
                        </p>
                        <p className="text-xs text-muted">{formatDateTime(receipt.created_at)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted">
                    {receipt.awaiting_items ? "Awaiting items" : `${receipt.items.length} items`}
                  </td>
                  <td className="px-5 py-3 text-sm font-bold text-ink">
                    {formatCurrency(receipt.total)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-[#F0F0F0] px-3 py-1 text-xs font-bold text-ink">
                      {receipt.payment_method}
                    </span>
                  </td>
                  <td className="px-5 py-3">
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
                  <td className="px-5 py-3 text-right">
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
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">NFC Counters</h2>
          <details className="relative">
            <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white">
              <Plus className="h-4 w-4" />
              Add counter
            </summary>
            <form action={createTag} className="absolute right-0 z-10 mt-2 grid w-[360px] gap-3 rounded-[16px] border border-line bg-white p-4 shadow-lift">
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
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {(tags ?? []).map((tag) => {
            const latest = latestByTag.get(tag.id);
            return (
              <div key={tag.id} className="flex w-[200px] shrink-0 flex-col rounded-[16px] bg-white p-5 shadow-soft">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F0F0] text-ink">
                  <Wifi className="h-5 w-5" />
                </div>
                <p className="mt-4 truncate text-sm font-bold text-ink">{tag.label}</p>
                <p className="text-xs font-semibold text-muted">{tag.tag_code}</p>
                <p className="mt-3 text-xs leading-5 text-muted">
                  Last receipt: {latest ? formatDateTime(latest.created_at) : "None yet"}
                </p>
                <Link
                  href={`/dashboard/receipt/new?tag=${tag.id}`}
                  className="mt-4 flex h-9 items-center justify-center rounded-[10px] bg-ink text-sm font-bold text-white"
                >
                  New Receipt
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  dark = false
}: {
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <section
      className={`rounded-[16px] p-6 shadow-soft ${
        dark ? "bg-ink text-white" : "bg-white text-ink"
      }`}
    >
      <p className={`text-[13px] font-medium ${dark ? "text-white/60" : "text-muted"}`}>
        {label}
      </p>
      <p className="mt-4 text-[32px] font-bold leading-none">{value}</p>
    </section>
  );
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
