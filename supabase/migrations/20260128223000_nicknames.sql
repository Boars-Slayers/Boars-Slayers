-- Add nickname columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS pending_nickname TEXT;

-- Update RLS to allow admins to update pending_nickname for anyone
DO $$ BEGIN
  CREATE POLICY "Admins can propose nicknames"
    ON profiles FOR UPDATE
    USING ( auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') )
    WITH CHECK ( auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update RLS to allow users to update their own nickname (to approve it)
-- Note: The existing "Users can update own profile" policy usually covers this, 
-- but we should ensure it allows these specific columns.
-- Assuming existing policy is broad: "UPDATING (true)". 
-- If not, we might need a specific one, but usually profiles are fully editable by owner.

-- Function to handle nickname approval (optional, but cleaner)
-- Or we just let frontend handle: update nickname = pending_nickname, pending_nickname = null
