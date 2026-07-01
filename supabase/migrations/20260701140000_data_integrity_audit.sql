-- Data integrity audit: fix is_latest, receipt numbers, and orphaned references.

-- 1. Normalize is_latest: exactly one live receipt per tag (prefer completed receipts).
update public.receipts
set is_latest = false
where is_latest = true;

with ranked as (
  select
    id,
    row_number() over (
      partition by tag_id
      order by
        case when awaiting_items then 1 else 0 end,
        created_at desc,
        id desc
    ) as rn
  from public.receipts
)
update public.receipts as receipts
set is_latest = true
from ranked
where receipts.id = ranked.id
  and ranked.rn = 1;

-- 2. Remove duplicate receipt numbers per merchant (keep earliest assignment).
with ranked as (
  select
    id,
    merchant_id,
    receipt_number,
    row_number() over (
      partition by merchant_id, receipt_number
      order by created_at asc, id asc
    ) as duplicate_rank
  from public.receipts
  where receipt_number is not null
)
update public.receipts as receipts
set receipt_number = null
from ranked
where receipts.id = ranked.id
  and ranked.duplicate_rank > 1;

-- 3. Re-assign gap-free sequential receipt numbers per merchant.
with numbered as (
  select
    id,
    merchant_id,
    row_number() over (
      partition by merchant_id
      order by created_at asc, id asc
    ) as rn
  from public.receipts
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

-- 4. Enforce receipt_number presence for new rows going forward.
alter table public.receipts
  alter column receipt_number set not null;

-- 5. Null orphaned staff references (deleted staff rows).
update public.receipts as receipts
set staff_id = null
where staff_id is not null
  and not exists (
    select 1
    from public.staff
    where staff.id = receipts.staff_id
      and staff.merchant_id = receipts.merchant_id
  );

update public.orders as orders
set staff_id = null
where staff_id is not null
  and not exists (
    select 1
    from public.staff
    where staff.id = orders.staff_id
      and staff.merchant_id = orders.merchant_id
  );

-- 6. Remove receipts pointing at deleted tags (should not happen with cascade, but guard anyway).
delete from public.receipts as receipts
where not exists (
  select 1
  from public.tags
  where tags.id = receipts.tag_id
    and tags.merchant_id = receipts.merchant_id
);

-- 7. Remove menu items with missing categories.
delete from public.menu_items as items
where not exists (
  select 1
  from public.categories
  where categories.id = items.category_id
    and categories.merchant_id = items.merchant_id
);

-- 8. Cancel open orders tied to deleted tables.
update public.orders
set status = 'cancelled'
where status = 'open'
  and table_id is not null
  and not exists (
    select 1
    from public.tables
    where tables.id = orders.table_id
      and tables.merchant_id = orders.merchant_id
  );
