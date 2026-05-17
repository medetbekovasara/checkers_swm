# Gameplay Boundaries

## Core Principle
Gameplay logic belongs to `game-engine`. UI and services may ask the engine what is legal, but they must not recreate rule decisions.

## Engine Owns
- Board initialization.
- Piece movement.
- Mandatory capture detection.
- Multi-capture path generation.
- Promotion.
- Win detection.
- Chaos/swap mechanics.
- Deterministic state transitions.
- State hashing and replay commands.

## UI Owns
- Selected piece highlight.
- Drag/tap interaction state.
- Legal destination markers based on engine output.
- Animations for movement, capture, promotion, and chaos events.
- Responsive layout and accessibility labels.

## Services Own
- Persisting move commands.
- Publishing realtime events.
- Reconstructing replay frames.
- Asking AI systems for a move or coach report.
- Ranking and profile updates.

## Current Boundary Gaps
- Engine imports `uid` from `lib`, which uses random IDs.
- `useChaosCheckers` sequences move application, chaos event application, AI turns, and selected-piece state in one hook.
- `rules.ts` combines move generation and state transition.

## Target Command Flow
```text
UI intent
  -> session controller
  -> engine validate/apply command
  -> services persist/publish if needed
  -> UI receives next state/view model
```

## Rule for Future Modes
Future modes must be implemented as engine-level rulesets or policies. A mode cannot be implemented by hiding UI moves, changing component behavior, or modifying service payloads only.
