# Database migrations

Schema changes are versioned in `supabase/migrations/`. Do not paste SQL into the Supabase dashboard or edit old migration files after they have been applied.

## One-time setup

1. Log in to the Supabase CLI (opens a browser):

```bash
pnpm exec supabase login
```

2. Link this repo to your remote project (project ref is in the dashboard URL: `https://supabase.com/dashboard/project/<project-ref>`):

```bash
pnpm exec supabase link --project-ref ciruniqznpokgkrkcqtm
```

3. Mark the baseline migration as already applied on production (only needed once, because the schema was applied manually before migrations existed):

```bash
pnpm exec supabase migration repair --status applied 20260630120000
```

Use the numeric prefix from `supabase/migrations/20260630120000_baseline_schema.sql` (not the full filename).

## Day-to-day workflow

When the database schema changes (new table, column, policy, etc.):

1. Create a new migration:

```bash
pnpm run db:new add_my_change
```

2. Edit the new file under `supabase/migrations/` and write **only** the incremental SQL for that change.

3. Apply pending migrations to production:

```bash
pnpm run db:migrate
```

`db push` runs only migrations that have not been recorded in the remote migration history, in order.

## Scripts

| Command | What it does |
|---------|----------------|
| `pnpm run db:new <name>` | Create `supabase/migrations/<timestamp>_<name>.sql` |
| `pnpm run db:migrate` | `supabase db push` — apply pending migrations to the linked project |

## Rules

- Never manually paste SQL into the Supabase SQL editor for schema changes.
- Never edit a migration file after it has been applied to production.
- Never assume production has a column/table just because the app code references it — run `pnpm run db:migrate` after adding a migration.

If you see `null value in column "pin_code"` when adding staff, production still has the legacy column — run `pnpm run db:migrate` to apply `20260630140000_drop_staff_pin_code.sql`.

## Reset (development only)

`reset.sql` truncates operational data for local testing. It is not a migration and should not be run against production.
