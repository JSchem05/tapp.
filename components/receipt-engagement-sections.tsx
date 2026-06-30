"use client";

import { Card } from "@/components/ui";
import { getPromoConfig } from "@/lib/merchant-promo";
import { cn } from "@/lib/utils";
import type { ReceiptMerchantProfile } from "@/lib/types";
import { Star } from "lucide-react";

export function ReviewPromptSection({
  profile,
  className
}: {
  profile: Partial<ReceiptMerchantProfile>;
  className?: string;
}) {
  if (!profile.show_review || !profile.google_review_url) return null;

  return (
    <Card className={cn("rounded-[16px] p-5 text-center shadow-soft", className)}>
      <p className="text-[15px] font-semibold text-ink">Enjoyed it?</p>
      <p className="mt-1 text-[13px] text-muted">Leave us a review</p>
      <div className="mt-3 flex justify-center gap-1 text-amber-400" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className="h-4 w-4 fill-current" />
        ))}
      </div>
      <a
        href={normalizeExternalUrl(profile.google_review_url)}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[10px] bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:bg-[#1D4ED8]"
      >
        Leave a review
      </a>
    </Card>
  );
}

export function LoyaltyCardSection({
  profile,
  className
}: {
  profile: Partial<ReceiptMerchantProfile>;
  className?: string;
}) {
  if (!profile.show_loyalty) return null;

  const goal = Math.max(1, Math.min(12, Number(profile.loyalty_goal ?? 5)));
  // TODO: tie to customers.visit_count once customer identification (email opt-in) is implemented.
  const stamps = 1;
  const reward = profile.loyalty_reward || "reward";

  return (
    <Card className={cn("rounded-[16px] p-5 shadow-soft", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Loyalty</p>
      <div
        className="mt-3 flex flex-wrap gap-2"
        aria-label={`${stamps} of ${goal} loyalty stamps`}
      >
        {Array.from({ length: goal }).map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-8 w-8 rounded-full border-2",
              index < stamps
                ? "border-[#2563EB] bg-[#2563EB]"
                : "border-line bg-white"
            )}
          />
        ))}
      </div>
      <p className="mt-3 text-[13px] text-muted">
        {stamps} of {goal} visits to your free {reward}
      </p>
    </Card>
  );
}

export function PromoBannerSection({
  profile,
  className
}: {
  profile: Partial<ReceiptMerchantProfile>;
  className?: string;
}) {
  const { showPromo, headline, subtext, ctaLabel, ctaUrl, color } = getPromoConfig(profile);
  if (!showPromo || !headline) return null;

  const ctaHref = normalizeExternalUrl(ctaUrl ?? "");
  const tint = hexToRgba(normalizeHexColor(color), 0.08);
  const border = hexToRgba(normalizeHexColor(color), 0.25);

  return (
    <Card
      className={cn("rounded-[16px] p-5 shadow-soft", className)}
      style={{ backgroundColor: tint, borderColor: border }}
    >
      <p className="text-base font-semibold text-ink">{headline}</p>
      {subtext ? <p className="mt-1 text-[13px] text-muted">{subtext}</p> : null}
      {ctaLabel && ctaHref ? (
        <a
          href={ctaHref}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex h-10 items-center justify-center rounded-[10px] px-4 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: normalizeHexColor(color) }}
        >
          {ctaLabel}
        </a>
      ) : null}
    </Card>
  );
}

function normalizeExternalUrl(value: string) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function normalizeHexColor(value: string) {
  const hex = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) return hex;
  return "#2563EB";
}

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
