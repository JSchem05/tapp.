"use client";

/* eslint-disable @next/next/no-img-element */

import { Card } from "@/components/ui";
import { formatCurrency, formatDateTime } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { Receipt, ReceiptItem, ReceiptMerchantProfile } from "@/lib/types";
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  Globe,
  Instagram,
  Lock,
  MapPin,
  Phone,
  Printer,
  Share2,
  Wifi
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";

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
  merchantProfile,
  receipt,
  history = [],
  permalink,
  compact = false,
  showActions = true,
  banner
}: {
  merchantName: string;
  merchantLogoUrl?: string | null;
  merchantProfile?: Partial<ReceiptMerchantProfile> | null;
  receipt: ReceiptDisplay;
  history?: ReceiptDisplay[];
  permalink?: string;
  compact?: boolean;
  showActions?: boolean;
  banner?: string;
}) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState("");
  const [currentUrl, setCurrentUrl] = useState(permalink ?? "");

  const fileDate = useMemo(
    () => new Date(receipt.created_at).toISOString().slice(0, 10),
    [receipt.created_at]
  );

  const profile = {
    ...merchantProfile,
    name: merchantProfile?.name ?? merchantName,
    logo_url: merchantProfile?.logo_url ?? merchantLogoUrl ?? null
  };

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

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
    <div className="animate-tapp-fade space-y-3">
      {banner ? (
        <ReceiptSection delay={0}>
          <div className="glass-card rounded-full px-4 py-2 text-center text-sm font-semibold text-muted">
          {banner}
          </div>
        </ReceiptSection>
      ) : null}

      <MerchantInfoSection profile={profile} delay={banner ? 60 : 0} />

      <ReceiptSection delay={banner ? 120 : 60}>
        <div ref={receiptRef} className="receipt-print-area">
        <ReceiptCard
          merchantName={merchantName}
          merchantLogoUrl={merchantLogoUrl}
          receipt={receipt}
          compact={compact}
        />
        </div>
      </ReceiptSection>

      {showActions ? (
        <ReceiptSection delay={banner ? 180 : 120} className="no-print grid grid-cols-3 gap-2">
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
        </ReceiptSection>
      ) : null}

      <WifiSection
        profile={profile}
        notify={notify}
        delay={banner ? 240 : 180}
      />
      <QrSection
        profile={profile}
        url={currentUrl || permalink || ""}
        notify={notify}
        delay={banner ? 300 : 240}
      />
      <PromotionSection profile={profile} delay={banner ? 360 : 300} />

      {history.length > 0 ? (
        <ReceiptSection delay={banner ? 420 : 360}>
          <PreviousVisits
            merchantName={merchantName}
            merchantLogoUrl={merchantLogoUrl}
            receipts={history}
          />
        </ReceiptSection>
      ) : null}

      <ReceiptSection delay={banner ? 480 : 420}>
        <a
          href="https://tapp.mt"
          target="_blank"
          rel="noreferrer"
          className="no-print flex items-center justify-center gap-2 text-center text-[11px] font-medium text-muted/70 transition hover:text-amber"
        >
          <span className="blue-gradient-mark flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-extrabold text-white">
            T
          </span>
          Powered by Tapp.
        </a>
      </ReceiptSection>

      {toast ? (
        <div className="no-print animate-tapp-toast fixed bottom-5 right-5 z-50 rounded-[14px] bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lift">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function ReceiptSection({
  children,
  delay,
  className
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
}) {
  return (
    <section
      className={cn("receipt-section animate-tapp-fade", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

function MerchantInfoSection({
  profile,
  delay
}: {
  profile: Partial<ReceiptMerchantProfile>;
  delay: number;
}) {
  if (profile.show_info === false) return null;

  const pills = merchantInfoPills(profile);

  return (
    <ReceiptSection delay={delay}>
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <LogoMark
            merchantName={profile.name ?? "Merchant"}
            logoUrl={profile.logo_url ?? null}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-extrabold text-ink">
              {profile.name ?? "Merchant"}
            </p>
            {profile.tagline ? (
              <p className="mt-1 text-xs leading-5 text-muted">{profile.tagline}</p>
            ) : null}
          </div>
        </div>
        {pills.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {pills.map((pill) => (
              <a
                key={pill.label}
                href={pill.href}
                target={pill.external ? "_blank" : undefined}
                rel={pill.external ? "noreferrer" : undefined}
                className="inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-full border border-line bg-white/60 px-3 py-1 text-xs font-bold text-ink shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:text-amber hover:shadow-soft"
              >
                <span className="text-amber">{pill.icon}</span>
                <span className="truncate">{pill.label}</span>
              </a>
            ))}
          </div>
        ) : null}
      </Card>
    </ReceiptSection>
  );
}

function WifiSection({
  profile,
  notify,
  delay
}: {
  profile: Partial<ReceiptMerchantProfile>;
  notify: (message: string) => void;
  delay: number;
}) {
  const [copied, setCopied] = useState(false);

  if (!profile.show_wifi || !profile.wifi_name) return null;

  async function copyPassword() {
    if (!profile.wifi_password) return;
    await navigator.clipboard.writeText(profile.wifi_password);
    setCopied(true);
    notify("WiFi password copied");
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <ReceiptSection delay={delay}>
      <Card className="border-[rgba(79,110,247,0.2)] bg-[rgba(79,110,247,0.06)] p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EEF1FF] text-amber">
              <Wifi className="h-4 w-4" />
            </span>
            <p className="text-sm font-extrabold text-ink">Free WiFi</p>
          </div>
          <span className="min-w-0 truncate rounded-full border border-line bg-[#EEF1FF] px-3 py-1 text-xs font-extrabold text-amber">
            {profile.wifi_name}
          </span>
        </div>
        {profile.wifi_password ? (
          <div className="mt-4 flex flex-col gap-3 rounded-[16px] border border-line bg-white/55 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <Lock className="h-4 w-4 shrink-0 text-amber" />
              <span className="truncate text-sm font-semibold text-ink">
                {profile.wifi_password}
              </span>
            </div>
            <button
              type="button"
              onClick={copyPassword}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-line bg-white/70 px-3 text-xs font-extrabold text-amber shadow-sm transition hover:bg-white"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Tap to copy"}
            </button>
          </div>
        ) : null}
      </Card>
    </ReceiptSection>
  );
}

function QrSection({
  profile,
  url,
  notify,
  delay
}: {
  profile: Partial<ReceiptMerchantProfile>;
  url: string;
  notify: (message: string) => void;
  delay: number;
}) {
  if (profile.show_qr === false || !url) return null;

  async function copyUrl() {
    await navigator.clipboard.writeText(url);
    notify("Receipt link copied");
  }

  return (
    <ReceiptSection delay={delay}>
      <Card className="p-5 text-center">
        <h2 className="text-sm font-extrabold text-ink">Save this receipt</h2>
        <p className="mt-1 text-xs text-muted">Scan to open on another device</p>
        <div className="mx-auto mt-4 inline-flex rounded-[20px] border border-line bg-white/75 p-3 shadow-soft backdrop-blur">
          <QRCodeSVG value={url} size={140} level="M" />
        </div>
        <button
          type="button"
          onClick={copyUrl}
          className="mx-auto mt-4 flex max-w-full items-center justify-center gap-2 rounded-full border border-line bg-white/60 px-3 py-2 text-[11px] font-semibold text-muted shadow-sm backdrop-blur transition hover:bg-white hover:text-amber"
        >
          <span className="truncate">{url}</span>
          <Copy className="h-3.5 w-3.5 shrink-0 text-amber" />
        </button>
      </Card>
    </ReceiptSection>
  );
}

function PromotionSection({
  profile,
  delay
}: {
  profile: Partial<ReceiptMerchantProfile>;
  delay: number;
}) {
  if (!profile.show_ad || !profile.ad_headline) return null;

  const color = normalizeHexColor(profile.ad_bg_color ?? "#4F6EF7");
  const ctaHref = normalizeExternalUrl(profile.ad_cta_url ?? "");

  return (
    <ReceiptSection delay={delay}>
      <Card
        className="p-5"
        style={{
          backgroundColor: hexToRgba(color, 0.15),
          borderColor: hexToRgba(color, 0.3)
        }}
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 className="text-lg font-extrabold leading-snug text-ink">
              {profile.ad_headline}
            </h2>
            {profile.ad_subtext ? (
              <p className="mt-1 text-sm leading-6 text-muted">{profile.ad_subtext}</p>
            ) : null}
          </div>
          {profile.ad_cta_label && ctaHref ? (
            <a
              href={ctaHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-[12px] bg-amber px-4 text-sm font-extrabold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-clay"
            >
              {profile.ad_cta_label}
            </a>
          ) : null}
        </div>
      </Card>
    </ReceiptSection>
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
  logoUrl,
  size = "md"
}: {
  merchantName: string;
  logoUrl?: string | null;
  size?: "sm" | "md";
}) {
  const classes =
    size === "sm"
      ? "h-11 w-11 text-base"
      : "h-14 w-14 text-lg";

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={`${merchantName} logo`}
        className={cn(
          "rounded-full border border-white/90 object-cover shadow-soft",
          classes
        )}
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
    <div
      className={cn(
        "blue-gradient-mark flex shrink-0 items-center justify-center rounded-full font-extrabold text-white shadow-soft",
        classes
      )}
    >
      {initials}
    </div>
  );
}

function merchantInfoPills(profile: Partial<ReceiptMerchantProfile>) {
  const pills: {
    label: string;
    href: string;
    icon: React.ReactNode;
    external?: boolean;
  }[] = [];

  if (profile.phone) {
    pills.push({
      label: profile.phone,
      href: `tel:${profile.phone.replace(/\s+/g, "")}`,
      icon: <Phone className="h-3.5 w-3.5" />
    });
  }

  if (profile.website) {
    const href = normalizeExternalUrl(profile.website);
    pills.push({
      label: domainLabel(profile.website),
      href,
      icon: <Globe className="h-3.5 w-3.5" />,
      external: true
    });
  }

  if (profile.address) {
    pills.push({
      label: profile.address,
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}`,
      icon: <MapPin className="h-3.5 w-3.5" />,
      external: true
    });
  }

  if (profile.show_social !== false && profile.instagram) {
    const handle = profile.instagram.replace(/^@/, "");
    pills.push({
      label: `@${handle}`,
      href: `https://instagram.com/${handle}`,
      icon: <Instagram className="h-3.5 w-3.5" />,
      external: true
    });
  }

  return pills;
}

function normalizeExternalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function domainLabel(value: string) {
  try {
    return new URL(normalizeExternalUrl(value)).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

function normalizeHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : "#4F6EF7";
}

function hexToRgba(hex: string, alpha: number) {
  const value = normalizeHexColor(hex).slice(1);
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
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
