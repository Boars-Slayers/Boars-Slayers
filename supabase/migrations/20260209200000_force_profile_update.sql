-- Add column to force profile update for existing members lacking AoE IDs
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS requires_profile_fix BOOLEAN DEFAULT false;

-- Mark all existing members as needing a fix if they don't have a numeric aoe_profile_id
-- or if their steam_id is obviously a discord ID (long 17-18 digit numbers are usually steam, 
-- but we'll flag everyone without a confirmed aoe_profile_id to be safe).
UPDATE profiles 
SET requires_profile_fix = true 
WHERE role != 'candidate' 
  AND (aoe_profile_id IS NULL OR aoe_insights_url IS NULL);
