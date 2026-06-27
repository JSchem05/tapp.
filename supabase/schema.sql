create extension if not exists "pgcrypto";

create table if not exists public.merchants (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  slug text not null unique,
  logo_url text,
  created_at timestamptz not null default now()
);

alter table public.merchants
  add column if not exists logo_url text;

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

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  price numeric(10, 2) not null,
  description text,
  image_url text,
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.modifier_groups (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,
  required boolean not null default false,
  multi_select boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.modifiers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.modifier_groups(id) on delete cascade,
  name text not null,
  price_delta numeric(10, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.item_modifier_groups (
  item_id uuid not null references public.menu_items(id) on delete cascade,
  group_id uuid not null references public.modifier_groups(id) on delete cascade,
  primary key (item_id, group_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete restrict,
  items jsonb not null,
  subtotal numeric(10, 2) not null,
  vat numeric(10, 2) not null,
  total numeric(10, 2) not null,
  payment_method text not null check (payment_method in ('card', 'cash')),
  status text not null check (status in ('open', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint orders_items_array check (jsonb_typeof(items) = 'array')
);

create unique index if not exists receipts_one_latest_per_tag
  on public.receipts(tag_id)
  where is_latest = true;

create index if not exists tags_merchant_id_idx on public.tags(merchant_id);
create index if not exists receipts_merchant_id_created_at_idx on public.receipts(merchant_id, created_at desc);
create index if not exists receipts_tag_latest_idx on public.receipts(tag_id, is_latest);
create index if not exists categories_merchant_sort_idx on public.categories(merchant_id, sort_order);
create index if not exists menu_items_merchant_category_sort_idx on public.menu_items(merchant_id, category_id, sort_order);
create index if not exists modifier_groups_merchant_idx on public.modifier_groups(merchant_id);
create index if not exists modifiers_group_idx on public.modifiers(group_id);
create index if not exists orders_merchant_created_at_idx on public.orders(merchant_id, created_at desc);

alter table public.merchants enable row level security;
alter table public.tags enable row level security;
alter table public.receipts enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.modifier_groups enable row level security;
alter table public.modifiers enable row level security;
alter table public.item_modifier_groups enable row level security;
alter table public.orders enable row level security;

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Merchants can read their own profile" on public.merchants;
create policy "Merchants can read their own profile"
  on public.merchants for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "Public can read merchant display names" on public.merchants;
drop policy if exists "Public can read merchants" on public.merchants;
create policy "Public can read merchants"
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
drop policy if exists "Public can read tags" on public.tags;
create policy "Public can read tags"
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
drop policy if exists "Public can read receipts" on public.receipts;
create policy "Public can read receipts"
  on public.receipts for select
  to anon
  using (true);

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

drop policy if exists "Merchant owns categories" on public.categories;
create policy "Merchant owns categories"
  on public.categories for all
  to authenticated
  using (merchant_id = auth.uid())
  with check (merchant_id = auth.uid());

drop policy if exists "Merchant owns menu_items" on public.menu_items;
create policy "Merchant owns menu_items"
  on public.menu_items for all
  to authenticated
  using (merchant_id = auth.uid())
  with check (merchant_id = auth.uid());

drop policy if exists "Merchant owns modifier_groups" on public.modifier_groups;
create policy "Merchant owns modifier_groups"
  on public.modifier_groups for all
  to authenticated
  using (merchant_id = auth.uid())
  with check (merchant_id = auth.uid());

drop policy if exists "Merchant owns modifiers" on public.modifiers;
create policy "Merchant owns modifiers"
  on public.modifiers for all
  to authenticated
  using (
    exists (
      select 1 from public.modifier_groups
      where modifier_groups.id = modifiers.group_id
      and modifier_groups.merchant_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.modifier_groups
      where modifier_groups.id = modifiers.group_id
      and modifier_groups.merchant_id = auth.uid()
    )
  );

drop policy if exists "Merchant owns item_modifier_groups" on public.item_modifier_groups;
create policy "Merchant owns item_modifier_groups"
  on public.item_modifier_groups for all
  to authenticated
  using (
    exists (
      select 1 from public.menu_items
      where menu_items.id = item_modifier_groups.item_id
      and menu_items.merchant_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.menu_items
      where menu_items.id = item_modifier_groups.item_id
      and menu_items.merchant_id = auth.uid()
    )
  );

drop policy if exists "Merchant owns orders" on public.orders;
create policy "Merchant owns orders"
  on public.orders for all
  to authenticated
  using (merchant_id = auth.uid())
  with check (merchant_id = auth.uid());

drop policy if exists "Public can read logos" on storage.objects;
create policy "Public can read logos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'logos');

drop policy if exists "Merchants can upload their logos" on storage.objects;
create policy "Merchants can upload their logos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Merchants can update their logos" on storage.objects;
create policy "Merchants can update their logos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Merchants can delete their logos" on storage.objects;
create policy "Merchants can delete their logos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Public can read menu images" on storage.objects;
create policy "Public can read menu images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'menu-images');

drop policy if exists "Merchants can upload menu images" on storage.objects;
create policy "Merchants can upload menu images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'menu-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Merchants can update menu images" on storage.objects;
create policy "Merchants can update menu images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'menu-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'menu-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Merchants can delete menu images" on storage.objects;
create policy "Merchants can delete menu images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'menu-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

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
