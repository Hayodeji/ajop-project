-- Migration 0009: Custom per-user group and member limits
-- Allows super-admins to override plan defaults for specific users

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS custom_group_limit  int DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS custom_member_limit int DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS limits_note         text DEFAULT NULL;

COMMENT ON COLUMN subscriptions.custom_group_limit  IS 'Super-admin override for max groups. NULL = use plan default.';
COMMENT ON COLUMN subscriptions.custom_member_limit IS 'Super-admin override for max members per group. NULL = use plan default.';
COMMENT ON COLUMN subscriptions.limits_note          IS 'Optional reason for the custom limit (audit trail).';
