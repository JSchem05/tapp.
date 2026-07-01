"use client";

import { OwnerReceiptsTable } from "@/components/owner-receipts-table";
import { StaffReceiptsList } from "@/app/staff/receipts/staff-receipts-list";
import { buildReceiptsCsv, downloadCsv } from "@/lib/receipt-export";
import type { Receipt, ReceiptMerchantProfile, Tag } from "@/lib/types";
import { Download, ReceiptText } from "lucide-react";
import { useMemo, useState } from "react";

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
  const [query, setQuery] = useState("");
  const tagById = useMemo(() => new Map(tags.map((tag) => [tag.id, tag])), [tags]);

  const filteredReceipts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return receipts;
    return receipts.filter((receipt) => {
      const tagLabel = tagById.get(receipt.tag_id)?.label ?? "";
      const receiptNumber = receipt.receipt_number != null ? String(receipt.receipt_number) : "";
      const itemText = receipt.items.map((item) => item.name).join(" ");
      const staffName = receipt.staff_id ? staffById[receipt.staff_id] ?? "" : "";
      const haystack = `${tagLabel} ${receiptNumber} ${itemText} ${receipt.total} ${staffName}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, receipts, staffById, tagById]);

  function exportCsv() {
    const csv = buildReceiptsCsv(filteredReceipts, tagById, staffById);
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`tapp-receipts-${date}.csv`, csv);
  }

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
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-ink">Receipts</h1>
          <p className="mt-1 text-sm text-muted">Full receipt history for {merchantName}.</p>
        </div>
        {receipts.length > 0 ? (
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-line bg-white px-4 text-sm font-bold text-ink shadow-sm transition hover:bg-[#FAFAFA]"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        ) : null}
      </div>

      {receipts.length > 0 ? (
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by counter, receipt number, item, staff, or total"
          className="mb-4 h-11 w-full rounded-[10px] border border-line bg-white px-3 text-sm outline-none focus:border-ink"
        />
      ) : null}

      <section className="overflow-hidden rounded-[16px] bg-white p-5 shadow-soft">
        {receipts.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-12 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blueSoft text-blue">
              <ReceiptText className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">No receipts yet</p>
            <p className="mt-1 text-sm text-muted">
              Completed POS orders and manual receipts will appear here.
            </p>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted">
            No receipts match your search.
          </p>
        ) : (
          <OwnerReceiptsTable
            merchantName={merchantName}
            merchantProfile={merchantProfile}
            receipts={filteredReceipts}
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
