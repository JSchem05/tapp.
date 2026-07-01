-- Sequential per-merchant receipt numbers (gap-free, never reused).
alter table public.receipts
  add column if not exists receipt_number int;

create table if not exists public.merchant_receipt_counters (
  merchant_id uuid primary key references public.merchants(id) on delete cascade,
  next_receipt_number integer not null default 1
);

create or replace function public.allocate_receipt_number(p_merchant_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned integer;
begin
  insert into public.merchant_receipt_counters as counters (merchant_id, next_receipt_number)
  values (p_merchant_id, 2)
  on conflict (merchant_id) do update
    set next_receipt_number = counters.next_receipt_number + 1
  returning counters.next_receipt_number - 1 into assigned;

  return assigned;
end;
$$;

create or replace function public.set_receipt_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.receipt_number is null then
    new.receipt_number := public.allocate_receipt_number(new.merchant_id);
  end if;
  return new;
end;
$$;

drop trigger if exists receipts_set_receipt_number on public.receipts;
create trigger receipts_set_receipt_number
  before insert on public.receipts
  for each row
  execute function public.set_receipt_number();

-- Backfill existing receipts in chronological order per merchant.
with numbered as (
  select
    id,
    row_number() over (
      partition by merchant_id
      order by created_at asc, id asc
    ) as rn
  from public.receipts
  where receipt_number is null
)
update public.receipts as receipts
set receipt_number = numbered.rn
from numbered
where receipts.id = numbered.id;

insert into public.merchant_receipt_counters (merchant_id, next_receipt_number)
select merchant_id, coalesce(max(receipt_number), 0) + 1
from public.receipts
where receipt_number is not null
group by merchant_id
on conflict (merchant_id) do update
set next_receipt_number = excluded.next_receipt_number;

create unique index if not exists receipts_merchant_receipt_number_uidx
  on public.receipts (merchant_id, receipt_number)
  where receipt_number is not null;
