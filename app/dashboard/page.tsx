import { Card } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/money";
import { getAuthedMerchant } from "@/lib/auth";
import type { Receipt, Tag } from "@/lib/types";
import { ArrowUpRight, Plus, ReceiptText, Wifi } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, merchant } = await getAuthedMerchant();

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
        .limit(10)
        .returns<Receipt[]>(),
      supabase
        .from("receipts")
        .select("*")
        .eq("merchant_id", merchant.id)
        .eq("is_latest", true)
        .returns<Receipt[]>()
    ]);

  const latestByTag = new Map(
    (latestReceipts ?? []).map((receipt) => [receipt.tag_id, receipt])
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl bg-coffee p-6 text-paper shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-wide text-paper/65">
            Merchant home
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Good counter flow, {merchant.name}.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-paper/75">
            Select an NFC puck, enter the sale, and the customer sees the latest
            receipt the moment they tap.
          </p>
        </div>

        <Card className="flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-clay">
              Quick action
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink">New receipt</h2>
          </div>
          <Link
            href="/dashboard/receipt/new"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-coffee px-4 text-sm font-semibold text-paper transition hover:bg-ink"
          >
            <Plus className="h-4 w-4" />
            Create receipt
          </Link>
        </Card>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink">NFC pucks</h2>
            <p className="mt-1 text-sm text-coffee/65">
              One permanent URL per counter or location.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(tags ?? []).map((tag) => {
            const latest = latestByTag.get(tag.id);
            return (
              <Card key={tag.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-coffee">
                      <Wifi className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-ink">{tag.label}</h3>
                      <p className="text-sm text-coffee/60">{tag.tag_code}</p>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/receipt/new?tag=${tag.id}`}
                    className="inline-flex h-9 items-center gap-1 rounded-xl bg-coffee px-3 text-sm font-semibold text-paper transition hover:bg-ink"
                  >
                    New
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
                <p className="mt-4 text-sm text-coffee/65">
                  Last receipt:{" "}
                  <span className="font-medium text-ink">
                    {latest ? formatDateTime(latest.created_at) : "None yet"}
                  </span>
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-xl font-bold text-ink">Last 10 receipts</h2>
        </div>
        <Card className="overflow-hidden p-0">
          {(receipts ?? []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-cream text-coffee">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-coffee/10">
                  {(receipts ?? []).map((receipt) => (
                    <tr key={receipt.id}>
                      <td className="px-4 py-3 text-ink">
                        {formatDateTime(receipt.created_at)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink">
                        {formatCurrency(receipt.total)}
                      </td>
                      <td className="px-4 py-3 text-coffee/70">
                        {receipt.items.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <ReceiptText className="mx-auto h-9 w-9 text-coffee/35" />
              <p className="mt-3 font-semibold text-ink">No receipts yet</p>
              <p className="mt-1 text-sm text-coffee/65">
                Create your first sale receipt from the button above.
              </p>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
