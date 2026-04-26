# Database migrations

Run SQL files in order against your Supabase project.

**Option A — Supabase SQL Editor (fastest for one-off):**
1. Open Supabase Dashboard → SQL Editor → New query.
2. Paste the contents of the migration file and run.

**Option B — Supabase CLI (recommended for tracked migrations):**
```bash
supabase db push
```
(Assumes you have initialized Supabase CLI in this folder and linked a project.)

## Order

1. `0001_initial_schema.sql` — enums, four core tables, indexes, RLS policies.
