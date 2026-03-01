-- 1. Add replay_url to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS replay_url TEXT;

-- 2. Create Storage Bucket for Replays
INSERT INTO storage.buckets (id, name, public)
VALUES ('replays', 'replays', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage Policies
-- Allow public access to download replays
CREATE POLICY "Public replays are viewable by everyone"
ON storage.objects FOR SELECT
USING ( bucket_id = 'replays' );

-- Allow Admins to upload/update/delete replays
CREATE POLICY "Admins can manage replays"
ON storage.objects FOR ALL
USING ( 
  bucket_id = 'replays' AND 
  (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
)
WITH CHECK (
  bucket_id = 'replays' AND 
  (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
);
