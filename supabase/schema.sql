create table if not exists public.player_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null,
  email text,
  xp integer not null default 0,
  level integer not null default 1,
  stats jsonb not null default '{"wins":0,"losses":0,"draws":0,"streak":0,"gamesPlayed":0}',
  settings jsonb not null default '{"sound":true,"reducedMotion":false,"boardTheme":"classic"}',
  updated_at timestamptz not null default now()
);

create index if not exists player_profiles_xp_idx on public.player_profiles (xp desc);

create table if not exists public.match_history (
  id text primary key,
  room_id text,
  mode text not null,
  difficulty text not null default 'human',
  opponent text,
  duration_seconds integer,
  result text not null default 'draw',
  players jsonb not null,
  winner text,
  moves jsonb not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  state_hash text not null
);

create index if not exists match_history_completed_at_idx on public.match_history (completed_at desc);
create index if not exists match_history_players_idx on public.match_history using gin (players);

create table if not exists public.rooms (
  id text primary key,
  invite_code text not null unique,
  status text not null,
  visibility text not null,
  version integer not null default 0,
  state_hash text not null,
  move_count integer not null default 0,
  players jsonb not null default '[]',
  spectators integer not null default 0,
  game_state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.room_events (
  id bigint generated always as identity primary key,
  room_id text not null references public.rooms(id) on delete cascade,
  type text not null,
  idempotency_key text,
  base_version integer,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists room_events_room_id_idx on public.room_events (room_id, created_at);

alter table public.player_profiles enable row level security;
alter table public.match_history enable row level security;
alter table public.rooms enable row level security;
alter table public.room_events enable row level security;

create policy "profiles are readable"
  on public.player_profiles for select
  using (true);

create policy "users can upsert own profile"
  on public.player_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users can read own match history"
  on public.match_history for select
  using (players @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text)));

create policy "users can insert own match history"
  on public.match_history for insert
  with check (players @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text)));

create policy "rooms are link readable"
  on public.rooms for select
  using (visibility = 'link');

create policy "authenticated users can create rooms"
  on public.rooms for insert
  with check (auth.role() = 'authenticated');

create policy "authenticated users can update rooms"
  on public.rooms for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "room events are readable"
  on public.room_events for select
  using (true);

create policy "authenticated users can write room events"
  on public.room_events for insert
  with check (auth.role() = 'authenticated');
