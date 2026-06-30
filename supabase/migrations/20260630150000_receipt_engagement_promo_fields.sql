-- Receipt engagement + promo banner fields (safe to re-run).
alter table public.merchants
  add column if not exists show_review boolean default false,
  add column if not exists google_review_url text,
  add column if not exists show_loyalty boolean default false,
  add column if not exists loyalty_goal int default 5,
  add column if not exists loyalty_reward text,
  add column if not exists show_promo boolean default false,
  add column if not exists promo_headline text,
  add column if not exists promo_subtext text,
  add column if not exists promo_cta_label text,
  add column if not exists promo_cta_url text,
  add column if not exists promo_color text default '#2563EB';

-- Backfill promo_* from legacy ad_* columns when present.
update public.merchants
set
  show_promo = coalesce(show_promo, show_ad, false),
  promo_headline = coalesce(promo_headline, ad_headline),
  promo_subtext = coalesce(promo_subtext, ad_subtext),
  promo_cta_label = coalesce(promo_cta_label, ad_cta_label),
  promo_cta_url = coalesce(promo_cta_url, ad_cta_url),
  promo_color = coalesce(promo_color, ad_bg_color, '#2563EB')
where
  show_promo is null
  or promo_headline is null
  or promo_subtext is null
  or promo_cta_label is null
  or promo_cta_url is null
  or promo_color is null;
