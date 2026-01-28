
-- 1. Crear el bucket 'avatars' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar RLS en storage.objects (por si no lo está)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Política: Permitir que CUALQUIERA vea las fotos (Lectura pública)
-- Nota: 'bucket_id' es una columna de storage.objects
CREATE POLICY "Avatar Public Read"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 4. Política: Permitir subida a usuarios autenticados
CREATE POLICY "Avatar Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- 5. Política: Permitir actualización a usuarios autenticados
CREATE POLICY "Avatar Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' );

-- 6. Política: Permitir borrado a usuarios autenticados
CREATE POLICY "Avatar Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' );
