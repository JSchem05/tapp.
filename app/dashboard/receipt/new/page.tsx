import { ReceiptForm } from "@/app/dashboard/receipt/new/receipt-form";
import { ReceiptSuccess } from "@/components/receipt-success";
import { ReceiptView } from "@/components/receipt-view";
import { OwnerShell } from "@/components/owner-shell";
import { Card } from "@/components/ui";
import { getOwnerContext } from "@/lib/merchant-context";
import type { Merchant, Receipt, Staff, Tag } from "@/lib/types";
import { getBaseUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function NewReceiptPage({
  searchParams
}: {
  searchParams?: { tag?: string; receipt?: string; awaiting?: string; error?: string };
}) {
  const { supabase, merchant } = await getOwnerContext();
  const [{ data: tags }, { data: staff }] = await Promise.all([
    supabase
      .from("tags")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: true })
      .returns<Tag[]>(),
    supabase
      .from("staff")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("created_at")
      .returns<Staff[]>()
  ]);

  let awaitingReceipt: Receipt | null = null;
  if (searchParams?.awaiting) {
    const { data } = await supabase
      .from("receipts")
      .select("*")
      .eq("id", searchParams.awaiting)
      .eq("merchant_id", merchant.id)
      .eq("awaiting_items", true)
      .single<Receipt>();
    awaitingReceipt = data ?? null;
  }

  let content: React.ReactNode;

  if (searchParams?.receipt) {
    const { data: receipt } = await supabase
      .from("receipts")
      .select("*")
      .eq("id", searchParams.receipt)
      .eq("merchant_id", merchant.id)
      .single<Receipt>();

    const tag = (tags ?? []).find((candidate) => candidate.id === receipt?.tag_id);
    const url = tag ? `${getBaseUrl()}/t/${tag.tag_code}` : "";

    content = (
      <div className="p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
          <ReceiptSuccess url={url} />
          {receipt ? (
            <ReceiptView
              merchantName={merchant.name}
              merchantLogoUrl={merchant.logo_url}
              merchantProfile={merchant}
              receipt={receipt}
              permalink={`${getBaseUrl()}/r/${receipt.id}`}
              compact
              showActions={false}
            />
          ) : null}
        </div>
      </div>
    );
  } else if (!tags?.length) {
    content = (
      <div className="flex min-h-full items-center justify-center p-6">
        <Card className="max-w-lg py-12 text-center">
          <h1 className="text-2xl font-bold text-ink">No NFC pucks yet</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Add a counter from Dashboard, then return here to create receipts for
            that puck.
          </p>
        </Card>
      </div>
    );
  } else {
    content = (
      <div className="p-6">
        <ReceiptForm
          tags={tags}
          defaultTagId={searchParams?.tag ?? awaitingReceipt?.tag_id}
          error={searchParams?.error}
          merchantName={merchant.name}
          merchantLogoUrl={merchant.logo_url}
          merchantProfile={merchant}
          awaitingReceipt={awaitingReceipt}
        />
      </div>
    );
  }

  return (
    <OwnerShell activeView="dashboard" staff={staff ?? []}>
      {content}
    </OwnerShell>
  );
}
