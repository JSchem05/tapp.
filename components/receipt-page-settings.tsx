"use client";

import {
  LoyaltyCardSection,
  PromoBannerSection,
  ReviewPromptSection
} from "@/components/receipt-engagement-sections";
import { Input, Label } from "@/components/ui";
import { getPromoConfig } from "@/lib/merchant-promo";
import type { Merchant, ReceiptMerchantProfile } from "@/lib/types";
import { Megaphone } from "lucide-react";
import { useMemo, useState } from "react";

type EngagementState = Pick<
  ReceiptMerchantProfile,
  | "show_review"
  | "google_review_url"
  | "show_loyalty"
  | "loyalty_goal"
  | "loyalty_reward"
  | "show_promo"
  | "promo_headline"
  | "promo_subtext"
  | "promo_cta_label"
  | "promo_cta_url"
  | "promo_color"
  | "show_ad"
  | "ad_headline"
  | "ad_subtext"
  | "ad_cta_label"
  | "ad_cta_url"
  | "ad_bg_color"
>;

function initialEngagement(merchant: Merchant): EngagementState {
  const promo = getPromoConfig(merchant);
  return {
    show_review: merchant.show_review ?? false,
    google_review_url: merchant.google_review_url,
    show_loyalty: merchant.show_loyalty ?? false,
    loyalty_goal: merchant.loyalty_goal ?? 5,
    loyalty_reward: merchant.loyalty_reward,
    show_promo: promo.showPromo,
    promo_headline: promo.headline,
    promo_subtext: promo.subtext,
    promo_cta_label: promo.ctaLabel,
    promo_cta_url: promo.ctaUrl,
    promo_color: promo.color,
    show_ad: merchant.show_ad ?? false,
    ad_headline: merchant.ad_headline,
    ad_subtext: merchant.ad_subtext,
    ad_cta_label: merchant.ad_cta_label,
    ad_cta_url: merchant.ad_cta_url,
    ad_bg_color: merchant.ad_bg_color
  };
}

export function ReceiptPageSettings({ merchant }: { merchant: Merchant }) {
  const [engagement, setEngagement] = useState(() => initialEngagement(merchant));

  const previewProfile = useMemo(
    () => ({
      ...engagement,
      show_promo: engagement.show_promo,
      promo_headline: engagement.promo_headline,
      promo_subtext: engagement.promo_subtext,
      promo_cta_label: engagement.promo_cta_label,
      promo_cta_url: engagement.promo_cta_url,
      promo_color: engagement.promo_color
    }),
    [engagement]
  );

  const promo = getPromoConfig(previewProfile);

  function patch(values: Partial<EngagementState>) {
    setEngagement((current) => ({ ...current, ...values }));
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-6">
        <SettingsGroup title="Reviews and loyalty">
          <ToggleField
            name="show_review"
            label="Show Google review prompt"
            checked={engagement.show_review}
            onChange={(checked) => patch({ show_review: checked })}
          />
          <SettingInput
            name="google_review_url"
            label="Google review URL"
            value={engagement.google_review_url ?? ""}
            onChange={(value) => patch({ google_review_url: value || null })}
            placeholder="https://g.page/r/..."
          />
          <ToggleField
            name="show_loyalty"
            label="Show loyalty card"
            checked={engagement.show_loyalty}
            onChange={(checked) => patch({ show_loyalty: checked })}
          />
          <SettingInput
            name="loyalty_goal"
            label="Visits needed"
            value={String(engagement.loyalty_goal ?? 5)}
            onChange={(value) =>
              patch({ loyalty_goal: Number(value) > 0 ? Number(value) : 5 })
            }
            placeholder="5"
          />
          <SettingInput
            name="loyalty_reward"
            label="Reward"
            value={engagement.loyalty_reward ?? ""}
            onChange={(value) => patch({ loyalty_reward: value || null })}
            placeholder="free coffee"
          />
        </SettingsGroup>

        <SettingsGroup title="Promotion banner">
          <ToggleField
            name="show_promo"
            label="Show promotion banner"
            checked={engagement.show_promo}
            onChange={(checked) => patch({ show_promo: checked })}
          />
          <SettingInput
            name="promo_headline"
            label="Headline"
            value={engagement.promo_headline ?? ""}
            onChange={(value) => patch({ promo_headline: value || null })}
            placeholder="Happy Hour 5-7pm"
            icon={<Megaphone className="h-4 w-4" />}
          />
          <SettingInput
            name="promo_subtext"
            label="Subtext"
            value={engagement.promo_subtext ?? ""}
            onChange={(value) => patch({ promo_subtext: value || null })}
            placeholder="2 cocktails for €12"
          />
          <SettingInput
            name="promo_cta_label"
            label="Button label"
            value={engagement.promo_cta_label ?? ""}
            onChange={(value) => patch({ promo_cta_label: value || null })}
            placeholder="See menu"
          />
          <SettingInput
            name="promo_cta_url"
            label="Button URL"
            value={engagement.promo_cta_url ?? ""}
            onChange={(value) => patch({ promo_cta_url: value || null })}
            placeholder="https://example.com/menu"
          />
          <div className="space-y-2">
            <Label>Banner color</Label>
            <div className="flex items-center gap-3">
              <input
                name="promo_color"
                type="color"
                value={engagement.promo_color ?? "#2563EB"}
                onChange={(event) => patch({ promo_color: event.target.value })}
                className="h-11 w-16 rounded-[10px] border border-line bg-white p-1 shadow-sm"
              />
              <span className="text-sm text-muted">Used as a soft tint on the customer receipt.</span>
            </div>
          </div>
        </SettingsGroup>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-[16px] border border-line bg-blueSoft/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Live preview</p>
          <p className="mt-1 text-xs text-muted">
            Sections appear as customers will see them below the receipt.
          </p>
          <div className="mt-4 space-y-3">
            {previewProfile.show_review && previewProfile.google_review_url ? (
              <ReviewPromptSection profile={previewProfile} />
            ) : (
              <PreviewPlaceholder label="Review prompt hidden" />
            )}
            {previewProfile.show_loyalty ? (
              <LoyaltyCardSection profile={previewProfile} />
            ) : (
              <PreviewPlaceholder label="Loyalty card hidden" />
            )}
            {promo.showPromo && promo.headline ? (
              <PromoBannerSection profile={previewProfile} />
            ) : (
              <PreviewPlaceholder label="Promo banner hidden" />
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function SettingsGroup({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[16px] border border-line bg-white p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

function SettingInput({
  name,
  label,
  value,
  onChange,
  placeholder,
  icon
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        ) : null}
        <Input
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={icon ? "pl-9" : undefined}
        />
      </div>
    </div>
  );
}

function ToggleField({
  name,
  label,
  checked,
  onChange
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-[16px] border border-line bg-white px-4 py-3 text-sm font-semibold text-ink shadow-sm">
      <span>{label}</span>
      <span className="relative inline-flex h-7 w-12 shrink-0 items-center">
        <input
          name={name}
          type="checkbox"
          value="on"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span className="absolute inset-0 rounded-full border border-line bg-white transition peer-checked:border-amber peer-checked:bg-amber" />
        <span className="absolute left-1 h-5 w-5 rounded-full bg-muted/50 transition peer-checked:translate-x-5 peer-checked:bg-white" />
      </span>
    </label>
  );
}

function PreviewPlaceholder({ label }: { label: string }) {
  return (
    <div className="rounded-[16px] border border-dashed border-line bg-white/70 px-4 py-3 text-center text-xs text-muted">
      {label}
    </div>
  );
}
