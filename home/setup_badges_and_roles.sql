-- Create user_badges join table
create table if not exists user_badges (
  user_id uuid references profiles(id) on delete cascade not null,
  badge_id uuid references badges(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, badge_id)
);

-- Enable RLS for user_badges
alter table user_badges enable row level security;

-- Policies for user_badges
create policy "Public badges are viewable by everyone"
  on user_badges for select
  using ( true );

create policy "Admins can insert user_badges"
  on user_badges for insert
  with check ( 
    exists (
      select 1 from clan_roles cr
      join profiles p on p.role = cr.name -- This checks the OLD role system for admin access, temporary fallback
      where p.id = auth.uid() and (cr.name = 'admin' or p.role = 'admin') -- Check both dynamic and static checks
    )
  );

create policy "Admins can delete user_badges"
  on user_badges for delete
  using (
    exists (
      select 1 from clan_roles cr
      join profiles p on p.role = cr.name
      where p.id = auth.uid() and (cr.name = 'admin' or p.role = 'admin')
    )
  );


-- Create user_roles join table (for multiple roles support)
create table if not exists user_roles (
  user_id uuid references profiles(id) on delete cascade not null,
  role_id uuid references clan_roles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, role_id)
);

-- Enable RLS for user_roles
alter table user_roles enable row level security;

-- Policies for user_roles
create policy "Public roles are viewable by everyone"
  on user_roles for select
  using ( true );

create policy "Admins can manage user_roles"
  on user_roles for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin' -- Fallback to current role system for permissions
    )
  );

-- DATA MIGRATION: Move existing roles to user_roles
-- Only run this if user_roles is empty to avoid duplicates on re-runs
do $$
begin
  if not exists (select 1 from user_roles) then
    insert into user_roles (user_id, role_id)
    select p.id, r.id
    from profiles p
    join clan_roles r on lower(p.role) = lower(r.name);
  end if;
end $$;
