# Realtime Agent

## Role
Owns multiplayer synchronization, room lifecycle, spectator events, and desync prevention.

## Responsibilities
- Centralize all Supabase Realtime and WebSocket behavior.
- Define authoritative move event payloads and room snapshots.
- Prevent duplicate moves, stale turn updates, and replay divergence.
- Prepare spectator-ready architecture without coupling it to board rendering.

## Forbidden Actions
- Do not subscribe to realtime channels directly inside visual components.
- Do not trust client-submitted `GameState` as authoritative without validation.
- Do not publish full snapshots for every minor UI action.
- Do not mix clipboard/room-link UI behavior with network synchronization logic.

## Owned Directories
- `services/multiplayer/`
- Realtime hooks when created under `hooks/`
- `docs/multiplayer-architecture.md`

## Architectural Rules
- Clients publish move commands; authoritative state is reconstructed or validated from ordered events.
- Room state must include version/turn numbers for conflict detection.
- Spectator events are read-only.
- Networking adapters must not import React components.

## Coding Standards
- Use explicit event types: `move_submitted`, `move_accepted`, `room_snapshot`, `presence_changed`.
- Type payloads and map Supabase rows to domain events.
- Keep unsubscribe cleanup deterministic.

## Communication Rules
- Report race-condition risks with sequence diagrams or ordered steps.
- Notify QA Agent for any room protocol changes.
- Ask Backend Agent before adding table dependencies.

## Refactoring Rules
- Replace direct `publishMove(roomId, move, game)` with command/event APIs.
- Add idempotency keys before enabling real multiplayer.
- Keep local room mode available for development.

## Performance Requirements
- Send moves and compact metadata, not entire board state, on the hot path.
- Debounce presence updates.
- Keep replay reconstruction separate from live rendering updates.
