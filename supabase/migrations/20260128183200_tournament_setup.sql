-- 1. Tabla de Torneos
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  is_public BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'ongoing', 'completed')),
  created_by UUID REFERENCES profiles(id),
  rules TEXT,
  max_participants INT,
  bracket_type TEXT DEFAULT 'single_elimination',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Participantes del Torneo
CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(tournament_id, user_id)
);

-- 3. Tabla de Partidos (Matches)
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  round INT NOT NULL,
  match_number INT, -- Para ordenar dentro de la ronda
  player1_id UUID REFERENCES profiles(id),
  player2_id UUID REFERENCES profiles(id),
  winner_id UUID REFERENCES profiles(id),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  draft_link TEXT,
  result_score TEXT, -- Ej: "2-1"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. RLS para Torneos
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Tournaments visibility"
    ON tournaments FOR SELECT
    USING ( is_public = true OR auth.role() = 'authenticated' );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage tournaments"
    ON tournaments FOR ALL
    USING ( auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. RLS para Participantes
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "View participants"
    ON tournament_participants FOR SELECT
    USING ( true );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can register themselves"
    ON tournament_participants FOR INSERT
    WITH CHECK ( auth.uid() = user_id );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage participants"
    ON tournament_participants FOR UPDATE
    USING ( auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins delete participants"
    ON tournament_participants FOR DELETE
    USING ( auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. RLS para Matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "View matches"
    ON matches FOR SELECT
    USING ( true );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage matches"
    ON matches FOR ALL
    USING ( auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
