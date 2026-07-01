"use client";

import { OwnerReceiptsTable } from "@/components/owner-receipts-table";
import { StaffReceiptsList } from "@/app/staff/receipts/staff-receipts-list";
import type { Receipt, ReceiptMerchantProfile } from "@/lib/types";
import type { Tag } from "@/lib/types";

export function PosReceiptsPanel({
  mode,
  merchantName,
  merchantProfile,
  receipts,
  tags,
  staffById,
  baseUrl,
  sandboxRecipient
}: {
  mode: "owner" | "staff";
  merchantName: string;
  merchantProfile: Partial<ReceiptMerchantProfile>;
  receipts: Receipt[];
  tags: Tag[];
  staffById: Record<string, string>;
  baseUrl: string;
  sandboxRecipient?: string | null;
}) {
  if (mode === "staff") {
    return (
      <div className="h-full overflow-y-auto bg-cream px-6 py-6">
        <StaffReceiptsList
          merchantName={merchantName}
          merchantProfile={merchantProfile}
          receipts={receipts}
          tags={tags}
          staffById={staffById}
          baseUrl={baseUrl}
          sandboxRecipient={sandboxRecipient}
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-cream px-6 py-6">
      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Receipts</h1>
        <p className="mt-1 text-sm text-muted">Full receipt history for {merchantName}.</p>
      </div>
      <section className="overflow-hidden rounded-[16px] bg-white p-5 shadow-soft">
        {receipts.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">No receipts yet.</p>
        ) : (
          <OwnerReceiptsTable
            merchantName={merchantName}
            merchantProfile={merchantProfile}
            receipts={receipts}
            tags={tags}
            staffById={staffById}
            baseUrl={baseUrl}
            sandboxRecipient={sandboxRecipient}
          />
        )}
      </section>
    </div>
  );
}
