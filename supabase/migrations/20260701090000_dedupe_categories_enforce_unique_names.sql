with ranked_categories as (
  select
    id,
    merchant_id,
    name,
    sort_order,
    created_at,
    lower(regexp_replace(trim(name), '\s+', ' ', 'g')) as normalized_name,
    first_value(id) over (
      partition by merchant_id, lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
      order by sort_order asc, created_at asc, id asc
    ) as keep_id,
    row_number() over (
      partition by merchant_id, lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
      order by sort_order asc, created_at asc, id asc
    ) as duplicate_rank
  from public.categories
),
duplicate_categories as (
  select id, keep_id
  from ranked_categories
  where duplicate_rank > 1
)
update public.menu_items
set category_id = duplicate_categories.keep_id
from duplicate_categories
where public.menu_items.category_id = duplicate_categories.id;

with ranked_categories as (
  select
    id,
    merchant_id,
    lower(regexp_replace(trim(name), '\s+', ' ', 'g')) as normalized_name,
    row_number() over (
      partition by merchant_id, lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
      order by sort_order asc, created_at asc, id asc
    ) as duplicate_rank
  from public.categories
)
delete from public.categories
using ranked_categories
where public.categories.id = ranked_categories.id
  and ranked_categories.duplicate_rank > 1;

update public.categories
set name = regexp_replace(trim(name), '\s+', ' ', 'g')
where name <> regexp_replace(trim(name), '\s+', ' ', 'g');

create unique index if not exists categories_merchant_normalized_name_unique_idx
  on public.categories (
    merchant_id,
    lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
  );
