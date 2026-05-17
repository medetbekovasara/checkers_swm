# Multiplayer Architecture

## Current State
`services/multiplayer/rooms.ts` now owns the room/session foundation:
- `createRoomSession` creates a typed room with an invite code and local fallback storage.
- `joinRoomByLink` resolves an invite URL/code without coupling link parsing to UI.
- `submitMoveCommand` accepts compact move commands with `baseVersion` and `idempotencyKey`.
- `subscribeToRoomEvents` emits typed room events and deterministic cleanup.
- `getLocalRoomSnapshot` supports local development and snapshot recovery.

`services/multiplayer/events.ts` owns protocol types and `createStateHash`.
Supabase remains optional; when the client is not configured, rooms use in-memory local records.

## Problems To Solve
- No authoritative validation path.
- Server-side Supabase functions still need to convert `move_submitted` into `move_accepted`.
- Conflict/desync handling is contracted but not fully enforced by an authoritative backend yet.

## Target Event Protocol

### `move_submitted`
Client submits:
- `roomId`
- `clientId`
- `idempotencyKey`
- `baseVersion`
- `move`
- `submittedAt`

### `move_accepted`
Authoritative response:
- `roomId`
- `version`
- `move`
- `stateHash`
- `acceptedAt`

### `room_snapshot`
Periodic or join-time state:
- `roomId`
- `version`
- `state`
- `stateHash`
- `moveCount`

### `presence_changed`
Presence metadata:
- `roomId`
- `players`
- `spectators`

## Authority Model
MVP can use optimistic local moves, but production multiplayer should validate moves against the previous accepted room version.
The client submits a command only. The server should:
1. Load the current room version.
2. Reject duplicate `idempotencyKey` by returning the previous accepted event.
3. Reject stale `baseVersion` with a snapshot recovery instruction.
4. Validate the move against the previous accepted state.
5. Append `move_accepted` and increment room `version`.

## Desync Handling
- If client `baseVersion` is stale, reject or request snapshot.
- If local replay hash differs from authoritative hash, reload from `room_snapshot`.
- Duplicate idempotency keys should return previous accepted result.

## Optional Supabase Schema

```sql
create table rooms (
  id text primary key,
  invite_code text not null unique,
  status text not null,
  visibility text not null default 'link',
  version integer not null default 0,
  state_hash text not null,
  move_count integer not null default 0,
  players jsonb not null default '[]',
  spectators integer not null default 0,
  game_state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table room_events (
  id bigint generated always as identity primary key,
  room_id text not null references rooms(id) on delete cascade,
  type text not null,
  idempotency_key text,
  base_version integer,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create unique index room_events_idempotency_idx
  on room_events (room_id, idempotency_key)
  where idempotency_key is not null;
```

## Agent Ownership
- Realtime Agent owns protocol and synchronization.
- Backend Agent owns tables and API validation.
- Game Engine Agent owns deterministic replay and state hashing.
- Frontend Agent only renders pending/accepted states.
