"use client";

import { CopyButton } from "@/components/copy-button";
import { SecondaryButton } from "@/components/ui";
import { Check, Plus } from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

export function ReceiptSuccess({
  url
}: {
  url: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-6 text-center">
      <div className="mx-auto flex h-16 w-16 animate-tapp-fade items-center justify-center rounded-full bg-green-50 text-green-600">
        <Check className="h-8 w-8" />
      </div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink">
        Receipt is live
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
        The NFC puck now opens this receipt. Customers can tap or scan the QR.
      </p>

      <div className="mx-auto mt-6 inline-flex rounded-2xl border border-line bg-white/70 p-3 shadow-soft backdrop-blur">
        <QRCodeSVG value={url} size={176} level="M" />
      </div>

      <p className="mt-4 break-all rounded-2xl border border-line bg-white/45 px-4 py-3 text-sm font-medium text-muted">
        {url}
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <CopyButton value={url} />
        <Link
          href="/dashboard/receipt/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-line bg-white/60 px-4 text-sm font-bold text-amber backdrop-blur transition hover:bg-white"
        >
          <Plus className="h-4 w-4" />
          Create another
        </Link>
        <SecondaryButton type="button" onClick={() => window.open(url, "_blank")}>
          Open receipt
        </SecondaryButton>
      </div>
    </div>
  );
}
