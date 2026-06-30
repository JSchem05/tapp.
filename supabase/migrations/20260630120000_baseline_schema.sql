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
  add column if not exists logo_url text,
  add column if not exists tagline text,
  add column if not exists phone text,
  add column if not exists website text,
  add column if not exists instagram text,
  add column if not exists address text,
  add column if not exists wifi_name text,
  add column if not exists wifi_password text,
  add column if not exists google_review_url text,
  add column if not exists ad_headline text,
  add column if not exists ad_subtext text,
  add column if not exists ad_cta_label text,
  add column if not exists ad_cta_url text,
  add column if not exists ad_bg_color text default '#2563EB',
  add column if not exists loyalty_goal int default 6,
  add column if not exists loyalty_reward text,
  add column if not exists show_qr boolean default true,
  add column if not exists show_wifi boolean default false,
  add column if not exists show_ad boolean default false,
  add column if not exists show_review boolean default false,
  add column if not exists show_loyalty boolean default false,
  add column if not exists show_email_opt_in boolean default true,
  add column if not exists show_social boolean default true,
  add column if not exists show_info boolean default true;

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
  staff_id uuid,
  items jsonb not null,
  subtotal numeric(10, 2) not null,
  vat numeric(10, 2) not null,
  total numeric(10, 2) not null,
  payment_method text not null check (payment_method in ('Card', 'Cash', 'Other')),
  awaiting_items boolean not null default false,
  is_latest boolean not null default false,
  customer_email text,
  created_at timestamptz not null default now(),
  constraint receipts_items_array check (jsonb_typeof(items) = 'array')
);

alter table public.receipts
  add column if not exists customer_email text,
  add column if not exists awaiting_items boolean not null default false,
  add column if not exists staff_id uuid;

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
  staff_id uuid,
  items jsonb not null,
  subtotal numeric(10, 2) not null,
  vat numeric(10, 2) not null,
  total numeric(10, 2) not null,
  payment_method text not null check (payment_method in ('card', 'cash')),
  status text not null check (status in ('open', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint orders_items_array check (jsonb_typeof(items) = 'array')
);

alter table public.orders
  add column if not exists staff_id uuid;

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.pos_connections (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  provider text not null,
  access_token text not null,
  refresh_token text,
  external_merchant_id text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'receipts_staff_id_fkey'
  ) then
    alter table public.receipts
      add constraint receipts_staff_id_fkey
      foreign key (staff_id) references public.staff(id) on delete set null;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_staff_id_fkey'
  ) then
    alter table public.orders
      add constraint orders_staff_id_fkey
      foreign key (staff_id) references public.staff(id) on delete set null;
  end if;
end
$$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  email text not null,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  visit_count int not null default 1,
  constraint customers_email_valid check (position('@' in email) > 1)
);

create table if not exists public.loyalty_cards (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  stamps int not null default 0,
  redeemed_count int not null default 0
);

create unique index if not exists receipts_one_latest_per_tag
  on public.receipts(tag_id)
  where is_latest = true;

create index if not exists tags_merchant_id_idx on public.tags(merchant_id);
create index if not exists receipts_merchant_id_created_at_idx on public.receipts(merchant_id, created_at desc);
create index if not exists receipts_tag_latest_idx on public.receipts(tag_id, is_latest);
create index if not exists receipts_merchant_awaiting_idx on public.receipts(merchant_id, awaiting_items, created_at desc);
create index if not exists categories_merchant_sort_idx on public.categories(merchant_id, sort_order);
create index if not exists menu_items_merchant_category_sort_idx on public.menu_items(merchant_id, category_id, sort_order);
create index if not exists modifier_groups_merchant_idx on public.modifier_groups(merchant_id);
create index if not exists modifiers_group_idx on public.modifiers(group_id);
create index if not exists orders_merchant_created_at_idx on public.orders(merchant_id, created_at desc);
create index if not exists orders_staff_id_idx on public.orders(staff_id);
create index if not exists receipts_staff_id_idx on public.receipts(staff_id);
create unique index if not exists customers_merchant_email_key on public.customers(merchant_id, lower(email));
create unique index if not exists loyalty_cards_merchant_customer_key on public.loyalty_cards(merchant_id, customer_id);
create index if not exists staff_merchant_created_at_idx on public.staff(merchant_id, created_at desc);
create unique index if not exists staff_code_key on public.staff(code);
create unique index if not exists pos_connections_merchant_provider_key on public.pos_connections(merchant_id, provider);

