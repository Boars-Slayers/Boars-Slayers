-- 1. Tabla de Mensajes del Clan
CREATE TABLE IF NOT EXISTS clan_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text', -- 'text', 'system', 'media'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RLS para Mensajes
ALTER TABLE clan_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Clan messages are viewable by clan members"
    ON clan_messages FOR SELECT
    USING ( 
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role != 'candidate'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Clan members can insert messages"
    ON clan_messages FOR INSERT
    WITH CHECK ( 
      auth.uid() = user_id AND
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role != 'candidate'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own messages"
    ON clan_messages FOR DELETE
    USING ( auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Habilitar Realtime para esta tabla (puedes fallar si la publicación no existe en este entorno)
-- DO $$ BEGIN
--   ALTER PUBLICATION supabase_realtime ADD TABLE clan_messages;
-- EXCEPTION WHEN others THEN 
--   RAISE NOTICE 'No se pudo habilitar realtime automáticamente. Asegúrate de activarlo en el Dashboard de Supabase.';
-- END $$;
