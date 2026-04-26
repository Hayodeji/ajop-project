-- 0003_make_phone_optional.sql
-- Switch auth from phone OTP to email + password.
-- Phone becomes optional (users may add it later for WhatsApp reminders).

ALTER TABLE profiles ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN phone SET DEFAULT NULL;

-- Drop the old unique constraint on phone and re-add as partial
-- so multiple NULL values are allowed
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique
  ON profiles (phone)
  WHERE phone IS NOT NULL;
