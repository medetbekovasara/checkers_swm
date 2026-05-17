# Multiplayer Architecture

## Current State
`services/multiplayer/rooms.ts` contains a Supabase-ready adapter with:
- local room creation
- move publication
- room subscription

It is useful as a starting point but not yet a production protocol.

## Problems To Solve
- Full `GameState` is published with moves.
- No event type system.
- No room version.
- No idempotency key.
- No authoritative validation path.
- No conflict or desync handling.

## Target Event Protocol

### `move_submitted`
Client submits:
- `roomId`
- `clientId`
- `idempotencyKey`
- `baseVersion`
- `moveCommand`

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

## Desync Handling
- If client `baseVersion` is stale, reject or request snapshot.
- If local replay hash differs from authoritative hash, reload from `room_snapshot`.
- Duplicate idempotency keys should return previous accepted result.

## Agent Ownership
- Realtime Agent owns protocol and synchronization.
- Backend Agent owns tables and API validation.
- Game Engine Agent owns deterministic replay and state hashing.
- Frontend Agent only renders pending/accepted states.
