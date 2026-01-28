-- Add aoe_profile_id column to profiles table
-- This stores the internal ID used by AoE Insights and AoE Companion for faster lookups
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS aoe_profile_id TEXT;

-- Create an index for faster searching if needed
CREATE INDEX IF NOT EXISTS idx_profiles_aoe_profile_id ON profiles(aoe_profile_id);
