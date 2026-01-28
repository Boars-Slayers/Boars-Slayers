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
