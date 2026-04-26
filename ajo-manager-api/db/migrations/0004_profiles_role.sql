-- 0004_profiles_role.sql
-- Add role column to profiles for super-admin access control

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
CHECK (role IN ('user', 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
