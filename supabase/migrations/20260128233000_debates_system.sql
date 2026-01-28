-- Create debates table
CREATE TABLE IF NOT EXISTS debates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create debate_comments table
CREATE TABLE IF NOT EXISTS debate_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debate_id UUID REFERENCES debates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for debates
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Debates area viewable by everyone"
  ON debates FOR SELECT
  USING (true);

CREATE POLICY "Members can create debates"
  ON debates FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role != 'candidate')
  );

CREATE POLICY "Users can update their own debates"
  ON debates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete debates"
  ON debates FOR DELETE
  USING (
    auth.uid() = user_id OR 
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- RLS for debate_comments
ALTER TABLE debate_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON debate_comments FOR SELECT
  USING (true);

CREATE POLICY "Members can create comments"
  ON debate_comments FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE role != 'candidate')
  );

CREATE POLICY "Users can delete their own comments"
  ON debate_comments FOR DELETE
  USING (auth.uid() = user_id);
