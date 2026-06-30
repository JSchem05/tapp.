-- Production was marked as baseline-applied before pin_code was dropped.
-- Finish migrating staff from pin_code to code.

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

alter table public.staff
  add column if not exists code text;

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

alter table public.staff
  drop column if exists pin_code;

drop index if exists staff_merchant_pin_code_key;
create unique index if not exists staff_code_key on public.staff(code);

alter table public.merchants
  drop column if exists owner_code,
  drop column if exists staff_code;
