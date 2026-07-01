"use client";

import { ReceiptView } from "@/components/receipt-view";
import { Card, Input, Label } from "@/components/ui";
import { getPromoConfig } from "@/lib/merchant-promo";
import type { Merchant, ReceiptMerchantProfile } from "@/lib/types";
import { Globe, Instagram, MapPin, Megaphone, Phone, Save } from "lucide-react";
import { useMemo, useState } from "react";

type DesignReceiptState = {
  name: string;
  tagline: string;
  vat_number: string;
  address: string;
  phone: string;
  website: string;
  instagram: string;
  show_wifi: boolean;
  wifi_name: string;
  wifi_password: string;
  show_review: boolean;
  google_review_url: string;
  show_loyalty: boolean;
  loyalty_goal: number;
  loyalty_reward: string;
  show_promo: boolean;
  promo_headline: string;
  promo_subtext: string;
  promo_cta_label: string;
  promo_cta_url: string;
  promo_color: string;
  show_qr: boolean;
  show_social: boolean;
  show_email_opt_in: boolean;
  show_info: boolean;
};

function initialState(merchant: Merchant): DesignReceiptState {
  const promo = getPromoConfig(merchant);

  return {
    name: merchant.name,
    tagline: merchant.tagline ?? "",
    vat_number: merchant.vat_number ?? "",
    address: merchant.address ?? "",
    phone: merchant.phone ?? "",
    website: merchant.website ?? "",
    instagram: merchant.instagram ?? "",
    show_wifi: merchant.show_wifi ?? false,
    wifi_name: merchant.wifi_name ?? "",
    wifi_password: merchant.wifi_password ?? "",
    show_review: merchant.show_review ?? false,
    google_review_url: merchant.google_review_url ?? "",
    show_loyalty: merchant.show_loyalty ?? false,
    loyalty_goal: merchant.loyalty_goal ?? 5,
    loyalty_reward: merchant.loyalty_reward ?? "",
    show_promo: promo.showPromo,
    promo_headline: promo.headline ?? "",
    promo_subtext: promo.subtext ?? "",
    promo_cta_label: promo.ctaLabel ?? "",
    promo_cta_url: promo.ctaUrl ?? "",
    promo_color: promo.color ?? "#2563EB",
    show_qr: merchant.show_qr ?? true,
    show_social: merchant.show_social ?? true,
    show_email_opt_in: merchant.show_email_opt_in ?? true,
    show_info: merchant.show_info ?? true
  };
}

const SAMPLE_RECEIPT = {
  id: "00000000-0000-4000-8000-000000000001",
  receipt_number: 128,
  created_at: "2026-06-30T12:00:00.000Z",
  items: [
    { name: "Cappuccino", qty: 1, price: 3.1 },
    { name: "Croissant", qty: 1, price: 2.8 }
  ],
  subtotal: 5.9,
  vat: 1.06,
  total: 6.96,
  payment_method: "Card" as const,
  customer_email: null
};

