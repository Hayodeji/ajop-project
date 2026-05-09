ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text 
  DEFAULT 'admin' 
  CHECK (role IN ('admin','support_agent','super_admin'));

ALTER TABLE groups ADD COLUMN IF NOT EXISTS late_fee_amount bigint DEFAULT 0;

ALTER TABLE group_members 
  ADD COLUMN IF NOT EXISTS outstanding_fines bigint DEFAULT 0;

ALTER TABLE contributions 
  ADD COLUMN IF NOT EXISTS member_replied_paid boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS due_date timestamptz;

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles NOT NULL UNIQUE,
  plan text CHECK (plan IN ('basic','smart','pro')) NOT NULL,
  status text CHECK (status IN (
    'trialing','active','payment_failed',
    'cancelled','expired')) NOT NULL DEFAULT 'trialing',
  trial_ends_at timestamptz NOT NULL,
  current_period_end timestamptz,
  paystack_customer_code text,
  paystack_subscription_code text,
  retry_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  paystack_reference text,
  user_id uuid REFERENCES profiles,
  payload jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reminder_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contribution_id uuid REFERENCES contributions,
  member_id uuid REFERENCES group_members,
  sent_at timestamptz DEFAULT now(),
  channel text DEFAULT 'whatsapp'
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES profiles,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  target_plan text,
  channel text DEFAULT 'in_app',
  sent_at timestamptz,
  created_by uuid REFERENCES profiles
);

CREATE TABLE IF NOT EXISTS user_announcement_reads (
  user_id uuid REFERENCES profiles,
  announcement_id uuid REFERENCES announcements,
  read_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, announcement_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
