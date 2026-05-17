# Auth And Progression

## Boundaries
- Supabase auth and persistence live in `services/auth`, `services/profile`, and `services/ranking`.
- UI consumes hooks and typed service functions; it does not call Supabase directly.
- Guest mode is a local fallback and does not require Supabase configuration.

## Environment

Supabase-backed auth and persistence are enabled when both variables are set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Without those variables, auth can create a guest identity and profile saves use local memory plus browser
`localStorage` when available.

## Auth

`services/auth/auth.ts` assumes Supabase email/password auth is enabled. Sign-up can pass a `handle` into user
metadata, but `player_profiles.handle` remains the progression display source of truth.

## Supabase Tables

```sql
create table player_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text not null,
  email text,
  xp integer not null default 0,
  level integer not null default 1,
  stats jsonb not null default '{"wins":0,"losses":0,"draws":0,"streak":0,"gamesPlayed":0}',
  settings jsonb not null default '{"sound":true,"reducedMotion":false,"boardTheme":"classic"}',
  updated_at timestamptz not null default now()
);

create index player_profiles_xp_idx on player_profiles (xp desc);

create table match_history (
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

create index match_history_completed_at_idx on match_history (completed_at desc);
```

Recommended RLS assumptions:

- Players can read leaderboard-safe profile fields: `id`, `handle`, `xp`, `level`, `stats`.
- Authenticated users can insert and update only their own row where `auth.uid() = id`.
- Guest/local profiles are not persisted to Supabase until linked to an authenticated user id.

## MVP Behavior
- Supabase configured: email/password login and signup use persistent Supabase sessions.
- Supabase missing: player can continue as guest using local storage when the browser provides it.
- Profile persistence falls back locally when Supabase is not configured.
- Ranking reads from `player_profiles` ordered by `xp desc`; result updates are calculated in the ranking service
  and persisted through the profile service.
- Match history writes through `services/history/history.ts`; it uses Supabase when configured and in-memory local
  fallback otherwise.
- Ranking XP now accepts optional result context: `difficulty`, `mode`, and `streak`. Existing result updates still
  work without context and default to friendly human-match scoring.
