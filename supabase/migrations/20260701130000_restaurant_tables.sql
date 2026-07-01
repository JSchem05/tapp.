create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,
  status text not null default 'free' check (status in ('free', 'occupied')),
  created_at timestamptz not null default now()
);

create index if not exists tables_merchant_id_idx on public.tables(merchant_id);

alter table public.orders
  add column if not exists table_id uuid references public.tables(id) on delete set null;

create index if not exists orders_table_id_idx on public.orders(table_id);

alter table public.tables enable row level security;

drop policy if exists "Merchant owns tables" on public.tables;
create policy "Merchant owns tables"
  on public.tables for all
  to authenticated
  using (merchant_id = auth.uid())
  with check (merchant_id = auth.uid());
