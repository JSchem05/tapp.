insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

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

with ranked_categories as (
  select
    id,
    first_value(id) over (
      partition by
        merchant_id,
        lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
      order by created_at asc, sort_order asc, id asc
    ) as keep_id,
    row_number() over (
      partition by
        merchant_id,
        lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
      order by created_at asc, sort_order asc, id asc
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
    row_number() over (
      partition by
        merchant_id,
        lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
      order by created_at asc, sort_order asc, id asc
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

with ranked_items as (
  select
    id,
    row_number() over (
      partition by
        merchant_id,
        category_id,
        lower(regexp_replace(trim(name), '\s+', ' ', 'g')),
        price
      order by created_at asc, sort_order asc, id asc
    ) as duplicate_rank
  from public.menu_items
)
delete from public.menu_items
using ranked_items
where public.menu_items.id = ranked_items.id
  and ranked_items.duplicate_rank > 1;

update public.menu_items
set name = regexp_replace(trim(name), '\s+', ' ', 'g')
where name <> regexp_replace(trim(name), '\s+', ' ', 'g');

create unique index if not exists categories_merchant_name_unique_idx
  on public.categories (merchant_id, name);

create unique index if not exists categories_merchant_normalized_name_unique_idx
  on public.categories (
    merchant_id,
    lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
  );

create unique index if not exists menu_items_merchant_category_normalized_name_price_unique_idx
  on public.menu_items (
    merchant_id,
    category_id,
    lower(regexp_replace(trim(name), '\s+', ' ', 'g')),
    price
  );
