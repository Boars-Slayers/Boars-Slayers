-- Migration to enhance tournaments with more configuration fields
-- Created at: 2026-01-28

ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS sponsors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS prizes JSONB DEFAULT '[]'::jsonb;

-- Ensure storage bucket for tournament images exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tournaments', 'tournaments', true)
ON CONFLICT (id) DO NOTHING;

-- RLS for tournaments storage
CREATE POLICY "Public tournaments images are viewable by everyone"
ON storage.objects FOR SELECT
USING ( bucket_id = 'tournaments' );

CREATE POLICY "Admins can upload tournament images"
ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'tournaments' AND 
  (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
);

CREATE POLICY "Admins can delete tournament images"
ON storage.objects FOR DELETE
USING ( 
  bucket_id = 'tournaments' AND 
  (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
);
