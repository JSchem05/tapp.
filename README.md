# tapp.

Full-stack NFC digital receipt SaaS built with Next.js 14 App Router, Supabase, and Tailwind CSS.

## Setup

1. Create a Supabase project.
2. Link the project and apply migrations (see [supabase/README.md](supabase/README.md)).
3. Add Vercel/local environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUMUP_CLIENT_ID=your-sumup-client-id
SUMUP_CLIENT_SECRET=your-sumup-client-secret
SUMUP_WEBHOOK_SECRET=your-sumup-webhook-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
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

## Database schema

Schema is managed with Supabase CLI migrations in `supabase/migrations/`.

Whenever the database schema changes (new table, new column, new policy):

1. Create a migration: `pnpm run db:new <description>`
2. Write only the new SQL in that file
3. Apply to production: `pnpm run db:migrate`

Never manually paste SQL into the Supabase dashboard for schema changes, and never edit old migration files after they have been applied.

See [supabase/README.md](supabase/README.md) for one-time CLI setup (`supabase login`, `supabase link`, baseline repair).

## Routes

- `/t/[tag_code]` public mobile receipt viewer
- `/login` merchant login
- `/device` staff code login
- `/dashboard` merchant home with NFC pucks and last 10 receipts
- `/dashboard/receipt/new` receipt creation flow
- `/dashboard/settings` business name and NFC URL settings
- `/staff` staff POS (code login)

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm build
```
