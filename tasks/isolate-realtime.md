# Isolate Realtime

## Goal
Turn the current Supabase helper into a production-ready multiplayer synchronization layer.

## Current Problems
- `publishMove` sends full `GameState` with a move.
- No event types, versions, idempotency keys, or desync handling.
- No separation between local room demo behavior and production room protocol.

## Incremental Plan
1. Define typed room events in `services/multiplayer/events.ts`.
2. Replace `publishMove(roomId, move, game)` with `submitMoveCommand`.
3. Add `roomVersion`, `stateHash`, and `idempotencyKey`.
4. Add `subscribeToRoomEvents` returning typed domain events.
5. Add snapshot recovery contract.
6. Create QA race-condition fixtures for duplicate and stale moves.

## Acceptance Criteria
- UI never imports Supabase client directly.
- Realtime service publishes compact commands/events, not arbitrary snapshots on the hot path.
- Desync recovery path is documented and testable.
