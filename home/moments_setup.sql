-- 1. Create Moments Table
create table moments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  media_url text not null,
  media_type text not null check (media_type in ('image', 'video')),
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Moment Tags Table
create table moment_tags (
  id uuid default gen_random_uuid() primary key,
  moment_id uuid references moments(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null, -- The user being tagged
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(moment_id, user_id)
);

-- 3. RLS for Moments
alter table moments enable row level security;

create policy "Moments are viewable by everyone"
  on moments for select
  using ( true );

create policy "Users can insert their own moments"
  on moments for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own moments"
  on moments for delete
  using ( auth.uid() = user_id );

-- 4. RLS for Moment Tags
alter table moment_tags enable row level security;

create policy "Moment tags are viewable by everyone"
  on moment_tags for select
  using ( true );

create policy "Users can tag others in their moments"
  on moment_tags for insert
  with check ( 
    auth.uid() in (
      select user_id from moments where id = moment_id
    )
  );

create policy "Users can remove tags from their moments"
  on moment_tags for delete
  using ( 
    auth.uid() in (
      select user_id from moments where id = moment_id
    )
    OR auth.uid() = user_id -- Allow the tagged user to untag themselves
  );

-- 5. Storage for Moments
-- Create a new public bucket called 'moments'
insert into storage.buckets (id, name, public) 
values ('moments', 'moments', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "Moments are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'moments' );

create policy "Authenticated users can upload moments"
  on storage.objects for insert
  with check ( bucket_id = 'moments' and auth.role() = 'authenticated' );

create policy "Users can delete their own moments"
  on storage.objects for delete
  using ( bucket_id = 'moments' and auth.uid() = owner );
