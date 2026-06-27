import { ReceiptForm } from "@/app/dashboard/receipt/new/receipt-form";
import { ReceiptView } from "@/components/receipt-view";
import { Card } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";
import { getAuthedMerchant } from "@/lib/auth";
import type { Receipt, Tag } from "@/lib/types";
import { CheckCircle2, Plus } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewReceiptPage({
  searchParams
}: {
  searchParams?: { tag?: string; receipt?: string; error?: string };
}) {
  const { supabase, merchant } = await getAuthedMerchant();
  const { data: tags } = await supabase
    .from("tags")
    .select("*")
    .eq("merchant_id", merchant.id)
    .order("created_at", { ascending: true })
    .returns<Tag[]>();

  if (searchParams?.receipt) {
    const { data: receipt } = await supabase
      .from("receipts")
      .select("*")
      .eq("id", searchParams.receipt)
      .eq("merchant_id", merchant.id)
      .single<Receipt>();

    const tag = (tags ?? []).find((candidate) => candidate.id === receipt?.tag_id);
    const url = tag ? `${getBaseUrl()}/t/${tag.tag_code}` : "";

    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <Card className="h-fit">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-sage" />
            <div>
              <h1 className="text-2xl font-bold text-ink">Receipt is live</h1>
              <p className="mt-1 text-sm text-coffee/65">
                The selected NFC puck now points to this latest receipt.
              </p>
            </div>
          </div>

          {tag ? (
            <div className="mt-6 rounded-2xl bg-cream p-4">
              <p className="text-sm font-semibold text-coffee">{tag.label}</p>
              <p className="mt-1 break-all text-sm text-coffee/70">{url}</p>
              <div className="mt-3">
                <CopyButton value={url} />
              </div>
            </div>
          ) : null}

          <Link
            href="/dashboard/receipt/new"
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-coffee px-4 text-sm font-semibold text-paper transition hover:bg-ink"
          >
            <Plus className="h-4 w-4" />
            Create another
          </Link>
        </Card>

        {receipt ? (
          <ReceiptView merchantName={merchant.name} receipt={receipt} compact />
        ) : null}
      </div>
    );
  }

  if (!tags?.length) {
    return (
      <Card className="py-12 text-center">
        <h1 className="text-2xl font-bold text-ink">No NFC pucks yet</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-coffee/65">
          Add a tag row in Supabase for this merchant, then return here to create
          receipts for that counter.
        </p>
      </Card>
    );
  }

  return (
    <ReceiptForm
      tags={tags}
      defaultTagId={searchParams?.tag}
      error={searchParams?.error}
    />
  );
}

function getBaseUrl() {
  const headerList = headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  const vercelUrl = process.env.VERCEL_URL;

  if (host) {
    return `${proto}://${host}`;
  }

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}
