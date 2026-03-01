-- migration to add channel metadata to showmatches
ALTER TABLE showmatches 
ADD COLUMN IF NOT EXISTS twitch_channel TEXT,
ADD COLUMN IF NOT EXISTS twitch_icon TEXT,
ADD COLUMN IF NOT EXISTS youtube_channel TEXT,
ADD COLUMN IF NOT EXISTS youtube_icon TEXT;
