# tapp.

Full-stack NFC digital receipt SaaS built with Next.js 14 App Router, Supabase, and Tailwind CSS.

## Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Add Vercel/local environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

4. Create a merchant user in Supabase Auth. The database trigger creates the matching `merchants` row.
5. Add at least one tag for that merchant:

```sql
insert into public.tags (merchant_id, tag_code, label)
values ('AUTH_USER_UUID', 'CAFE01', 'Main Counter');
```

6. Run locally:

```bash
pnpm install
pnpm dev
```

## Routes

- `/t/[tag_code]` public mobile receipt viewer
- `/login` merchant login
- `/dashboard` merchant home with NFC pucks and last 10 receipts
- `/dashboard/receipt/new` receipt creation flow
- `/dashboard/settings` business name and NFC URL settings

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm build
```
# tapp.
