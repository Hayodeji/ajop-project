-- Add payment tracking columns to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS paystack_reference TEXT,
  ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
