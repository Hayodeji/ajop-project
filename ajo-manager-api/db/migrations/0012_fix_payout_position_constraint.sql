-- Drop the strict unique constraint so inactive members don't block new slots
ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_group_id_payout_position_key;

-- Add a partial unique index that only applies to active members
CREATE UNIQUE INDEX IF NOT EXISTS group_members_active_payout_position_idx 
ON group_members (group_id, payout_position) 
WHERE is_active = true;
