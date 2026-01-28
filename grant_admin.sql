-- Opción 1: Actualizar por correo electrónico (Recomendado)
-- Esto busca el UUID del usuario en la tabla de autenticación usando el email
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'simonsandrea1994@gmail.com'
);

-- Opción 2: Actualizar por nombre de usuario
-- Úsalo si la opción 1 no funciona o si prefieres buscar por nombre
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE username = 'El Piojo Karateka';

-- Verificación opcional:
-- Asegúrate de que el rol 'admin' exista en tu tabla de roles si usas una tabla separada para definición de roles
-- INSERT INTO public.clan_roles (name, color)
-- VALUES ('admin', '#FFD700')
-- ON CONFLICT (name) DO NOTHING;
