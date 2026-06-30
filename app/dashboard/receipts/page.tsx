import { OwnerReceiptsTable } from "@/components/owner-receipts-table";
import { getOwnerContext } from "@/lib/merchant-context";
import type { Receipt, Tag } from "@/lib/types";
import { getResendSandboxRecipient } from "@/lib/resend-config";
import { getBaseUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const { supabase, merchant } = await getOwnerContext();
  const baseUrl = getBaseUrl();
  const sandboxRecipient = getResendSandboxRecipient();

  const [{ data: receipts }, { data: tags }, { data: staffMembers }] = await Promise.all([
    supabase
      .from("receipts")
      .select("*")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false })
      .returns<Receipt[]>(),
    supabase
      .from("tags")
      .select("*")
      .eq("merchant_id", merchant.id)
      .returns<Tag[]>(),
    supabase.from("staff").select("id, name").eq("merchant_id", merchant.id)
  ]);

  const staffById = Object.fromEntries(
    (staffMembers ?? []).map((member) => [member.id, member.name])
  );

  return (
    <div className="animate-tapp-fade space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Receipts</h1>
        <p className="mt-1 text-sm text-muted">Full receipt history for {merchant.name}.</p>
      </div>

      <section className="overflow-hidden rounded-[16px] bg-white p-5 shadow-soft">
        {(receipts ?? []).length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">No receipts yet.</p>
        ) : (
          <OwnerReceiptsTable
            merchantName={merchant.name}
            merchantProfile={merchant}
            receipts={receipts ?? []}
            tags={tags ?? []}
            staffById={staffById}
            baseUrl={baseUrl}
            sandboxRecipient={sandboxRecipient}
          />
        )}
      </section>
    </div>
  );
}
