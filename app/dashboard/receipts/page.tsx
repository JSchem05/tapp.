import { formatCurrency, formatDateTime } from "@/lib/money";
import { getOwnerContext } from "@/lib/merchant-context";
import type { Receipt, Tag } from "@/lib/types";
import { ReceiptText } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const { supabase, merchant } = await getOwnerContext();

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
    supabase
      .from("staff")
      .select("id, name")
      .eq("merchant_id", merchant.id)
  ]);

  const tagById = new Map((tags ?? []).map((tag) => [tag.id, tag]));
  const staffById = new Map((staffMembers ?? []).map((member) => [member.id, member.name]));

  return (
    <div className="animate-tapp-fade space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Receipts</h1>
        <p className="mt-1 text-sm text-muted">Full receipt history for {merchant.name}.</p>
      </div>

      <section className="overflow-hidden rounded-[16px] bg-white shadow-soft">
        {(receipts ?? []).length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">No receipts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-line text-[13px] font-semibold text-muted">
                  <th className="px-5 py-3">Counter</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {(receipts ?? []).map((receipt) => (
                  <tr key={receipt.id} className="border-b border-line">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0F0F0] text-ink">
                          <ReceiptText className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-bold text-ink">
                          {tagById.get(receipt.tag_id)?.label ?? "Counter"}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted">
                      <p>{formatDateTime(receipt.created_at)}</p>
                      {receipt.staff_id && staffById.get(receipt.staff_id) ? (
                        <p className="text-xs">Rung up by {staffById.get(receipt.staff_id)}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 text-sm text-muted">
                      {receipt.awaiting_items
                        ? "Awaiting items"
                        : `${receipt.items.length} items`}
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-ink">
                      {formatCurrency(receipt.total)}
                    </td>
                    <td className="px-5 py-3">
                      {receipt.is_latest ? (
                        <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
                          Live
                        </span>
                      ) : receipt.awaiting_items ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                          Awaiting items
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#F0F0F0] px-3 py-1 text-xs font-bold text-ink">
                          Saved
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={
                          receipt.awaiting_items
                            ? `/dashboard/receipt/new?awaiting=${receipt.id}`
                            : `/r/${receipt.id}`
                        }
                        className="text-sm font-bold text-ink"
                      >
                        {receipt.awaiting_items ? "Complete" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
