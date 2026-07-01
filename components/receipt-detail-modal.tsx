"use client";

import { CopyButton } from "@/components/copy-button";
import {
  LoyaltyCardSection,
  PromoBannerSection,
  ReviewPromptSection
} from "@/components/receipt-engagement-sections";
import { ReceiptCard } from "@/components/receipt-view";
import { AppModal, AppModalBody, AppModalHeader } from "@/components/app-modal";
import { Input, Label } from "@/components/ui";
import { getPromoConfig } from "@/lib/merchant-promo";
import { formatDateTime } from "@/lib/money";
import type { Receipt, ReceiptMerchantProfile } from "@/lib/types";
import { X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

export type ReceiptDetailData = {
  merchantName: string;
  merchantProfile?: Partial<ReceiptMerchantProfile> | null;
  receipt: Receipt;
  tagLabel: string;
  staffName: string | null;
  receiptUrl: string;
};

export function ReceiptDetailModal({
  detail,
  onClose,
  onToast,
  sandboxRecipient = null
}: {
  detail: ReceiptDetailData | null;
  onClose: () => void;
  onToast: (message: string, type?: "success" | "error") => void;
  sandboxRecipient?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setEmail(sandboxRecipient ?? "");
    setSending(false);
  }, [detail?.receipt.id, sandboxRecipient]);

  if (!detail) return null;

  const receiptId = detail.receipt.id;
  const profile = detail.merchantProfile ?? {};
  const promo = getPromoConfig(profile);

  async function sendEmail() {
    const trimmed = email.trim();
    if (!trimmed) {
      onToast("Enter an email address.", "error");
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`/api/receipts/${receiptId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed })
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Could not send receipt email.");
      }

      onToast(`Receipt sent to ${trimmed}`, "success");
      setEmail("");
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Could not send receipt email.", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppModal
      open
      onClose={onClose}
      resetKey={detail.receipt.id}
      ariaLabelledBy="receipt-detail-title"
    >
      <AppModalHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="receipt-detail-title" className="text-xl font-bold text-ink">
              {detail.merchantName}
            </h2>
            <p className="mt-1 text-sm text-muted">{formatDateTime(detail.receipt.created_at)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-line text-ink hover:bg-[#FAFAFA]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </AppModalHeader>

      <AppModalBody className="space-y-5">
        <div className="space-y-1 text-sm">
          <p className="text-ink">
            <span className="font-semibold">Counter:</span> {detail.tagLabel}
          </p>
          {detail.staffName ? (
            <p className="text-ink">
              <span className="font-semibold">Rung up by:</span> {detail.staffName}
            </p>
          ) : null}
        </div>

        <ReceiptCard
          merchantName={detail.merchantName}
          merchantProfile={profile}
          receipt={detail.receipt}
          showHeader={false}
          className="border border-line shadow-none"
        />

        {profile.show_review && profile.google_review_url ? (
          <ReviewPromptSection profile={profile} />
        ) : null}
        {profile.show_loyalty ? <LoyaltyCardSection profile={profile} /> : null}
        {promo.showPromo && promo.headline ? (
          <PromoBannerSection profile={profile} />
        ) : null}

        <div className="rounded-[16px] border border-line bg-blueSoft p-4 text-center">
          <QRCodeSVG value={detail.receiptUrl} size={140} level="M" className="mx-auto" />
          <p className="mt-3 break-all text-xs text-muted">{detail.receiptUrl}</p>
          <div className="mt-3 flex justify-center">
            <CopyButton value={detail.receiptUrl} label="Copy link" />
          </div>
        </div>

        <div className="rounded-[16px] border border-line bg-white p-4">
          <Label>Send by email</Label>
          {sandboxRecipient ? (
            <p className="mt-2 rounded-[10px] bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
              No custom domain yet — Resend only delivers to{" "}
              <span className="font-semibold">{sandboxRecipient}</span> for now. Share the
              receipt link or QR above with customers until you verify a domain at{" "}
              <a
                href="https://resend.com/domains"
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline"
              >
                resend.com/domains
              </a>
              .
            </p>
          ) : null}
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={sandboxRecipient ?? "customer@email.com"}
              className="flex-1"
            />
            <button
              type="button"
              disabled={sending}
              onClick={sendEmail}
              className="h-11 shrink-0 rounded-[10px] bg-ink px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </AppModalBody>
    </AppModal>
  );
}
