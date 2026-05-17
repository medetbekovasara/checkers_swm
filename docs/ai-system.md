# AI System

## Current State
- `game-engine/ai.ts` implements minimax with alpha-beta pruning, move ordering, cache, and personality weights.
- `services/ai/coach.ts` implements local coach heuristics and a client-side request helper.
- `app/api/coach/route.ts` calls OpenAI server-side when `OPENAI_API_KEY` is present.

## Current Gaps
- No formal `MoveSelector` interface.
- Personality config is embedded in the AI implementation.
- Coach provider and local analyzer are not separate interfaces.
- AI move decision metadata is minimal.

## Target Interfaces

```ts
type MoveSelector = {
  selectMove(input: MoveSelectionInput): MoveSelectionResult;
};

type CoachAnalyzer = {
  analyze(game: GameState): CoachReport | Promise<CoachReport>;
};
```

## AI Opponent Requirements
- Must consume engine state and legal moves.
- Must never mutate UI state.
- Must expose difficulty/depth config.
- Must keep search bounded.
- Should return explanation metadata for coach/replay UI where feasible.

## AI Coach Requirements
- Local coach remains deterministic fallback.
- OpenAI coach is server-side only.
- Coach should analyze replay history and engine-derived metrics.
- Coach reports should be cacheable by game hash once persistence exists.

## Refactor Path
1. Extract personality config from `game-engine/ai.ts`.
2. Introduce `MoveSelector` and keep current minimax behind it.
3. Introduce `CoachAnalyzer` and `CoachReportProvider`.
4. Add report caching once game hashes exist.
