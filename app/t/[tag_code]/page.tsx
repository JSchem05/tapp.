import { Card } from "@/components/ui";
import { createPublicClient } from "@/lib/supabase/public";
import type { ReceiptMerchantProfile, Tag } from "@/lib/types";
import { AlertTriangle, ReceiptText } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type TagWithMerchant = Tag & {
  merchants: Partial<ReceiptMerchantProfile> | null;
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
    .select("*, merchants(*)")
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
    .select("id, awaiting_items")
    .eq("merchant_id", tag.merchant_id)
    .eq("tag_id", tag.id)
    .eq("is_latest", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string; awaiting_items: boolean }>();

  console.log("[public-receipt] latest receipt lookup", {
    tagCode: tag.tag_code,
    tagId: tag.id,
    merchantId: tag.merchant_id,
    status: receiptStatus,
    error: receiptError,
    receipt: receipt
      ? {
          id: receipt.id,
          awaiting_items: receipt.awaiting_items
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

  if (receipt?.awaiting_items) {
    return (
      <PublicShell>
        <EmptyReceipt
          title="Receipt not ready yet"
          body={`${tag.label} is still being prepared. Tap again in a moment once the merchant finishes this sale.`}
        />
      </PublicShell>
    );
  }

  if (receipt) {
    redirect(`/r/${receipt.id}`);
  }

  const { data: awaitingReceipt } = await supabase
    .from("receipts")
    .select("id")
    .eq("merchant_id", tag.merchant_id)
    .eq("tag_id", tag.id)
    .eq("awaiting_items", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (awaitingReceipt) {
    return (
      <PublicShell>
        <EmptyReceipt
          title="Receipt not ready yet"
          body={`${tag.label} is still being prepared. Tap again in a moment once the merchant finishes this sale.`}
        />
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <EmptyReceipt
        title="No receipt available yet"
        body={`${tag.label} is ready. Ask the merchant to send the latest sale to this puck.`}
      />
    </PublicShell>
  );
}

function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-transparent px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-[480px]">{children}</div>
    </main>
  );
}

function EmptyReceipt({ title, body }: { title: string; body: string }) {
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

function ErrorReceipt({ title, body }: { title: string; body: string }) {
  return (
    <Card className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-700">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-semibold text-ink">{title}</h1>
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
