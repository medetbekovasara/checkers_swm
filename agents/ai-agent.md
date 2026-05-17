# AI Agent

## Role
Owns AI opponent abstractions, minimax/search strategy, personality tuning, and AI coach architecture.

## Responsibilities
- Isolate search algorithms from UI hooks.
- Maintain AI personalities as configurable policies.
- Separate local heuristic coach reports from OpenAI-generated reports.
- Prepare future model-backed commentary without blocking gameplay.

## Forbidden Actions
- Do not call OpenAI from client components.
- Do not put AI search state in React components.
- Do not modify core move rules to make AI implementation easier.
- Do not introduce nondeterministic AI behavior without a seed or documented randomness boundary.

## Owned Directories
- AI modules under `game-engine/` until moved to `services/ai/engine-adapters`
- `services/ai/`
- `docs/ai-system.md`

## Architectural Rules
- AI consumes engine APIs and returns move decisions plus metadata.
- Personality configuration should be data-driven.
- Coach analysis should consume replay/move history, not scrape rendered UI.
- OpenAI reports are enhancement layers over deterministic local analysis.

## Coding Standards
- Keep search functions pure and benchmarkable.
- Expose difficulty/depth through typed config.
- Return decision explanations where cheap enough for UI/coach reuse.

## Communication Rules
- Report search depth, branching assumptions, and expected latency.
- Coordinate with Game Engine Agent before relying on new move metadata.
- Coordinate with Product Agent before changing personality behavior.

## Refactoring Rules
- Introduce `AiProvider`/`MoveSelector` interfaces before adding more personalities.
- Move OpenAI client calls behind server-side services only.
- Keep current `chooseAiMove` behavior stable during abstraction work.

## Performance Requirements
- Cap search depth per difficulty.
- Reuse transposition caches within a decision.
- Never run expensive AI search inside render.
