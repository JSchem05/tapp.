import { ReceiptView } from "@/components/receipt-view";
import { Card } from "@/components/ui";
import { createPublicClient } from "@/lib/supabase/public";
import type { Merchant, Receipt, Tag } from "@/lib/types";
import { ReceiptText } from "lucide-react";

export const dynamic = "force-dynamic";

type TagWithMerchant = Tag & {
  merchants: Pick<Merchant, "name"> | null;
};

export default async function PublicReceiptPage({
  params
}: {
  params: { tag_code: string };
}) {
  const supabase = createPublicClient();
  const tagCode = params.tag_code.toUpperCase();

  const { data: tag } = await supabase
    .from("tags")
    .select("*, merchants(name)")
    .eq("tag_code", tagCode)
    .maybeSingle<TagWithMerchant>();

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

  const { data: receipt } = await supabase
    .from("receipts")
    .select("*")
    .eq("tag_id", tag.id)
    .eq("is_latest", true)
    .maybeSingle<Receipt>();

  return (
    <PublicShell>
      {receipt ? (
        <ReceiptView merchantName={tag.merchants?.name ?? "Merchant"} receipt={receipt} />
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
    <main className="min-h-screen bg-paper px-4 py-5 sm:bg-cream sm:py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-5 text-center">
          <p className="text-3xl font-bold text-ink">tapp.</p>
          <p className="mt-1 text-sm text-coffee/60">Digital receipt</p>
        </div>
        {children}
      </div>
    </main>
  );
}

function EmptyReceipt({ title, body }: { title: string; body: string }) {
  return (
    <Card className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cream text-coffee">
        <ReceiptText className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-bold text-ink">{title}</h1>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-coffee/65">{body}</p>
    </Card>
  );
}
