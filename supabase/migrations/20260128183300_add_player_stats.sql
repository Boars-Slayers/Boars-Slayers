-- Add statistics columns to profiles table
alter table profiles 
add column if not exists elo_1v1 int,
add column if not exists elo_tg int,
add column if not exists win_rate_1v1 float,
add column if not exists games_played int,
add column if not exists streak int,
add column if not exists last_stats_update timestamp with time zone;

-- Create an index on elo_1v1 for the ranking page
create index if not exists idx_profiles_elo_1v1 on profiles(elo_1v1 desc nulls last);

-- Update RLS to allow public viewing (already should be covered by "Public profiles are viewable by everyone")
-- But ensure admins can update these fields specifically
drop policy if exists "Admins can update stats" on profiles;
create policy "Admins can update stats"
  on profiles for update
  using ( auth.uid() in (select id from profiles where role = 'admin') )
  with check ( true );
