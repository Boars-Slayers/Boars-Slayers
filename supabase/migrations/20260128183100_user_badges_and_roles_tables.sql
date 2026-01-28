-- Create user_badges join table
CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, badge_id)
);

-- Enable RLS for user_badges
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Policies for user_badges
DO $$ BEGIN
  CREATE POLICY "Public badges are viewable by everyone"
    ON user_badges FOR SELECT
    USING ( true );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can insert user_badges"
    ON user_badges FOR INSERT
    WITH CHECK ( 
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can delete user_badges"
    ON user_badges FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- Create user_roles join table (for multiple roles support)
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES clan_roles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, role_id)
);

-- Enable RLS for user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles
DO $$ BEGIN
  CREATE POLICY "Public roles are viewable by everyone"
    ON user_roles FOR SELECT
    USING ( true );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage user_roles"
    ON user_roles FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- DATA MIGRATION: Move existing roles to user_roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles) THEN
    INSERT INTO user_roles (user_id, role_id)
    SELECT p.id, r.id
    FROM profiles p
    JOIN clan_roles r ON LOWER(p.role) = LOWER(r.name);
  END IF;
END $$;
