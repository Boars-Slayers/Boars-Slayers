-- 1. Tabla de Showmatches
CREATE TABLE IF NOT EXISTS showmatches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  player1_id UUID REFERENCES profiles(id),
  player2_id UUID REFERENCES profiles(id),
  p1_name TEXT, -- Para jugadores externos
  p2_name TEXT, -- Para jugadores externos
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  stream_url TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  winner_id UUID REFERENCES profiles(id),
  result_score TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RLS para Showmatches
ALTER TABLE showmatches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Showmatches are viewable by everyone"
    ON showmatches FOR SELECT
    USING ( true );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins manage showmatches"
    ON showmatches FOR ALL
    USING ( auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
