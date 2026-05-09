-- 0007_add_email_to_profiles.sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
