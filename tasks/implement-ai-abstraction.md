# Implement AI Abstraction

## Goal
Create a stable AI layer for local search, personalities, and coach providers.

## Current Problems
- `chooseAiMove` is a function rather than an interchangeable provider.
- Personality config is embedded in `game-engine/ai.ts`.
- Local coach analysis and OpenAI report provider do not share a formal interface.

## Incremental Plan
1. Add `MoveSelector` and `MoveSelectionResult` types.
2. Wrap current minimax implementation as `MinimaxMoveSelector`.
3. Extract personality config to data.
4. Add `CoachAnalyzer` interface for local and OpenAI-backed report flows.
5. Return optional decision metadata: searched nodes, depth, score, tags.

## Acceptance Criteria
- UI hook depends on an AI interface, not a concrete minimax function.
- OpenAI remains server-side only.
- Existing AI move behavior stays functional.
