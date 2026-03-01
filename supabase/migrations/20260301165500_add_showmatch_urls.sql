-- migration to add twitch and youtube urls to showmatches
ALTER TABLE showmatches 
ADD COLUMN IF NOT EXISTS twitch_url TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- update RLS if necessary (usually they allow update if the user has permission on the row)
-- but ensuring they are included in policies if needed. 
-- Assuming standard policies are already in place for showmatches.
