-- Create user_nicknames table for multiple nicknames per user
CREATE TABLE IF NOT EXISTS user_nicknames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    nickname TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE user_nicknames ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public nicknames are viewable by everyone" ON user_nicknames
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert nicknames" ON user_nicknames
  FOR INSERT WITH CHECK (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete nicknames" ON user_nicknames
  FOR DELETE USING (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Migrate existing nicknames if any (optional, but good for consistency)
INSERT INTO user_nicknames (user_id, nickname)
SELECT id, nickname
FROM profiles
WHERE nickname IS NOT NULL AND nickname != '';
