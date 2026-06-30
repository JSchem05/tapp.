"use client";

import { ReceiptDetailModal, type ReceiptDetailData } from "@/components/receipt-detail-modal";
import { formatCurrency, formatDateTime } from "@/lib/money";
import type { Receipt, ReceiptMerchantProfile, Tag } from "@/lib/types";
import { ReceiptText } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export function OwnerReceiptsTable({
  merchantName,
  merchantProfile,
  receipts,
  tags,
  staffById,
  baseUrl,
  sandboxRecipient = null
}: {
  merchantName: string;
  merchantProfile: Partial<ReceiptMerchantProfile>;
  receipts: Receipt[];
  tags: Tag[];
  staffById: Record<string, string>;
  baseUrl: string;
  sandboxRecipient?: string | null;
}) {
  const [detail, setDetail] = useState<ReceiptDetailData | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const tagById = useMemo(() => new Map(tags.map((tag) => [tag.id, tag])), [tags]);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3000);
  }

  function openDetail(receipt: Receipt) {
    const tag = tagById.get(receipt.tag_id);
    setDetail({
      merchantName,
      merchantProfile,
      receipt,
      tagLabel: tag?.label ?? "Counter",
      staffName: receipt.staff_id ? staffById[receipt.staff_id] ?? null : null,
      receiptUrl: `${baseUrl}/r/${receipt.id}`
    });
  }

  return (
    <>
      {toast ? (
        <p
          className={`mb-4 rounded-[10px] px-3 py-2 text-sm font-semibold ${
            toast.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {toast.message}
        </p>
      ) : null}

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
            {receipts.map((receipt) => (
              <tr
                key={receipt.id}
                className="cursor-pointer border-b border-line transition hover:bg-blueSoft/40"
                onClick={() => openDetail(receipt)}
              >
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
                  {receipt.staff_id && staffById[receipt.staff_id] ? (
                    <p className="text-xs">Rung up by {staffById[receipt.staff_id]}</p>
                  ) : null}
                </td>
                <td className="px-5 py-3 text-sm text-muted">
                  {receipt.awaiting_items ? "Awaiting items" : `${receipt.items.length} items`}
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
                <td className="px-5 py-3 text-right" onClick={(event) => event.stopPropagation()}>
                  {receipt.awaiting_items ? (
                    <Link
                      href={`/dashboard/receipt/new?awaiting=${receipt.id}`}
                      className="text-sm font-bold text-ink"
                    >
                      Complete
                    </Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ReceiptDetailModal
        detail={detail}
        onClose={() => setDetail(null)}
        onToast={showToast}
        sandboxRecipient={sandboxRecipient}
      />
    </>
  );
}
