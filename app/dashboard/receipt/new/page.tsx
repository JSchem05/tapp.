import { ReceiptForm } from "@/app/dashboard/receipt/new/receipt-form";
import { ReceiptSuccess } from "@/components/receipt-success";
import { ReceiptView } from "@/components/receipt-view";
import { Card } from "@/components/ui";
import { getAuthedMerchant } from "@/lib/auth";
import type { Receipt, Tag } from "@/lib/types";
import { getBaseUrl } from "@/lib/url";

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
        <ReceiptSuccess url={url} />

        {receipt ? (
          <ReceiptView
            merchantName={merchant.name}
            merchantLogoUrl={merchant.logo_url}
            receipt={receipt}
            permalink={`${getBaseUrl()}/r/${receipt.id}`}
            compact
            showActions={false}
          />
        ) : null}
      </div>
    );
  }

  if (!tags?.length) {
    return (
      <Card className="py-12 text-center">
        <h1 className="text-2xl font-bold text-ink">No NFC pucks yet</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
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
      merchantName={merchant.name}
      merchantLogoUrl={merchant.logo_url}
    />
  );
}
