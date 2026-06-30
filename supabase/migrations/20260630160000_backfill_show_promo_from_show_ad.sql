-- show_promo defaulted to false on add; copy show_ad where promo was never enabled explicitly.
update public.merchants
set show_promo = true
where show_ad = true
  and show_promo = false
  and (
    promo_headline is not null
    or ad_headline is not null
  );
