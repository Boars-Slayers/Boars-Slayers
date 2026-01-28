-- 1. Create Moments Table
CREATE TABLE IF NOT EXISTS moments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Moment Tags Table
CREATE TABLE IF NOT EXISTS moment_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  moment_id uuid REFERENCES moments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- The user being tagged
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(moment_id, user_id)
);

-- 3. RLS for Moments
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Moments are viewable by everyone" ON moments FOR SELECT USING ( true );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert their own moments" ON moments FOR INSERT WITH CHECK ( auth.uid() = user_id );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own moments" ON moments FOR DELETE USING ( auth.uid() = user_id );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. RLS for Moment Tags
ALTER TABLE moment_tags ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Moment tags are viewable by everyone" ON moment_tags FOR SELECT USING ( true );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can tag others in their moments" ON moment_tags FOR INSERT WITH CHECK ( 
    auth.uid() IN (SELECT user_id FROM moments WHERE id = moment_id)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can remove tags from their moments" ON moment_tags FOR DELETE USING ( 
    auth.uid() IN (SELECT user_id FROM moments WHERE id = moment_id)
    OR auth.uid() = user_id
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Storage for Moments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('moments', 'moments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DO $$ BEGIN
  CREATE POLICY "Moments are publicly accessible" ON storage.objects FOR SELECT USING ( bucket_id = 'moments' );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload moments" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'moments' AND auth.role() = 'authenticated' );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own moments" ON storage.objects FOR DELETE USING ( bucket_id = 'moments' AND auth.uid() = owner );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
