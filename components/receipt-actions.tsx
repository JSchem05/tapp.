"use client";

import { cn } from "@/lib/utils";
import { Download, Printer, Share2 } from "lucide-react";
import type { RefObject } from "react";

export function ReceiptActionsRow({
  receiptRef,
  merchantName,
  permalink,
  fileDate,
  onNotify,
  className
}: {
  receiptRef: RefObject<HTMLDivElement | null>;
  merchantName: string;
  permalink: string;
  fileDate: string;
  onNotify?: (message: string) => void;
  className?: string;
}) {
  function notify(message: string) {
    onNotify?.(message);
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
    const title = `Receipt from ${merchantName}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url: permalink });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }

    await navigator.clipboard.writeText(permalink);
    notify("Link copied to clipboard");
  }

  return (
    <section className={cn("no-print grid grid-cols-3 gap-2", className)}>
      <ActionButton onClick={savePdf} icon={<Printer className="h-4 w-4" />}>
        Save PDF
      </ActionButton>
      <ActionButton onClick={saveImage} icon={<Download className="h-4 w-4" />}>
        Save image
      </ActionButton>
      <ActionButton onClick={shareReceipt} icon={<Share2 className="h-4 w-4" />}>
        Share
      </ActionButton>
    </section>
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
      className="flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-full border border-line bg-white px-3 text-xs font-semibold text-ink shadow-soft transition hover:border-amber hover:bg-blueSoft hover:text-amber hover:shadow-lift sm:text-sm"
    >
      {icon}
      <span className="truncate">{children}</span>
    </button>
  );
}
