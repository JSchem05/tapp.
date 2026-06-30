"use client";

import { setReceiptLiveInstant } from "@/app/staff/actions";
import { ReceiptDetailModal, type ReceiptDetailData } from "@/components/receipt-detail-modal";
import { formatCurrency, formatDateTime } from "@/lib/money";
import type { Receipt, ReceiptMerchantProfile, Tag } from "@/lib/types";
import { useMemo, useState, useTransition } from "react";

export function StaffReceiptsList({
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
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [detail, setDetail] = useState<ReceiptDetailData | null>(null);
  const [isPending, startTransition] = useTransition();
  const tagById = useMemo(() => new Map(tags.map((tag) => [tag.id, tag])), [tags]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return receipts;
    return receipts.filter((receipt) => {
      const tagLabel = tagById.get(receipt.tag_id)?.label ?? "";
      const itemText = receipt.items.map((item) => item.name).join(" ");
      const haystack = `${tagLabel} ${itemText} ${receipt.total}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, receipts, tagById]);

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

  function handleSetLive(receiptId: string, tagLabel: string) {
    startTransition(async () => {
      try {
        const result = await setReceiptLiveInstant(receiptId);
        showToast(`Now live on ${result.tagLabel || tagLabel}`, "success");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Could not set receipt live.", "error");
      }
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-ink">Today&apos;s receipts</h1>
        <p className="mt-1 text-sm text-muted">
          Click a row for details, or set a receipt live for its counter.
        </p>
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by item or total"
        className="mb-4 h-11 w-full rounded-[10px] border border-line bg-white px-3 text-sm outline-none focus:border-ink"
      />

      {toast ? (
        <p
          className={`mb-4 rounded-[10px] px-3 py-2 text-sm font-semibold ${
            toast.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}
        >
          {toast.message}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-[16px] bg-white shadow-soft">
        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No receipts today yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 font-semibold">Counter</th>
                <th className="px-4 py-3 font-semibold">Items</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Staff</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((receipt) => {
                const tag = tagById.get(receipt.tag_id);
                return (
                  <tr
                    key={receipt.id}
                    className="cursor-pointer border-b border-line last:border-0 transition hover:bg-blueSoft/40"
                    onClick={() => openDetail(receipt)}
                  >
                    <td className="px-4 py-3 text-ink">{formatDateTime(receipt.created_at)}</td>
                    <td className="px-4 py-3 text-ink">{tag?.label ?? "Counter"}</td>
                    <td className="px-4 py-3 text-muted">
                      {receipt.awaiting_items
                        ? "Awaiting items"
                        : `${receipt.items.length} items`}
                    </td>
                    <td className="px-4 py-3 font-bold text-ink">
                      {formatCurrency(receipt.total)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {receipt.staff_id && staffById[receipt.staff_id]
                        ? staffById[receipt.staff_id]
                        : "—"}
                    </td>
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {!receipt.awaiting_items ? (
                        <button
                          type="button"
                          disabled={isPending || receipt.is_latest}
                          onClick={() => handleSetLive(receipt.id, tag?.label ?? "Counter")}
                          className="rounded-[8px] bg-ink px-3 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                        >
                          {receipt.is_latest ? "Live" : "Set live"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ReceiptDetailModal
        detail={detail}
        onClose={() => setDetail(null)}
        onToast={showToast}
        sandboxRecipient={sandboxRecipient}
      />
    </div>
  );
}
