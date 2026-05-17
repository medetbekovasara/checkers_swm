# Target Architecture

## Goal
The project should behave like a modular multiplayer game platform where agents can work independently without breaking each other's contracts.

## Dependency Direction
Allowed direction:

```text
app
  -> components
  -> hooks
  -> services
  -> game-engine
  -> lib/shared primitives only
```

Strict rule:
`game-engine` must not import from `app`, `components`, `hooks`, `services`, or app-specific `lib` helpers.

## Directory Contracts

### `game-engine/`
- Pure TypeScript.
- No React.
- No browser APIs.
- No Supabase/OpenAI/networking.
- Deterministic state transitions only.
- Owns rules, move validation, captures, AI-search-compatible board evaluation primitives, chaos mode policies, and replayable commands.

### `components/`
- Rendering only.
- Animations and local visual state.
- Receives `GameState`-like view models and callbacks.
- Does not validate moves or publish realtime messages.

### `hooks/`
- Client orchestration.
- Converts UI intents into engine/service commands.
- Owns ephemeral client state such as selected piece, active replay frame, pending network state.

### `services/`
- Multiplayer, AI coach, replay, ranking, persistence, networking.
- Converts provider-specific payloads into domain-level contracts.
- May depend on `game-engine` types and functions.

### `lib/`
- Shared generic helpers only.
- No domain-specific game rules.
- Any helper imported by `game-engine` must be deterministic and free of React/browser/provider dependencies.

### `app/`
- Routes and API boundaries.
- Thin page composition.
- Server-only provider integrations when secrets are involved.

## Target Modules

### Game Engine
- `types.ts`: domain types only.
- `board.ts`: board primitives and position helpers.
- `move-generator.ts`: legal move generation.
- `move-validator.ts`: move validation and diagnostics.
- `state-transition.ts`: apply commands to state.
- `rulesets/`: classic rules and future variants.
- `chaos/`: deterministic chaos policies.
- `hash.ts`: stable state hashing.

### Frontend
- `components/board/`: visual board system.
- `components/game/`: gameplay screens and panels.
- `components/ui/`: reusable primitives if the UI grows.
- `hooks/useGameSession.ts`: local/AI/multiplayer session controller.
- `hooks/useReplayController.ts`: replay playback state.

### Services
- `services/multiplayer/`: room protocol, Supabase adapter, event sync.
- `services/ai/`: AI move selectors, coach providers, OpenAI route client.
- `services/replay/`: replay frames and consistency utilities.
- `services/ranking/`: XP, leaderboard, profile adapters.

## Acceptance Criteria
- `npm run typecheck`, `npm run build`, and `npm run lint` pass.
- `game-engine` can be imported by tests without Next.js.
- Replaying `initialState + moves` produces the same final state hash as live play.
- Realtime room protocol includes event versioning and idempotency keys before production multiplayer.
