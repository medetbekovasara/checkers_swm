# Current Architecture Audit

## Scope
This audit covers the current source tree only: `app/`, `components/`, `game-engine/`, `hooks/`, `lib/`, and `services/`.

## Current Strengths
- The project already has a useful top-level separation: `game-engine`, `components`, `services`, `hooks`, and `app`.
- `game-engine/` contains most rules and AI behavior outside React components.
- UI components are relatively small. No current component is a severe giant component, though `components/game/Arena.tsx` and `components/game/GameHud.tsx` are approaching orchestration size.
- Supabase and OpenAI are already isolated from board rendering.
- Build, typecheck, and lint passed before this audit.

## Key Risks

### 1. Game engine is not fully framework-independent
Files affected:
- `game-engine/board.ts`
- `game-engine/chaos.ts`
- `game-engine/rules.ts`

Issue:
`game-engine` imports `uid` from `@/lib/utils`. That utility uses `Math.random` and app-level path aliases. This breaks the target rule that `game-engine` should be pure deterministic TypeScript with no app-layer dependency.

Impact:
- Replay cannot be guaranteed deterministic across clients.
- Multiplayer event reconstruction can diverge if IDs differ.
- Future package extraction of the engine becomes harder.

Recommended fix:
Move ID/randomness behind engine-owned deterministic helpers or inject an ID factory/seed from the orchestration layer.

### 2. Gameplay orchestration and UI orchestration are mixed
Files affected:
- `hooks/useChaosCheckers.ts`
- `components/game/Arena.tsx`

Issue:
`useChaosCheckers` handles local game state, selected piece state, AI personality state, AI turn execution, chaos event application, and reset. `Arena` combines product shell, room link UI, board stage, HUD, side panels, and clipboard behavior.

Impact:
- Multiplayer integration has no clean place to intercept move commands.
- AI turns and local moves share client-only flow, which will not scale to authoritative rooms.
- UI changes can accidentally affect gameplay flow.

Recommended fix:
Introduce a game session/controller hook that emits typed intents and move commands. Split `Arena` into layout and feature sections.

### 3. Realtime service is an adapter, not a protocol yet
Files affected:
- `services/multiplayer/rooms.ts`

Issue:
`publishMove(roomId, move, game)` sends the move and full game state together. There is no version number, idempotency key, authoritative validation, or event type.

Impact:
- Race conditions and stale clients can overwrite or fork room state.
- Spectator replay depends on trusting client snapshots.
- Desync detection is not possible with current payload shape.

Recommended fix:
Create event contracts: `move_submitted`, `move_accepted`, `room_snapshot`, and `presence_changed`. Publish compact move commands and reconstruct authoritative state from ordered events.

### 4. AI system lacks provider abstraction
Files affected:
- `game-engine/ai.ts`
- `services/ai/coach.ts`
- `app/api/coach/route.ts`

Issue:
Local minimax, local coach heuristics, and OpenAI coach report behavior are separated by file, but not by formal interface.

Impact:
- Adding difficulty levels, explanations, or model-backed commentary will create coupling between UI, services, and engine.
- AI personality tuning is embedded in search implementation.

Recommended fix:
Introduce interfaces such as `MoveSelector`, `AiPersonalityConfig`, `CoachAnalyzer`, and `CoachReportProvider`.

### 5. Replay is service-level but not fully integrated
Files affected:
- `services/replay/replay.ts`
- `components/game/ReplayTimeline.tsx`

Issue:
Replay frame generation exists, but UI only displays move labels from current state. There is no active frame state, animated playback controller, or consistency check between live state and replay reconstruction.

Impact:
- Replay cannot yet validate multiplayer recovery.
- Animated replay is a UI placeholder rather than a system feature.

Recommended fix:
Add replay controller state and QA tests comparing reconstructed final state to actual final state.

### 6. Rendering and interaction are mostly separated, but board still owns too much display logic
Files affected:
- `components/board/CheckersBoard.tsx`
- `components/board/GamePiece.tsx`

Issue:
Board maps perspective, square rendering, legal destination rendering, last move rendering, and piece selection in one file.

Impact:
- Future animation features will make the board harder to maintain.
- Mobile drag/drop and tap flows will compete inside one component.

Recommended fix:
Extract `BoardGrid`, `BoardCell`, `LegalMoveMarker`, and animation variants.

## Duplicated Logic
- There is no major copy-paste duplication yet.
- Potential future duplication risk exists around move destination lookup in UI, replay reconstruction, and AI move application.

## Giant Components
- No severe giant component exists.
- Watchlist:
  - `components/game/Arena.tsx` at 105 lines mixes shell, room controls, board stage, and side panels.
  - `components/game/GameHud.tsx` at 109 lines mixes match stats, AI config, mode switching, and reset controls.
  - `game-engine/rules.ts` at 184 lines mixes move generation, validation, state transition, promotion, and winner evaluation.

## Boundary Violations
- `game-engine` imports `@/lib/utils`.
- `hooks/useChaosCheckers.ts` is the current implicit app controller and mixes local gameplay, AI, and chaos sequencing.
- `services/ai/coach.ts` calls `createInitialState`, which currently creates random IDs, making analysis less deterministic than it should be.

## Priority Fix Order
1. Make `game-engine` deterministic and independent from `lib`.
2. Split `rules.ts` into move generation, validation, and transition.
3. Create a session/controller layer for local, AI, and future multiplayer games.
4. Replace realtime snapshot publishing with event protocol.
5. Add formal AI and coach provider interfaces.
6. Add engine and replay consistency tests.
