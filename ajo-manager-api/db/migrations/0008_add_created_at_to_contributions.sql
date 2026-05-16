-- 0008_add_created_at_to_contributions.sql
ALTER TABLE public.contributions ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
