# Refactor Game Engine

## Goal
Make `game-engine/` pure, deterministic, and easier for independent agents to extend.

## Current Problems
- Engine imports `uid` from `@/lib/utils`.
- IDs use `Math.random`, which weakens deterministic replay and multiplayer sync.
- `rules.ts` mixes move generation, validation, state transition, promotion, and winner detection.
- Chaos events are deterministic by formula today, but event IDs still depend on random `uid`.

## Incremental Plan
1. Add engine-owned deterministic ID/state hash helpers.
2. Update `createInitialState` to accept optional seed/id factory.
3. Split `rules.ts` into:
   - `move-generator.ts`
   - `move-validator.ts`
   - `state-transition.ts`
4. Keep existing exports in `game-engine/index.ts` during migration.
5. Add tests for:
   - mandatory capture
   - multi-capture
   - promotion
   - blocked-player win
   - chaos event replay

## Acceptance Criteria
- `game-engine` has no imports from `@/lib`, React, services, app, or components.
- Same seed plus same move list reconstructs same final state hash.
- Typecheck/build/lint pass.
