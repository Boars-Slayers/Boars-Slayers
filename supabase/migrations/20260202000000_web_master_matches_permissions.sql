-- Otorga permisos completos a 'web_master' sobre las tablas de torneos y partidos
-- Esto soluciona el problema de no poder guardar resultados o editar partidos

-- 1. MATCHES
DROP POLICY IF EXISTS "Web Masters can all matches" ON matches;
CREATE POLICY "Web Masters can all matches"
ON matches
FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master')
);

-- 2. TOURNAMENTS
DROP POLICY IF EXISTS "Web Masters can all tournaments" ON tournaments;
CREATE POLICY "Web Masters can all tournaments"
ON tournaments
FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master')
);

-- 3. TOURNAMENT PARTICIPANTS
DROP POLICY IF EXISTS "Web Masters can all participants" ON tournament_participants;
CREATE POLICY "Web Masters can all participants"
ON tournament_participants
FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master')
);

-- 4. SHOWMATCHES
DROP POLICY IF EXISTS "Web Masters can all showmatches" ON showmatches;
CREATE POLICY "Web Masters can all showmatches"
ON showmatches
FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master')
);

-- 5. REPLAYS (Storage)
-- Asumiendo que usamos bucket 'replays'
DO $$
BEGIN
  -- Política de inserción para Storage
  BEGIN
      DROP POLICY IF EXISTS "Web Master Upload Replays" ON storage.objects;
      CREATE POLICY "Web Master Upload Replays"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'replays' AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master')
      );
  EXCEPTION WHEN OTHERS THEN NULL; END;

  -- Política de update/delete para Storage
  BEGIN
      DROP POLICY IF EXISTS "Web Master Manage Replays" ON storage.objects;
      CREATE POLICY "Web Master Manage Replays"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'replays' AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master')
      );
  EXCEPTION WHEN OTHERS THEN NULL; END;
  
  BEGIN
      DROP POLICY IF EXISTS "Web Master Delete Replays" ON storage.objects;
      CREATE POLICY "Web Master Delete Replays"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'replays' AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master')
      );
  EXCEPTION WHEN OTHERS THEN NULL; END;

EXCEPTION WHEN OTHERS THEN
  -- Ignorar error si la política ya existe o si storage no está activo igual
  NULL;
END $$;
