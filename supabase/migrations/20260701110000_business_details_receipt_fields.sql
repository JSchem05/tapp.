alter table public.merchants
  add column if not exists show_business_details boolean default false,
  add column if not exists vat_number text;
