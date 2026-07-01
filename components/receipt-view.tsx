"use client";

/* eslint-disable @next/next/no-img-element */

import { Card } from "@/components/ui";
import {
  LoyaltyCardSection,
  PromoBannerSection,
  ReviewPromptSection
} from "@/components/receipt-engagement-sections";
import { joinReceiptOffers } from "@/app/receipt-engagement/actions";
import { ReceiptActionsRow } from "@/components/receipt-actions";
import { formatCurrency, formatDateTime } from "@/lib/money";
import { getPromoConfig } from "@/lib/merchant-promo";
import { cn } from "@/lib/utils";
import type { Receipt, ReceiptItem, ReceiptMerchantProfile } from "@/lib/types";
import {
  Check,
  ChevronDown,
  Copy,
  Globe,
  Instagram,
  Lock,
  Mail,
  MapPin,
  Phone,
  Wifi
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

type ReceiptDisplay = Pick<
  Receipt,
  | "id"
  | "created_at"
  | "receipt_number"
  | "items"
  | "subtotal"
  | "vat"
  | "total"
  | "payment_method"
  | "customer_email"
>;

export function ReceiptView({
  merchantName,
  merchantId,
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
  merchantId?: string;
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
  const promo = getPromoConfig(profile);

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  const shareUrl = permalink || currentUrl || "";

  return (
    <div className="animate-tapp-fade space-y-3">
      {banner ? (
        <ReceiptSection delay={0}>
          <div className="panel-card rounded-full px-4 py-2 text-center text-sm font-semibold text-muted">
          {banner}
          </div>
        </ReceiptSection>
      ) : null}

      <MerchantHeader
        profile={profile}
        createdAt={receipt.created_at}
        delay={banner ? 60 : 0}
      />

      <ReceiptSection delay={banner ? 120 : 60}>
        <div ref={receiptRef} className="receipt-print-area">
        <ReceiptCard
          merchantName={merchantName}
          merchantLogoUrl={merchantLogoUrl}
          merchantProfile={profile}
          receipt={receipt}
          compact={compact}
          showHeader={false}
        />
        </div>
      </ReceiptSection>

      {showActions ? (
        <ReceiptActionsRow
          receiptRef={receiptRef}
          merchantName={merchantName}
          permalink={shareUrl}
          fileDate={fileDate}
          onNotify={notify}
        />
      ) : null}

      {profile.show_review && profile.google_review_url ? (
        <ReceiptSection delay={banner ? 240 : 180}>
          <ReviewPromptSection profile={profile} />
        </ReceiptSection>
      ) : null}

      {profile.show_loyalty ? (
        <ReceiptSection delay={banner ? 300 : 240}>
          <LoyaltyCardSection profile={profile} />
        </ReceiptSection>
      ) : null}

      {promo.showPromo && promo.headline ? (
        <ReceiptSection delay={banner ? 360 : 300}>
          <PromoBannerSection profile={profile} />
        </ReceiptSection>
      ) : null}

      <WifiSection
        profile={profile}
        notify={notify}
        delay={banner ? 420 : 360}
      />
      <EmailOptInSection
        merchantId={merchantId}
        profile={profile}
        notify={notify}
        delay={banner ? 480 : 420}
      />
      <QrSection
        profile={profile}
        url={permalink || currentUrl || ""}
        notify={notify}
        delay={banner ? 540 : 480}
      />

      {history.length > 0 ? (
        <ReceiptSection delay={banner ? 600 : 540}>
          <PreviousVisits
            merchantName={merchantName}
            merchantLogoUrl={merchantLogoUrl}
            merchantProfile={profile}
            receipts={history}
          />
        </ReceiptSection>
      ) : null}

      <ReceiptSection delay={banner ? 660 : 600}>
        <a
          href="https://tapp.mt"
          target="_blank"
          rel="noreferrer"
          className="no-print flex items-center justify-center gap-2 text-center text-[11px] font-medium text-muted/70 transition hover:text-amber"
        >
          <span className="solid-mark flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-semibold text-white">
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

function MerchantHeader({
  profile,
  createdAt,
  delay
}: {
  profile: Partial<ReceiptMerchantProfile>;
  createdAt: string;
  delay: number;
}) {
  const pills = merchantInfoPills(profile);

  return (
    <ReceiptSection delay={delay}>
      <header className="px-1 py-2">
        <div className="flex items-center gap-3">
          <LogoMark
            merchantName={profile.name ?? "Merchant"}
            logoUrl={profile.logo_url ?? null}
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-ink">
              {profile.name ?? "Merchant"}
            </h1>
            <p className="mt-1 text-sm text-muted">{formatDateTime(createdAt)}</p>
          </div>
        </div>
        {profile.show_info !== false && profile.tagline ? (
          <p className="mt-3 text-sm leading-6 text-muted">{profile.tagline}</p>
        ) : null}
        {profile.show_info !== false && pills.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {pills.map((pill) => (
              <a
                key={pill.label}
                href={pill.href}
                target={pill.external ? "_blank" : undefined}
                rel={pill.external ? "noreferrer" : undefined}
                className="inline-flex min-h-7 max-w-full items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink shadow-sm transition hover:bg-blueSoft hover:shadow-soft"
              >
                <span className="text-muted">{pill.icon}</span>
                <span className="truncate">{pill.label}</span>
              </a>
            ))}
          </div>
        ) : null}
      </header>
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
      <Card className="border-line bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blueSoft text-amber">
              <Wifi className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-ink">Free WiFi</p>
          </div>
          <span className="min-w-0 truncate rounded-full border border-blueSoft bg-blueSoft px-3 py-1 text-xs font-semibold text-amber">
            {profile.wifi_name}
          </span>
        </div>
        {profile.wifi_password ? (
          <div className="mt-4 flex flex-col gap-3 rounded-[16px] border border-line bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <Lock className="h-4 w-4 shrink-0 text-muted" />
              <span className="truncate text-sm font-semibold text-ink">
                {profile.wifi_password}
              </span>
            </div>
            <button
              type="button"
              onClick={copyPassword}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-line bg-white px-3 text-xs font-semibold text-amber shadow-sm transition hover:bg-blueSoft"
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

function EmailOptInSection({
  merchantId,
  profile,
  notify,
  delay
}: {
  merchantId?: string;
  profile: Partial<ReceiptMerchantProfile>;
  notify: (message: string) => void;
  delay: number;
}) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  if (profile.show_email_opt_in === false || !merchantId) return null;
  const safeMerchantId = merchantId;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await joinReceiptOffers({ merchantId: safeMerchantId, email });
      setMessage(result.message);
      notify(result.message);
      if (result.ok) setEmail("");
    });
  }

  return (
    <ReceiptSection delay={delay}>
      <Card className="p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blueSoft text-amber">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-ink">Get our offers</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Join for promos, loyalty rewards, and useful updates.
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            className="h-10 min-w-0 rounded-[10px] border border-line bg-white px-3 text-sm text-ink outline-none transition placeholder:text-faint focus:border-amber focus:ring-4 focus:ring-amber/15"
            required
          />
          <button
            type="submit"
            disabled={isPending}
            className="h-10 rounded-[10px] bg-amber px-4 text-sm font-semibold text-white transition hover:bg-clay disabled:opacity-60"
          >
            {isPending ? "Joining" : "Join"}
          </button>
        </form>
        {message ? <p className="mt-3 text-xs font-semibold text-muted">{message}</p> : null}
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
        <h2 className="text-sm font-semibold text-ink">Save this receipt</h2>
        <p className="mt-1 text-xs text-muted">Scan to open on another device</p>
        <div className="mx-auto mt-4 inline-flex rounded-[20px] border border-line bg-white p-3 shadow-soft">
          <QRCodeSVG value={url} size={140} level="M" />
        </div>
        <button
          type="button"
          onClick={copyUrl}
          className="mx-auto mt-4 flex max-w-full items-center justify-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-[11px] font-semibold text-muted shadow-sm transition hover:bg-blueSoft hover:text-amber"
        >
          <span className="truncate">{url}</span>
          <Copy className="h-3.5 w-3.5 shrink-0 text-amber" />
        </button>
      </Card>
    </ReceiptSection>
  );
}

export function ReceiptCard({
  merchantName,
  merchantLogoUrl,
  merchantProfile,
  receipt,
  compact = false,
  showHeader = true,
  className
}: {
  merchantName: string;
  merchantLogoUrl?: string | null;
  merchantProfile?: Partial<ReceiptMerchantProfile> | null;
  receipt: ReceiptDisplay;
  compact?: boolean;
  showHeader?: boolean;
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
      {showHeader ? (
        <div className="mb-6 flex items-start gap-3">
          <LogoMark merchantName={merchantName} logoUrl={merchantLogoUrl} size="sm" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold tracking-tight text-ink">
              {merchantName}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {formatDateTime(receipt.created_at)}
            </p>
          </div>
        </div>
      ) : null}

      <FiscalReceiptMeta profile={merchantProfile} receipt={receipt} />

      <div className="divide-y divide-line border-y border-line">
        {items.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="grid grid-cols-[1fr_auto] gap-4 py-4 first:pt-5 last:pb-5"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{item.name}</p>
              <ReceiptItemModifierLine item={item} />
              <p className="mt-1 text-sm text-muted">
                Qty {item.qty} x {formatCurrency(item.price)}
              </p>
            </div>
            <p className="font-semibold text-ink">
              {formatCurrency(item.qty * item.price)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        <ReceiptRow label="Subtotal" value={formatCurrency(receipt.subtotal)} />
        <ReceiptRow label="VAT 18%" value={formatCurrency(receipt.vat)} />
        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-base font-semibold text-ink">Total</span>
          <span className="text-3xl font-semibold tracking-tight text-ink">
            {formatCurrency(receipt.total)}
          </span>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm font-medium text-muted">Payment method</span>
        <span className="rounded-full border border-blueSoft bg-blueSoft px-3 py-1 text-sm font-semibold text-amber">
          {receipt.payment_method}
        </span>
      </div>
    </Card>
  );
}

function PreviousVisits({
  merchantName,
  merchantLogoUrl,
  merchantProfile,
  receipts
}: {
  merchantName: string;
  merchantLogoUrl?: string | null;
  merchantProfile?: Partial<ReceiptMerchantProfile> | null;
  receipts: ReceiptDisplay[];
}) {
  return (
    <section className="no-print space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-ink">Previous visits</h2>
        <p className="text-sm text-muted">Last 10 receipts from this counter.</p>
      </div>
      <div className="panel-card overflow-hidden">
        {receipts.map((receipt) => (
          <details key={receipt.id} className="group border-b border-line last:border-b-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 transition hover:bg-blueSoft">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">
                  {formatDateTime(receipt.created_at)}
                </span>
                <span className="text-xs text-muted">
                  {receipt.items.length} items
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold text-ink">
                  {formatCurrency(receipt.total)}
                </span>
                <ChevronDown className="h-4 w-4 text-muted transition group-open:rotate-180" />
              </span>
            </summary>
            <div className="px-3 pb-3">
              <ReceiptCard
                merchantName={merchantName}
                merchantLogoUrl={merchantLogoUrl}
                merchantProfile={merchantProfile}
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

function FiscalReceiptMeta({
  profile,
  receipt
}: {
  profile?: Partial<ReceiptMerchantProfile> | null;
  receipt: Pick<ReceiptDisplay, "created_at" | "receipt_number">;
}) {
  const vatNumber = profile?.vat_number?.trim();
  const address = profile?.address?.trim();

  return (
    <div className="mb-4 space-y-2 border-b border-line pb-4">
      {receipt.receipt_number != null ? (
        <p className="text-sm font-semibold text-ink">
          Receipt #{receipt.receipt_number}
        </p>
      ) : null}
      <div className="grid grid-cols-[minmax(0,auto)_1fr] gap-x-3 text-sm leading-6">
        <span className="text-muted">Date & time</span>
        <span className="min-w-0 break-words font-medium text-ink">
          {formatDateTime(receipt.created_at)}
        </span>
      </div>
      {vatNumber ? (
        <div className="grid grid-cols-[minmax(0,auto)_1fr] gap-x-3 text-sm leading-6">
          <span className="text-muted">VAT registration</span>
          <span className="min-w-0 break-words font-medium text-ink">{vatNumber}</span>
        </div>
      ) : null}
      {address ? (
        <div className="grid grid-cols-[minmax(0,auto)_1fr] gap-x-3 text-sm leading-6">
          <span className="text-muted">Registered address</span>
          <span className="min-w-0 break-words font-medium text-ink">{address}</span>
        </div>
      ) : null}
    </div>
  );
}

function ReceiptItemModifierLine({ item }: { item: ReceiptItem }) {
  const modifierLine = formatReceiptItemModifiers(item);
  if (!modifierLine) return null;

  return (
    <p className="mt-1 text-sm leading-5 text-muted">
      {modifierLine}
    </p>
  );
}

function formatReceiptItemModifiers(item: ReceiptItem) {
  if (!Array.isArray(item.modifiers) || item.modifiers.length === 0) return "";

  return item.modifiers
    .filter((modifier) => modifier.name)
    .map((modifier) =>
      modifier.group_name ? `${modifier.group_name}: ${modifier.name}` : modifier.name
    )
    .join(", ");
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
        "solid-mark flex shrink-0 items-center justify-center rounded-full font-semibold text-white shadow-soft",
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

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
