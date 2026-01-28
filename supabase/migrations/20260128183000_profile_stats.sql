-- Add statistics columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS elo_1v1 INT,
ADD COLUMN IF NOT EXISTS elo_tg INT,
ADD COLUMN IF NOT EXISTS win_rate_1v1 FLOAT,
ADD COLUMN IF NOT EXISTS games_played INT,
ADD COLUMN IF NOT EXISTS streak INT,
ADD COLUMN IF NOT EXISTS last_stats_update TIMESTAMP WITH TIME ZONE;

-- Create an index on elo_1v1 for the ranking page
CREATE INDEX IF NOT EXISTS idx_profiles_elo_1v1 ON profiles(elo_1v1 DESC NULLS LAST);

-- Update RLS to allow admins to update stats
DO $$ BEGIN
  CREATE POLICY "Admins can update stats"
    ON profiles FOR UPDATE
    USING ( auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') )
    WITH CHECK ( TRUE );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
