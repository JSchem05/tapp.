import type { ReceiptMerchantProfile } from "@/lib/types";

export function getPromoConfig(profile: Partial<ReceiptMerchantProfile>) {
  const showPromo = Boolean(profile.show_promo || profile.show_ad);
  const headline = profile.promo_headline ?? profile.ad_headline ?? null;
  const subtext = profile.promo_subtext ?? profile.ad_subtext ?? null;
  const ctaLabel = profile.promo_cta_label ?? profile.ad_cta_label ?? null;
  const ctaUrl = profile.promo_cta_url ?? profile.ad_cta_url ?? null;
  const color = profile.promo_color ?? profile.ad_bg_color ?? "#2563EB";

  return { showPromo, headline, subtext, ctaLabel, ctaUrl, color };
}
