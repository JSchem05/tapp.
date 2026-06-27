create extension if not exists "pgcrypto";

create table if not exists public.merchants (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  tag_code text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  items jsonb not null,
  subtotal numeric(10, 2) not null,
  vat numeric(10, 2) not null,
  total numeric(10, 2) not null,
  payment_method text not null check (payment_method in ('Card', 'Cash', 'Other')),
  is_latest boolean not null default false,
  created_at timestamptz not null default now(),
  constraint receipts_items_array check (jsonb_typeof(items) = 'array')
);

create unique index if not exists receipts_one_latest_per_tag
  on public.receipts(tag_id)
  where is_latest = true;

create index if not exists tags_merchant_id_idx on public.tags(merchant_id);
create index if not exists receipts_merchant_id_created_at_idx on public.receipts(merchant_id, created_at desc);
create index if not exists receipts_tag_latest_idx on public.receipts(tag_id, is_latest);

alter table public.merchants enable row level security;
alter table public.tags enable row level security;
alter table public.receipts enable row level security;

drop policy if exists "Merchants can read their own profile" on public.merchants;
create policy "Merchants can read their own profile"
  on public.merchants for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "Public can read merchant display names" on public.merchants;
create policy "Public can read merchant display names"
  on public.merchants for select
  to anon
  using (true);

drop policy if exists "Merchants can update their own profile" on public.merchants;
create policy "Merchants can update their own profile"
  on public.merchants for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "Merchants can read their tags" on public.tags;
create policy "Merchants can read their tags"
  on public.tags for select
  to authenticated
  using (merchant_id = auth.uid());

drop policy if exists "Public can resolve NFC tags" on public.tags;
create policy "Public can resolve NFC tags"
  on public.tags for select
  to anon
  using (true);

drop policy if exists "Merchants can manage their tags" on public.tags;
create policy "Merchants can manage their tags"
  on public.tags for all
  to authenticated
  using (merchant_id = auth.uid())
  with check (merchant_id = auth.uid());

drop policy if exists "Merchants can read their receipts" on public.receipts;
create policy "Merchants can read their receipts"
  on public.receipts for select
  to authenticated
  using (merchant_id = auth.uid());

drop policy if exists "Public can read latest receipts" on public.receipts;
create policy "Public can read latest receipts"
  on public.receipts for select
  to anon
  using (is_latest = true);

drop policy if exists "Merchants can create their receipts" on public.receipts;
create policy "Merchants can create their receipts"
  on public.receipts for insert
  to authenticated
  with check (
    merchant_id = auth.uid()
    and exists (
      select 1 from public.tags
      where tags.id = tag_id
      and tags.merchant_id = auth.uid()
    )
  );

drop policy if exists "Merchants can update their receipts" on public.receipts;
create policy "Merchants can update their receipts"
  on public.receipts for update
  to authenticated
  using (merchant_id = auth.uid())
  with check (merchant_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.merchants (id, name, email, slug)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'business_name', split_part(new.email, '@', 1)),
    new.email,
    trim(both '-' from lower(regexp_replace(coalesce(new.raw_user_meta_data->>'business_name', split_part(new.email, '@', 1)), '[^a-zA-Z0-9]+', '-', 'g')))
      || '-' || substr(new.id::text, 1, 8)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Example seed after creating a Supabase Auth user:
-- insert into public.tags (merchant_id, tag_code, label)
-- values ('AUTH_USER_UUID', 'CAFE01', 'Main Counter');
