
# Guía de Implementación: Autenticación con Discord y Base de Datos

Dado que Supabase no soporta Steam nativamente, usaremos **Discord**, que es el estándar para clanes.

## Paso 1: Configurar Discord Developer
1. Ve a [Discord Developer Portal](https://discord.com/developers/applications).
2. Crea una "New Application" llamada **Boars Slayers**.
3. Ve a la pestaña **OAuth2**.
4. Copia el `CLIENT ID`.
5. Resetea y copia el `CLIENT SECRET`.
6. En "Redirects", añade la URL de callback de Supabase:
   - Ve a Supabase -> Authentication -> Providers -> Discord.
   - Copia la "Redirect URL" que te da Supabase (ej: `https://tu-proyecto.supabase.co/auth/v1/callback`).
   - Pégala en Discord Developer Portal y guarda.

## Paso 2: Configurar Supabase
1. Ve a **Supabase Dashboard** -> **Authentication** -> **Providers**.
2. Habilita **Discord**.
3. Pega el `Client ID` y `Client Secret` que copiaste de Discord.
4. Guarda.

## Paso 3: Base de Datos (SQL)
Si ya ejecutaste el script anterior, no pasa nada. Si no, ejecuta este código en el **SQL Editor** de Supabase para tener la tabla de perfiles lista.

```sql
-- Tabla de Perfiles
create table profiles (
  id uuid references auth.users not null primary key,
  username text,
  avatar_url text,
  discord_id text,
  steam_id text, -- Se rellenará manualmente después
  role text default 'candidate' check (role in ('admin', 'member', 'candidate')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seguridad (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using ( true );

create policy "Users can update own profile"
  on profiles for update using ( auth.uid() = id );

create policy "Admins can update user roles"
  on profiles for update
  using ( auth.uid() in (select id from profiles where role = 'admin') );

-- Trigger para crear perfil automático al entrar con Discord
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url, discord_id, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'provider_id',
    'candidate'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

## Paso 4: Variables
Asegúrate de tener `.env.local` en la carpeta `home`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
