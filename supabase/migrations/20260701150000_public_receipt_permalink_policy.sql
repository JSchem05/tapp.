-- Permalink /r/[receipt_id] must work for emailed receipts even after a newer
-- receipt goes live on the same counter (is_latest = false).
-- NFC /t/[tag_code] still filters is_latest in application code.

drop policy if exists "Public can read receipts" on public.receipts;
drop policy if exists "Public can read live receipts" on public.receipts;
drop policy if exists "Public can read saved receipt permalinks" on public.receipts;

create policy "Public can read saved receipt permalinks"
  on public.receipts for select
  to anon
  using (awaiting_items = false);
