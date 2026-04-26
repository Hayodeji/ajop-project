-- 0002_profiles_subscriptions.sql

-- Plan enum
CREATE TYPE subscription_plan AS ENUM ('basic', 'smart', 'pro');
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'cancelled', 'expired');

-- Profiles: one per auth user, created after OTP signup
CREATE TABLE profiles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  phone       text NOT NULL,
  plan        subscription_plan NOT NULL DEFAULT 'basic',
  is_pro      boolean NOT NULL DEFAULT false,
  referral_code text UNIQUE,
  referred_by text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(phone)
);

-- Subscriptions: one active record per user
CREATE TABLE subscriptions (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                 subscription_plan NOT NULL,
  status               subscription_status NOT NULL DEFAULT 'trial',
  trial_ends_at        timestamptz,
  current_period_start timestamptz,
  current_period_end   timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
-- Service role bypasses RLS for writes (NestJS uses service role key)

-- Index
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