alter table public.merchants enable row level security;
alter table public.tags enable row level security;
alter table public.receipts enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.modifier_groups enable row level security;
alter table public.modifiers enable row level security;
alter table public.item_modifier_groups enable row level security;
alter table public.orders enable row level security;
alter table public.customers enable row level security;
alter table public.loyalty_cards enable row level security;
alter table public.staff enable row level security;
alter table public.pos_connections enable row level security;

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
  using (is_latest = true and awaiting_items = false);

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

drop policy if exists "Merchant owns staff" on public.staff;
create policy "Merchant owns staff"
  on public.staff for all
  to authenticated
  using (merchant_id = auth.uid())
  with check (merchant_id = auth.uid());

drop policy if exists "Merchant owns pos connections" on public.pos_connections;
create policy "Merchant owns pos connections"
  on public.pos_connections for all
  to authenticated
  using (merchant_id = auth.uid())
  with check (merchant_id = auth.uid());

drop policy if exists "Merchants can read their customers" on public.customers;
create policy "Merchants can read their customers"
  on public.customers for select
  to authenticated
  using (merchant_id = auth.uid());

drop policy if exists "Merchants can manage their customers" on public.customers;
create policy "Merchants can manage their customers"
  on public.customers for all
  to authenticated
  using (merchant_id = auth.uid())
  with check (merchant_id = auth.uid());

drop policy if exists "Public can join merchant mailing list" on public.customers;
create policy "Public can join merchant mailing list"
  on public.customers for insert
  to anon
  with check (
    exists (
      select 1 from public.merchants
      where merchants.id = merchant_id
      and coalesce(merchants.show_email_opt_in, true) = true
    )
  );

drop policy if exists "Merchants can read loyalty cards" on public.loyalty_cards;
create policy "Merchants can read loyalty cards"
  on public.loyalty_cards for select
  to authenticated
  using (merchant_id = auth.uid());

drop policy if exists "Merchants can manage loyalty cards" on public.loyalty_cards;
create policy "Merchants can manage loyalty cards"
  on public.loyalty_cards for all
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

create or replace function public.generate_staff_code()
returns text
language plpgsql
as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  index int;
begin
  for index in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.set_staff_code()
returns trigger
language plpgsql
as $$
declare
  next_code text;
begin
  if new.code is not null and new.code <> '' then
    return new;
  end if;

  loop
    next_code := public.generate_staff_code();
    exit when not exists (select 1 from public.staff where code = next_code);
  end loop;

  new.code := next_code;
  return new;
end;
$$;

drop trigger if exists staff_set_code on public.staff;
create trigger staff_set_code
  before insert on public.staff
  for each row execute procedure public.set_staff_code();

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

-- Legacy cleanup for databases created before the staff-code model.
alter table public.merchants
  drop column if exists owner_code,
  drop column if exists staff_code;

alter table public.staff
  add column if not exists code text;

alter table public.staff
  drop column if exists pin_code;

drop index if exists staff_merchant_pin_code_key;
create unique index if not exists staff_code_key on public.staff(code);

do $$
declare
  staff_row record;
  next_code text;
begin
  for staff_row in
    select id from public.staff where code is null or code = ''
  loop
    loop
      next_code := public.generate_staff_code();
      exit when not exists (select 1 from public.staff where code = next_code);
    end loop;
    update public.staff set code = next_code where id = staff_row.id;
  end loop;
end
$$;

alter table public.staff
  alter column code set not null;

drop function if exists public.generate_device_code();
