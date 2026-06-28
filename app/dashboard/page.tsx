import { createTag, setReceiptLive } from "@/app/dashboard/actions";
import { ReceiptCard } from "@/components/receipt-view";
import { Card, Input, Label } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/money";
import { getAuthedMerchant } from "@/lib/auth";
import type { Receipt, Tag } from "@/lib/types";
import {
  ArrowUpRight,
  ChevronRight,
  CircleDashed,
  Plus,
  ReceiptText,
  Radio,
  Wifi
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { tag?: string; page?: string; error?: string; tag_added?: string };
}) {
  const { supabase, merchant } = await getAuthedMerchant();

  const [{ data: tags }, { data: latestReceipts }] =
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
        .eq("is_latest", true)
        .returns<Receipt[]>()
    ]);

  const latestByTag = new Map(
    (latestReceipts ?? []).map((receipt) => [receipt.tag_id, receipt])
  );
  const selectedTag =
    (tags ?? []).find((tag) => tag.id === searchParams?.tag) ?? tags?.[0] ?? null;
  const selectedLatest = selectedTag ? latestByTag.get(selectedTag.id) : null;
  const historyPage = Math.max(1, Number(searchParams?.page ?? "1") || 1);
  const historyFrom = (historyPage - 1) * 20;
  const historyTo = historyFrom + 19;

  const { data: selectedHistory } = selectedTag
    ? await supabase
        .from("receipts")
        .select("*")
        .eq("merchant_id", merchant.id)
        .eq("tag_id", selectedTag.id)
        .order("created_at", { ascending: false })
        .range(historyFrom, historyTo)
        .returns<Receipt[]>()
    : { data: [] as Receipt[] };
  const hasNextPage = (selectedHistory ?? []).length === 20;

  return (
    <div className="animate-tapp-fade grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
      <section className="space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold text-muted">NFC counters</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">
              Counter control
            </h1>
            <p className="mt-1 text-sm text-muted">
              Each puck keeps its own latest receipt and history.
            </p>
          </div>
          {searchParams?.error ? (
            <p className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
              {searchParams.error}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(tags ?? []).map((tag) => {
            const latest = latestByTag.get(tag.id);
            const active = tag.id === selectedTag?.id;
            return (
              <Card
                key={tag.id}
                className={`relative h-full overflow-hidden p-5 ${
                  active ? "border-amber bg-[#EEF1FF]/40 shadow-lift" : ""
                }`}
              >
                {active ? (
                  <span className="absolute inset-y-5 left-0 w-[3px] rounded-r-full bg-amber" />
                ) : null}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber/15 text-amber">
                      <Wifi className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-ink">{tag.label}</h3>
                      <p className="text-sm font-semibold text-muted">
                        {tag.tag_code}
                      </p>
                    </div>
                  </div>
                  {active ? <Radio className="h-5 w-5 text-amber" /> : null}
                </div>
                <p className="mt-5 text-sm text-muted">
                  Last receipt:{" "}
                  <span className="font-semibold text-ink">
                    {latest ? formatDateTime(latest.created_at) : "None yet"}
                  </span>
                </p>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/dashboard?tag=${tag.id}`}
                    scroll={false}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-[12px] border border-line bg-white/60 px-3 text-sm font-bold text-amber backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-soft"
                  >
                    Select
                  </Link>
                  <Link
                    href={`/dashboard/receipt/new?tag=${tag.id}`}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[12px] bg-amber px-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-clay hover:shadow-[0_4px_16px_rgba(79,110,247,0.35)]"
                  >
                    New Receipt
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="border-dashed p-0 hover:bg-[#EEF1FF]/70">
          <details>
            <summary className="flex cursor-pointer list-none flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-amber bg-amber/10 text-amber">
                <Plus className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-lg font-extrabold text-ink">Add Counter</span>
                <span className="text-sm text-muted">Create another NFC puck URL</span>
              </span>
            </summary>
            <form action={createTag} className="grid gap-3 border-t border-dashed border-line p-5 sm:grid-cols-[1fr_150px_auto]">
              <div className="space-y-2">
                <Label>Counter label</Label>
                <Input name="label" placeholder="Garden Bar" required />
              </div>
              <div className="space-y-2">
                <Label>Tag code</Label>
                <Input name="tag_code" placeholder="GARDEN01" />
              </div>
              <button className="self-end rounded-[12px] bg-amber px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-clay hover:shadow-lift">
                Add
              </button>
            </form>
          </details>
        </Card>
      </section>

      <aside className="space-y-5 lg:sticky lg:top-20">
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber">Live receipt</p>
              <h2 className="mt-1 text-2xl font-extrabold text-ink">
                {selectedTag?.label ?? "No counter"}
              </h2>
            </div>
            {selectedTag ? (
              <Link
                href={`/dashboard/receipt/new?tag=${selectedTag.id}`}
                className="inline-flex h-9 items-center gap-2 rounded-[12px] bg-ink px-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                <Plus className="h-4 w-4" />
                New
              </Link>
            ) : null}
          </div>
          {selectedLatest ? (
            <ReceiptCard
              merchantName={merchant.name}
              merchantLogoUrl={merchant.logo_url}
              receipt={selectedLatest}
              compact
              className="shadow-none hover:shadow-none"
            />
          ) : (
            <div className="rounded-[20px] border border-dashed border-line bg-white/45 px-6 py-12 text-center backdrop-blur">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-amber shadow-soft">
                <CircleDashed className="h-7 w-7" />
              </div>
              <p className="mt-4 font-extrabold text-ink">No live receipt</p>
              <p className="mt-1 text-sm text-muted">
                Create a receipt to make this puck live.
              </p>
            </div>
          )}
        </Card>

        <Card className="p-0">
          <div className="border-b border-line p-5">
            <h2 className="text-xl font-extrabold text-ink">Receipt history</h2>
            <p className="text-sm text-muted">
              Page {historyPage}, 20 receipts at a time.
            </p>
          </div>
          {(selectedHistory ?? []).length > 0 ? (
            <div className="space-y-3 p-3">
              {(selectedHistory ?? []).map((receipt) => (
                <div
                  key={receipt.id}
                  className="grid gap-3 rounded-[18px] border border-line bg-white/60 px-4 py-3 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-lift sm:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">
                      {formatDateTime(receipt.created_at)}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {receipt.items.length} items · {formatCurrency(receipt.total)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/r/${receipt.id}`}
                      className="inline-flex h-8 items-center gap-1 rounded-full border border-line bg-white/70 px-3 text-xs font-bold text-amber hover:bg-white"
                    >
                      View
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                    {selectedTag ? (
                      <form action={setReceiptLive}>
                        <input type="hidden" name="receipt_id" value={receipt.id} />
                        <input type="hidden" name="tag_id" value={selectedTag.id} />
                        <button
                          className={`h-8 rounded-full px-3 text-xs font-bold ${
                            receipt.is_latest
                              ? "bg-green-50 text-green-700"
                              : "bg-ink text-white"
                          }`}
                        >
                          {receipt.is_latest ? "Live" : "Set live"}
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center text-sm text-muted">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-amber shadow-soft">
                <ReceiptText className="h-7 w-7" />
              </div>
              <p className="font-bold text-ink">No receipt history yet</p>
              <p className="mt-1">Receipts for this counter will appear here.</p>
            </div>
          )}
          {(historyPage > 1 || hasNextPage) && selectedTag ? (
            <div className="flex items-center justify-between gap-3 border-t border-line p-4">
              <Link
                href={`/dashboard?tag=${selectedTag.id}&page=${historyPage - 1}`}
                className={`rounded-[10px] border border-line px-3 py-2 text-sm font-bold ${
                  historyPage > 1
                    ? "text-ink hover:border-amber hover:text-amber"
                    : "pointer-events-none text-muted/40"
                }`}
              >
                Previous
              </Link>
              <span className="text-sm font-semibold text-muted">
                Page {historyPage}
              </span>
              <Link
                href={`/dashboard?tag=${selectedTag.id}&page=${historyPage + 1}`}
                className={`rounded-[10px] border border-line px-3 py-2 text-sm font-bold ${
                  hasNextPage
                    ? "text-ink hover:border-amber hover:text-amber"
                    : "pointer-events-none text-muted/40"
                }`}
              >
                Next
              </Link>
            </div>
          ) : null}
        </Card>
      </aside>
    </div>
  );
}
