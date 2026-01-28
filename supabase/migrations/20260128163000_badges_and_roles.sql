-- Migration for Badges and Clan Roles System
-- Created at: 2026-01-28

-- ==========================================
-- 1. BADGES SYSTEM
-- ==========================================

-- Table: badges
create table if not exists badges (
  id uuid default gen_random_uuid() primary key,
  image_url text not null,
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: badges
alter table badges enable row level security;

create policy "Badges are viewable by everyone"
  on badges for select using ( true );

create policy "Admins can insert badges"
  on badges for insert
  with check ( auth.uid() in (select id from profiles where role = 'admin') );

create policy "Admins can delete badges"
  on badges for delete
  using ( auth.uid() in (select id from profiles where role = 'admin') );

-- Storage: badges bucket
-- Attempt to create bucket if not exists (idempotent-ish via insert on conflict if supported, or manual check)
insert into storage.buckets (id, name, public) 
values ('badges', 'badges', true)
on conflict (id) do nothing;

-- Storage Policies
-- Note: We drop existing policies to avoid conflicts if re-running, then recreate.
drop policy if exists "Badge images are publicly accessible" on storage.objects;
drop policy if exists "Admins can upload badge images" on storage.objects;
drop policy if exists "Admins can delete badge images" on storage.objects;

create policy "Badge images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'badges' );

create policy "Admins can upload badge images"
  on storage.objects for insert
  with check ( bucket_id = 'badges' and auth.uid() in (select id from profiles where role = 'admin') );
  
create policy "Admins can delete badge images"
  on storage.objects for delete
  using ( bucket_id = 'badges' and auth.uid() in (select id from profiles where role = 'admin') );


-- ==========================================
-- 2. CLAN ROLES SYSTEM
-- ==========================================

-- Table: clan_roles
create table if not exists clan_roles (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  color text not null default '#f59e0b',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: clan_roles
alter table clan_roles enable row level security;

create policy "Roles are viewable by everyone"
  on clan_roles for select using ( true );

create policy "Admins can manage roles"
  on clan_roles for all
  using ( auth.uid() in (select id from profiles where role = 'admin') );

-- Seed Data: Default System Roles
-- We use ON CONFLICT to ensure we don't duplicate if they exist
insert into clan_roles (name, color) values
  ('admin', '#a855f7'),      -- Purple
  ('member', '#10b981'),     -- Emerald
  ('candidate', '#f59e0b')   -- Amber
on conflict (name) do update set color = excluded.color;

-- 3. Update Profiles Constraint
-- We need to drop the check constraint that limits roles to just admin/member/candidate
-- so that new dynamic roles can be assigned to users.
alter table profiles drop constraint if exists profiles_role_check;
