-- 1. Asignar rol de Web Master a El Piojo Karateka
UPDATE profiles
SET role = 'web_master'
WHERE username ILIKE '%El Piojo Karateka%';

-- 2. Actualizar Constraint de Roles (si existe, para permitir 'web_master')
-- Intentamos eliminar el constraint si existe para recrearlo con el nuevo valor
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check') THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
        ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('member', 'admin', 'candidate', 'web_master'));
    END IF;
END $$;

-- 3. Actualizar Políticas RLS (Row Level Security)

-- Permitir a Web Master actualizar CUALQUIER perfil
-- Primero borramos la política anterior de "Users can update own profile" para reemplazarla
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile OR Web Master" ON profiles;

CREATE POLICY "Users can update own profile OR Web Master"
ON profiles
FOR UPDATE
USING (
    auth.uid() = id  -- Es su propio perfil
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master') -- O el que edita es web_master
)
WITH CHECK (
    auth.uid() = id
    OR 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master')
);

-- Asegurar que Web Master pueda ver todos los datos (generalmente ya es público, pero por seguridad)
-- CREATE POLICY ... FOR SELECT ... (Generalmente ya existe "Public profiles are viewable by everyone")
