import { ReceiptView } from "@/components/receipt-view";
import { Card } from "@/components/ui";
import { createPublicClient } from "@/lib/supabase/public";
import type { Receipt, ReceiptMerchantProfile } from "@/lib/types";
import { getBaseUrl } from "@/lib/url";
import { AlertTriangle, ReceiptText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ReceiptPermalinkPage({
  params
}: {
  params: { receipt_id: string };
}) {
  const supabase = createPublicClient();

  const {
    data: receipt,
    error: receiptError
  } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", params.receipt_id)
    .eq("awaiting_items", false)
    .maybeSingle<Receipt>();

  if (receiptError) {
    return (
      <ReceiptShell>
        <ErrorState
          title="Saved receipt could not be loaded"
          body={receiptError.message}
        />
      </ReceiptShell>
    );
  }

  if (!receipt) {
    return (
      <ReceiptShell>
        <EmptyState
          title="Receipt not found"
          body="This saved receipt link does not match an existing receipt."
        />
      </ReceiptShell>
    );
  }

  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", receipt.merchant_id)
    .maybeSingle<Partial<ReceiptMerchantProfile>>();

  const merchantName = merchant?.name ?? "Merchant";

  return (
    <ReceiptShell>
      <ReceiptView
        merchantName={merchantName}
        merchantId={receipt.merchant_id}
        merchantLogoUrl={merchant?.logo_url ?? null}
        merchantProfile={merchant}
        receipt={receipt}
        permalink={`${getBaseUrl()}/r/${receipt.id}`}
        banner={`This is a saved receipt from ${merchantName}`}
      />
    </ReceiptShell>
  );
}

function ReceiptShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-transparent px-4 py-5 sm:py-10">
      <div className="mx-auto w-full max-w-[480px]">{children}</div>
    </main>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="py-12 text-center">
      <div className="solid-mark mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-soft">
        <ReceiptText className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-semibold text-ink">{title}</h1>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted">{body}</p>
    </Card>
  );
}

function ErrorState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-700">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-semibold text-ink">{title}</h1>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted">{body}</p>
    </Card>
  );
}
