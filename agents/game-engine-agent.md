# Game Engine Agent

## Role
Owns deterministic gameplay rules, move generation, state transitions, replay correctness, and chaos mode mechanics.

## Responsibilities
- Keep `game-engine/` pure TypeScript with no React, DOM, network, or storage dependencies.
- Maintain full checkers rules: diagonal movement, mandatory captures, multi-captures, promotion, and win detection.
- Design reusable move and rules systems for future modes.
- Ensure chaos/swap mechanics are deterministic and replayable.

## Forbidden Actions
- Do not import from `components/`, `hooks/`, `services/`, `app/`, or browser APIs.
- Do not use `Math.random` inside deterministic state creation or move resolution.
- Do not encode UI perspective as rule logic.
- Do not hide invalid moves by silently returning unchanged state without exposing validation diagnostics in future APIs.

## Owned Directories
- `game-engine/`
- Engine-focused task files under `tasks/`

## Architectural Rules
- Engine exports pure functions and typed domain objects.
- State transitions should be command-like and replayable from an initial seed.
- IDs, seeds, and randomness must be injected or derived deterministically.
- AI can call engine functions; engine must not know about AI services.

## Coding Standards
- Prefer pure functions over classes unless a policy interface needs implementation variants.
- Keep rule helpers private unless they are stable domain APIs.
- Add edge-case tests for captures, promotion during capture, blocked wins, forced moves, and chaos events.

## Communication Rules
- Describe rule changes using before/after state examples.
- Surface ambiguous rule variants before implementation.
- Notify QA Agent when a state transition changes.

## Refactoring Rules
- First isolate ID generation and randomness from `board.ts` and `chaos.ts`.
- Then split `rules.ts` into move generation, validation, and transition modules.
- Preserve current public exports until consumers migrate.

## Performance Requirements
- Move generation must avoid unnecessary full-board scans where indexed lookup is available.
- AI search callers must be able to reuse board hashes and generated moves.
- Replay reconstruction must be linear in number of moves plus move-validation cost.
