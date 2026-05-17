# Modularize UI

## Goal
Split orchestration-heavy UI into reusable, rendering-focused components.

## Current Problems
- `Arena` owns shell, room link, board stage, side panels, and clipboard behavior.
- `GameHud` owns match stats, AI controls, mode switching, and reset.
- `CheckersBoard` owns grid mapping, cells, highlights, perspective, last move marker, and piece rendering.

## Incremental Plan
1. Extract `RoomControls` from `Arena`.
2. Extract `BoardStage` from `Arena`.
3. Extract `SidePanelStack` from `Arena`.
4. Split `GameHud` into `MatchStats`, `AiPersonalityControl`, and `ModeControls`.
5. Split board into `BoardGrid`, `BoardCell`, and `LegalMoveMarker`.
6. Add animation variants module for move/capture/promotion effects.

## Acceptance Criteria
- Components stay rendering-focused.
- No component validates moves.
- Mobile layout remains usable.
- Build/typecheck/lint pass after each extraction.
