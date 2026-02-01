-- 1. Enable UUID extension because it is required for default values
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Modify Profiles to allow "External/Manual" users (No Link to Auth)
-- This allows UserCreator to work by inserting a profile with a generated UUID not present in auth.users
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_fkey') THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
    END IF;
END $$;

-- 3. Ensure Tournament Admins table exists
CREATE TABLE IF NOT EXISTS tournament_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tournament_id, user_id)
);

-- 4. Security Policies for Tournament Admins
ALTER TABLE tournament_admins ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Policy for managing admins (Creators and Super Admins)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins and Tournament Creator can manage co-admins' AND tablename = 'tournament_admins') THEN
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
    END IF;

    -- Policy for viewing admins (Public)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for tournament admins' AND tablename = 'tournament_admins') THEN
        CREATE POLICY "Public read access for tournament admins"
            ON tournament_admins FOR SELECT
            USING (true);
    END IF;
END $$;
