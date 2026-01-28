
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

## Paso 5: Sistema de Insignias (Badges)
Ejecuta este SQL para crear la tabla de insignias y configurar el almacenamiento de imágenes:

```sql
-- 1. Tabla de Insignias
create table badges (
  id uuid default gen_random_uuid() primary key,
  image_url text not null,
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Políticas de Seguridad (RLS) para Insignias
alter table badges enable row level security;

-- Todos pueden ver las insignias
create policy "Badges are viewable by everyone"
  on badges for select using ( true );

-- Solo admins pueden crear/borrar insignias
create policy "Admins can insert badges"
  on badges for insert
  with check ( auth.uid() in (select id from profiles where role = 'admin') );

create policy "Admins can delete badges"
  on badges for delete
  using ( auth.uid() in (select id from profiles where role = 'admin') );

-- 3. Storage para imágenes de insignias
-- Nota: Debes crear un bucket llamado 'badges' en el dashboard de Storage o usar este script si tienes permisos:
insert into storage.buckets (id, name, public) values ('badges', 'badges', true);

-- Políticas de Storage
create policy "Badge images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'badges' );

create policy "Admins can upload badge images"
  on storage.objects for insert
  with check ( bucket_id = 'badges' and auth.uid() in (select id from profiles where role = 'admin') );
  
create policy "Admins can delete badge images"
  on storage.objects for delete
  using ( bucket_id = 'badges' and auth.uid() in (select id from profiles where role = 'admin') );

## Paso 6: Roles Dinámicos (Opcional - Si quieres crear roles personalizados)
Si deseas que los administradores puedan crear y asignar roles personalizados, ejecuta este script:

```sql
-- 1. Tabla de Roles
create table clan_roles (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  color text default '#f59e0b', -- default color
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. RLS para Roles
alter table clan_roles enable row level security;

create policy "Roles are viewable by everyone"
  on clan_roles for select using ( true );

create policy "Admins can manage roles"
  on clan_roles for all
  using ( auth.uid() in (select id from profiles where role = 'admin') );

-- 3. Insertar roles básicos
insert into clan_roles (name, color) values 
('admin', '#9333ea'),   -- Purple
('member', '#10b981'),  -- Emerald
('candidate', '#f59e0b'); -- Amber

-- 4. Modificar constraint en tabla profiles
-- Eliminamos la restricción que solo permitía 'admin', 'member', 'candidate'
alter table profiles drop constraint profiles_role_check;
```

## Paso 7: Sistema de Torneos
Ejecuta este script para crear las tablas necesarias para el sistema de torneos:

```sql
-- 1. Tabla de Torneos
create table tournaments (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  start_date timestamp with time zone,
  is_public boolean default false,
  status text default 'draft' check (status in ('draft', 'open', 'ongoing', 'completed')),
  created_by uuid references profiles(id),
  rules text,
  max_participants int,
  bracket_type text default 'single_elimination',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabla de Participantes del Torneo
create table tournament_participants (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references tournaments(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(tournament_id, user_id)
);

-- 3. Tabla de Partidos (Matches)
create table matches (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references tournaments(id) on delete cascade,
  round int not null,
  match_number int, -- Para ordenar dentro de la ronda
  player1_id uuid references profiles(id),
  player2_id uuid references profiles(id),
  winner_id uuid references profiles(id),
  scheduled_time timestamp with time zone,
  draft_link text,
  result_score text, -- Ej: "2-1"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. RLS para Torneos
alter table tournaments enable row level security;

-- Ver torneos: Públicos los ve cualquiera, Internos solo miembros logueados
create policy "Tournaments visibility"
  on tournaments for select
  using ( is_public = true or auth.role() = 'authenticated' );

-- Solo admins crean/editan torneos
create policy "Admins manage tournaments"
  on tournaments for all
  using ( auth.uid() in (select id from profiles where role = 'admin') );

-- 5. RLS para Participantes
alter table tournament_participants enable row level security;

create policy "View participants"
  on tournament_participants for select
  using ( true );

create policy "Users can register themselves"
  on tournament_participants for insert
  with check ( auth.uid() = user_id );

create policy "Admins manage participants"
  on tournament_participants for update
  using ( auth.uid() in (select id from profiles where role = 'admin') );

create policy "Admins delete participants"
  on tournament_participants for delete
  using ( auth.uid() in (select id from profiles where role = 'admin') );

-- 6. RLS para Matches
alter table matches enable row level security;

create policy "View matches"
  on matches for select
  using ( true );

create policy "Admins manage matches"
  on matches for all
  using ( auth.uid() in (select id from profiles where role = 'admin') );
```

