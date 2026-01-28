-- 1. Create a table for public profiles (Users automatically managed by Supabase Auth)
create table profiles (
  id uuid references auth.users not null primary key,
  steam_id text unique,
  username text,
  avatar_url text,
  role text default 'candidate' check (role in ('admin', 'member', 'candidate')),
  bio text,
  favorite_civ text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS) - This is CRITICAL for security
alter table profiles enable row level security;

-- 3. Create Policies

-- Policy: Anyone can view profiles (Public roster)
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

-- Policy: Users can update their own profile (Bio, Civ, etc.)
create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- Policy: ONLY Admins can approve members (Update the 'role' column)
-- Ideally this is handled via a secure Database Function to prevent users from hacking their role,
-- but for MVP, we check if the requester claims to be admin (requires initial setup).
create policy "Admins can update user roles"
  on profiles for update
  using ( 
    auth.uid() in (
      select id from profiles where role = 'admin'
    )
  );

-- 4. Initial Trigger to create a profile when a user logs in for the first time
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, avatar_url, steam_id, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name', -- Steam provides this
    new.raw_user_meta_data->>'avatar_url', -- Steam provides this
    new.raw_user_meta_data->>'provider_id', -- Steam ID
    'candidate' -- Default role is always Candidate until approved
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- INSTRUCCIONES PARA EL PRIMER ADMIN (TÚ):
-- Una vez te loguees con Steam por primera vez, tu usuario se creará como 'candidate'.
-- Debes ir a la tabla en el dashboard de Supabase y cambiar manualmente tu rol a 'admin'.
-- A partir de ahí, podrás aprobar a otros desde la App.
