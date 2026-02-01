-- 1. Tournament Admins (Co-Admins)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS tournament_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

-- RLS for tournament_admins
ALTER TABLE tournament_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and Tournament Creator can manage co-admins"
    ON tournament_admins
    USING (
        auth.uid() IN (
            SELECT created_by FROM tournaments WHERE id = tournament_admins.tournament_id
        ) OR 
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Public read access for tournament admins"
    ON tournament_admins FOR SELECT
    USING (true);

-- 2. Link Moments to Tournaments
ALTER TABLE moments 
ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL;

-- 3. Additional status for matches functionality if needed
-- (Matches table is generic enough, but we might want to ensure round/match_number are set)
