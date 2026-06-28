import { ReceiptView } from "@/components/receipt-view";
import { Card } from "@/components/ui";
import { createPublicClient } from "@/lib/supabase/public";
import type { Merchant, Receipt, Tag } from "@/lib/types";
import { getBaseUrl } from "@/lib/url";
import { AlertTriangle, ReceiptText } from "lucide-react";

export const dynamic = "force-dynamic";

type TagWithMerchant = Tag & {
  merchants: Pick<Merchant, "name" | "logo_url"> | null;
};

export default async function PublicReceiptPage({
  params
}: {
  params: { tag_code: string };
}) {
  let supabase;
  try {
    supabase = createPublicClient();
  } catch (error) {
    console.error("[public-receipt] Supabase client failed to initialize", error);
    return (
      <PublicShell>
        <ErrorReceipt
          title="Receipt service is not configured"
          body="The public receipt viewer is missing its Supabase environment variables."
        />
      </PublicShell>
    );
  }

  const tagCode = decodeURIComponent(params.tag_code).trim();

  if (!tagCode) {
    return (
      <PublicShell>
        <EmptyReceipt
          title="NFC tag not found"
          body="This receipt link is missing a tag code."
        />
      </PublicShell>
    );
  }

  const {
    data: tag,
    error: tagError,
    status: tagStatus
  } = await supabase
    .from("tags")
    .select("*, merchants(name)")
    .ilike("tag_code", tagCode)
    .limit(1)
    .maybeSingle<TagWithMerchant>();

  console.log("[public-receipt] tag lookup", {
    tagCode,
    status: tagStatus,
    error: tagError,
    tag: tag
      ? {
          id: tag.id,
          merchant_id: tag.merchant_id,
          tag_code: tag.tag_code,
          merchantName: tag.merchants?.name ?? null
        }
      : null
  });

  if (tagError) {
    return (
      <PublicShell>
        <ErrorReceipt
          title="Receipt tag could not be loaded"
          body={formatSupabaseError(tagError.message)}
        />
      </PublicShell>
    );
  }

  if (!tag) {
    return (
      <PublicShell>
        <EmptyReceipt
          title="NFC tag not found"
          body="This tapp. puck has not been connected to a merchant yet."
        />
      </PublicShell>
    );
  }

  const {
    data: receipt,
    error: receiptError,
    status: receiptStatus
  } = await supabase
    .from("receipts")
    .select("*")
    .eq("merchant_id", tag.merchant_id)
    .eq("tag_id", tag.id)
    .eq("is_latest", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Receipt>();

  console.log("[public-receipt] latest receipt lookup", {
    tagCode: tag.tag_code,
    tagId: tag.id,
    merchantId: tag.merchant_id,
    status: receiptStatus,
    error: receiptError,
    receipt: receipt
      ? {
          id: receipt.id,
          tag_id: receipt.tag_id,
          merchant_id: receipt.merchant_id,
          is_latest: receipt.is_latest,
          total: receipt.total,
          created_at: receipt.created_at
        }
      : null
  });

  if (receiptError) {
    return (
      <PublicShell>
        <ErrorReceipt
          title="Receipt could not be loaded"
          body={formatSupabaseError(receiptError.message)}
        />
      </PublicShell>
    );
  }

  const { data: history, error: historyError } = await supabase
    .from("receipts")
    .select("*")
    .eq("merchant_id", tag.merchant_id)
    .eq("tag_id", tag.id)
    .order("created_at", { ascending: false })
    .limit(10)
    .returns<Receipt[]>();

  console.log("[public-receipt] history lookup", {
    tagCode: tag.tag_code,
    error: historyError,
    count: history?.length ?? 0
  });

  const merchantName = tag.merchants?.name ?? "Merchant";
  const logoUrl = tag.merchants?.logo_url ?? null;
  const baseUrl = getBaseUrl();

  return (
    <PublicShell>
      {receipt ? (
        <ReceiptView
          merchantName={merchantName}
          merchantLogoUrl={logoUrl}
          receipt={receipt}
          history={(history ?? []).filter((item) => item.id !== receipt.id)}
          permalink={`${baseUrl}/r/${receipt.id}`}
        />
      ) : (
        <EmptyReceipt
          title="No receipt available yet"
          body={`${tag.label} is ready. Ask the merchant to send the latest sale to this puck.`}
        />
      )}
    </PublicShell>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-transparent px-4 py-5 sm:py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-8 md:grid-cols-[minmax(0,380px)_minmax(360px,440px)] md:items-start md:justify-center">
        <div className="text-center md:sticky md:top-10 md:pt-10 md:text-left">
          <div className="blue-gradient-mark mx-auto flex h-12 w-12 items-center justify-center rounded-[14px] text-xl font-extrabold text-white shadow-soft md:mx-0">
            T
          </div>
          <p className="mt-4 text-4xl font-extrabold tracking-tight text-ink">Tapp.</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            NFC receipts for cafés, counters, and quick visits.
          </p>
        </div>
        <div>{children}</div>
      </div>
    </main>
  );
}

function EmptyReceipt({ title, body }: { title: string; body: string }) {
  return (
    <Card className="py-12 text-center">
      <div className="blue-gradient-mark mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-soft">
        <ReceiptText className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-bold text-ink">{title}</h1>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted">{body}</p>
    </Card>
  );
}

function ErrorReceipt({ title, body }: { title: string; body: string }) {
  return (
    <Card className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-700">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-bold text-ink">{title}</h1>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted">
        {body}
      </p>
    </Card>
  );
}

function formatSupabaseError(message: string) {
  if (message.toLowerCase().includes("permission denied")) {
    return "The public receipt viewer does not have permission to read this data. Check the anon SELECT policies for merchants, tags, and receipts.";
  }

  return message;
}
