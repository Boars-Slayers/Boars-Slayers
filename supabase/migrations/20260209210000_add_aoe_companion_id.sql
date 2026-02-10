-- Add aoe_companion_id field to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS aoe_companion_id TEXT;

-- Update the profile fix flag for members who don't have this ID yet
UPDATE profiles 
SET requires_profile_fix = true 
WHERE role != 'candidate' 
  AND (aoe_companion_id IS NULL OR aoe_companion_id = '');
