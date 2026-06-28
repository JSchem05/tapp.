"use client";

/* eslint-disable @next/next/no-img-element */

import { Card } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Receipt, ReceiptItem } from "@/lib/types";
import { ChevronDown, Download, Printer, Share2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type ReceiptDisplay = Pick<
  Receipt,
  | "id"
  | "created_at"
  | "items"
  | "subtotal"
  | "vat"
  | "total"
  | "payment_method"
>;

export function ReceiptView({
  merchantName,
  merchantLogoUrl,
  receipt,
  history = [],
  permalink,
  compact = false,
  showActions = true,
  banner
}: {
  merchantName: string;
  merchantLogoUrl?: string | null;
  receipt: ReceiptDisplay;
  history?: ReceiptDisplay[];
  permalink?: string;
  compact?: boolean;
  showActions?: boolean;
  banner?: string;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState("");

  const fileDate = useMemo(
    () => new Date(receipt.created_at).toISOString().slice(0, 10),
    [receipt.created_at]
  );

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  function savePdf() {
    window.print();
  }

  async function saveImage() {
    if (!receiptRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(receiptRef.current, {
      backgroundColor: "#FFFFFF",
      scale: window.devicePixelRatio || 2
    });
    const link = document.createElement("a");
    link.download = `tapp-receipt-${fileDate}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    notify("Image saved");
  }

  async function shareReceipt() {
    const url = permalink ?? window.location.href;
    const title = `Receipt from ${merchantName}`;

    if (navigator.share) {
      await navigator.share({ title, url });
      return;
    }

    await navigator.clipboard.writeText(url);
    notify("Link copied to clipboard");
  }

  return (
    <div className="animate-tapp-fade space-y-4">
      {banner ? (
        <div className="glass-card rounded-full px-4 py-2 text-center text-sm font-semibold text-muted">
          {banner}
        </div>
      ) : null}

      <div ref={receiptRef} className="receipt-print-area">
        <ReceiptCard
          merchantName={merchantName}
          merchantLogoUrl={merchantLogoUrl}
          receipt={receipt}
          compact={compact}
        />
      </div>

      {showActions ? (
        <div className="no-print grid grid-cols-3 gap-2">
          <ActionButton onClick={savePdf} icon={<Printer className="h-4 w-4" />}>
            PDF
          </ActionButton>
          <ActionButton
            onClick={saveImage}
            icon={<Download className="h-4 w-4" />}
          >
            Image
          </ActionButton>
          <ActionButton onClick={shareReceipt} icon={<Share2 className="h-4 w-4" />}>
            Share
          </ActionButton>
        </div>
      ) : null}

      {history.length > 0 ? (
        <PreviousVisits
          merchantName={merchantName}
          merchantLogoUrl={merchantLogoUrl}
          receipts={history}
        />
      ) : null}

      <p className="no-print text-center text-xs font-medium text-muted/70">
        Powered by Tapp.
      </p>

      {toast ? (
        <div className="no-print animate-tapp-toast fixed bottom-5 right-5 z-50 rounded-[14px] bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lift">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

export function ReceiptCard({
  merchantName,
  merchantLogoUrl,
  receipt,
  compact = false,
  className
}: {
  merchantName: string;
  merchantLogoUrl?: string | null;
  receipt: ReceiptDisplay;
  compact?: boolean;
  className?: string;
}) {
  const items = receipt.items as ReceiptItem[];

  return (
    <Card
      className={cn(
        "overflow-hidden",
        compact ? "p-5" : "p-6",
        className
      )}
    >
      <div className="mb-6 flex items-start gap-3">
        <LogoMark merchantName={merchantName} logoUrl={merchantLogoUrl} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-extrabold tracking-tight text-ink">
            {merchantName}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {formatDateTime(receipt.created_at)}
          </p>
        </div>
      </div>

      <div className="divide-y divide-line border-y border-line">
        {items.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="grid grid-cols-[1fr_auto] gap-4 py-4 first:pt-5 last:pb-5"
          >
            <div className="min-w-0">
              <p className="truncate font-bold text-ink">{item.name}</p>
              <p className="mt-1 text-sm text-muted">
                Qty {item.qty} x {formatCurrency(item.price)}
              </p>
            </div>
            <p className="font-bold text-ink">
              {formatCurrency(item.qty * item.price)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <ReceiptRow label="Subtotal" value={formatCurrency(receipt.subtotal)} />
        <ReceiptRow label="VAT 18%" value={formatCurrency(receipt.vat)} />
        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-base font-extrabold text-ink">Total</span>
          <span className="text-3xl font-extrabold tracking-tight text-ink">
            {formatCurrency(receipt.total)}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm font-medium text-muted">Payment method</span>
        <span className="rounded-full border border-line bg-[#EEF1FF] px-3 py-1 text-sm font-extrabold text-amber">
          {receipt.payment_method}
        </span>
      </div>
    </Card>
  );
}

function PreviousVisits({
  merchantName,
  merchantLogoUrl,
  receipts
}: {
  merchantName: string;
  merchantLogoUrl?: string | null;
  receipts: ReceiptDisplay[];
}) {
  return (
    <section className="no-print space-y-3">
      <div>
        <h2 className="text-lg font-extrabold text-ink">Previous visits</h2>
        <p className="text-sm text-muted">Last 10 receipts from this counter.</p>
      </div>
      <div className="glass-card overflow-hidden">
        {receipts.map((receipt) => (
          <details key={receipt.id} className="group border-b border-line last:border-b-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 transition hover:bg-[#EEF1FF]/70">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">
                  {formatDateTime(receipt.created_at)}
                </span>
                <span className="text-xs text-muted">
                  {receipt.items.length} items
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink">
                  {formatCurrency(receipt.total)}
                </span>
                <ChevronDown className="h-4 w-4 text-muted transition group-open:rotate-180" />
              </span>
            </summary>
            <div className="px-3 pb-3">
              <ReceiptCard
                merchantName={merchantName}
                merchantLogoUrl={merchantLogoUrl}
                receipt={receipt}
                compact
                className="shadow-none"
              />
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function LogoMark({
  merchantName,
  logoUrl
}: {
  merchantName: string;
  logoUrl?: string | null;
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${merchantName} logo`}
        className="h-14 w-14 rounded-full border border-white/90 object-cover shadow-soft"
      />
    );
  }

  const initials = merchantName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "T";

  return (
    <div className="blue-gradient-mark flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-extrabold text-white shadow-soft">
      {initials}
    </div>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

function ActionButton({
  children,
  icon,
  onClick
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-full border border-line bg-white/60 px-3 text-xs font-bold text-amber shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:border-amber hover:bg-white hover:shadow-lift sm:text-sm"
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}