export function DesignReceiptEditor({ merchant }: { merchant: Merchant }) {
  const [state, setState] = useState(() => initialState(merchant));

  function patch(values: Partial<DesignReceiptState>) {
    setState((current) => ({ ...current, ...values }));
  }

  const previewProfile = useMemo<Partial<ReceiptMerchantProfile>>(
    () => ({
      name: state.name,
      logo_url: merchant.logo_url,
      tagline: state.tagline || null,
      phone: state.phone || null,
      website: state.website || null,
      instagram: state.instagram || null,
      address: state.address || null,
      vat_number: state.vat_number || null,
      wifi_name: state.wifi_name || null,
      wifi_password: state.wifi_password || null,
      google_review_url: state.google_review_url || null,
      loyalty_goal: state.loyalty_goal,
      loyalty_reward: state.loyalty_reward || null,
      show_promo: state.show_promo,
      promo_headline: state.promo_headline || null,
      promo_subtext: state.promo_subtext || null,
      promo_cta_label: state.promo_cta_label || null,
      promo_cta_url: state.promo_cta_url || null,
      promo_color: state.promo_color,
      show_qr: state.show_qr,
      show_wifi: state.show_wifi,
      show_review: state.show_review,
      show_loyalty: state.show_loyalty,
      show_email_opt_in: state.show_email_opt_in,
      show_social: state.show_social,
      show_info: state.show_info
    }),
    [merchant.logo_url, state]
  );

  return (
    <Card className="p-6">
      <div>
        <h2 className="text-[20px] font-semibold text-ink">Design receipt</h2>
        <p className="mt-1 text-[13px] text-muted">
          See exactly what your customers will see as you customize it
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-6">
        <div className="relative min-w-0">
          <div className="space-y-4 pb-28">
            <ControlCard title="Business info">
              <SettingInput
                name="name"
                label="Business name"
                value={state.name}
                onChange={(value) => patch({ name: value })}
                placeholder="Minó"
                required
              />
              <SettingInput
                name="tagline"
                label="Business tagline"
                value={state.tagline}
                onChange={(value) => patch({ tagline: value })}
                placeholder="Fresh coffee, baked daily"
              />
              <ToggleField
                name="show_info"
                label="Show merchant info"
                checked={state.show_info}
                onChange={(checked) => patch({ show_info: checked })}
              />
            </ControlCard>

            <ControlCard title="Business details">
              <SettingInput
                name="vat_number"
                label="VAT/registration number"
                hint="Recommended for fiscal compliance"
                value={state.vat_number}
                onChange={(value) => patch({ vat_number: value })}
                placeholder="MT12345678"
              />
              <SettingInput
                name="address"
                label="Registered address"
                hint="Recommended for fiscal compliance"
                value={state.address}
                onChange={(value) => patch({ address: value })}
                placeholder="123 Republic Street, Valletta"
                icon={<MapPin className="h-4 w-4" />}
              />
              <SettingInput
                name="phone"
                label="Phone number"
                value={state.phone}
                onChange={(value) => patch({ phone: value })}
                placeholder="+356 2123 4567"
                icon={<Phone className="h-4 w-4" />}
              />
            </ControlCard>

            <ControlCard title="WiFi">
              <ToggleField
                name="show_wifi"
                label="Show WiFi details"
                checked={state.show_wifi}
                onChange={(checked) => patch({ show_wifi: checked })}
              />
              <SettingInput
                name="wifi_name"
                label="Network name"
                value={state.wifi_name}
                onChange={(value) => patch({ wifi_name: value })}
                placeholder="Tapp Guest"
              />
              <SettingInput
                name="wifi_password"
                label="Password"
                value={state.wifi_password}
                onChange={(value) => patch({ wifi_password: value })}
                placeholder="coffee123"
              />
            </ControlCard>

            <ControlCard title="Reviews">
              <ToggleField
                name="show_review"
                label="Show Google review prompt"
                checked={state.show_review}
                onChange={(checked) => patch({ show_review: checked })}
              />
              <SettingInput
                name="google_review_url"
                label="Google review URL"
                value={state.google_review_url}
                onChange={(value) => patch({ google_review_url: value })}
                placeholder="https://g.page/r/..."
              />
            </ControlCard>

            <ControlCard title="Loyalty">
              <ToggleField
                name="show_loyalty"
                label="Show loyalty card"
                checked={state.show_loyalty}
                onChange={(checked) => patch({ show_loyalty: checked })}
              />
              <SettingInput
                name="loyalty_goal"
                label="Visits needed"
                value={String(state.loyalty_goal)}
                onChange={(value) =>
                  patch({ loyalty_goal: Number(value) > 0 ? Number(value) : 5 })
                }
                placeholder="5"
              />
              <SettingInput
                name="loyalty_reward"
                label="Reward"
                value={state.loyalty_reward}
                onChange={(value) => patch({ loyalty_reward: value })}
                placeholder="free coffee"
              />
            </ControlCard>

            <ControlCard title="Promotion banner">
              <ToggleField
                name="show_promo"
                label="Show promotion banner"
                checked={state.show_promo}
                onChange={(checked) => patch({ show_promo: checked })}
              />
              <SettingInput
                name="promo_headline"
                label="Headline"
                value={state.promo_headline}
                onChange={(value) => patch({ promo_headline: value })}
                placeholder="Happy Hour 5-7pm"
                icon={<Megaphone className="h-4 w-4" />}
              />
              <SettingInput
                name="promo_subtext"
                label="Subtext"
                value={state.promo_subtext}
                onChange={(value) => patch({ promo_subtext: value })}
                placeholder="2 cocktails for €12"
              />
              <SettingInput
                name="promo_cta_label"
                label="Button label"
                value={state.promo_cta_label}
                onChange={(value) => patch({ promo_cta_label: value })}
                placeholder="See menu"
              />
              <SettingInput
                name="promo_cta_url"
                label="Button URL"
                value={state.promo_cta_url}
                onChange={(value) => patch({ promo_cta_url: value })}
                placeholder="https://example.com/menu"
              />
              <div className="space-y-2">
                <Label>Banner color</Label>
                <div className="flex items-center gap-3">
                  <input
                    name="promo_color"
                    type="color"
                    value={state.promo_color}
                    onChange={(event) => patch({ promo_color: event.target.value })}
                    className="h-11 w-16 rounded-[10px] border border-line bg-white p-1 shadow-sm"
                  />
                  <span className="text-sm text-muted">
                    Used as a soft tint on the customer receipt.
                  </span>
                </div>
              </div>
            </ControlCard>

            <ControlCard title="QR code">
              <ToggleField
                name="show_qr"
                label="Show QR code"
                checked={state.show_qr}
                onChange={(checked) => patch({ show_qr: checked })}
              />
            </ControlCard>

            <ControlCard title="Social & email opt-in">
              <SettingInput
                name="website"
                label="Website"
                value={state.website}
                onChange={(value) => patch({ website: value })}
                placeholder="https://example.com"
                icon={<Globe className="h-4 w-4" />}
              />
              <SettingInput
                name="instagram"
                label="Instagram handle"
                value={state.instagram}
                onChange={(value) => patch({ instagram: value })}
                placeholder="@cafename"
                icon={<Instagram className="h-4 w-4" />}
              />
              <ToggleField
                name="show_social"
                label="Show social links"
                checked={state.show_social}
                onChange={(checked) => patch({ show_social: checked })}
              />
              <ToggleField
                name="show_email_opt_in"
                label="Show email opt-in"
                checked={state.show_email_opt_in}
                onChange={(checked) => patch({ show_email_opt_in: checked })}
              />
            </ControlCard>
          </div>

          <div className="sticky bottom-0 z-10 -mx-1 border-t border-line bg-white/95 px-1 pb-1 pt-4 backdrop-blur-sm">
            <button
              type="submit"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-amber px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-clay hover:shadow-lift"
            >
              <Save className="h-4 w-4" />
              Save changes
            </button>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-[20px] border border-line bg-[#F5F3EE] p-6">
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-muted">
              Live preview
            </p>
            <div className="mx-auto max-w-[380px]">
              <ReceiptView
                merchantName={state.name || merchant.name}
                merchantId={merchant.id}
                merchantLogoUrl={merchant.logo_url}
                merchantProfile={previewProfile}
                receipt={SAMPLE_RECEIPT}
                permalink="https://tapp.mt/r/preview"
                showActions={false}
                history={[]}
              />
            </div>
          </div>
        </aside>
      </div>
    </Card>
  );
}

function ControlCard({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[16px] border border-line bg-white p-4 shadow-sm">
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
  icon,
  required,
  hint
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
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
          required={required}
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
