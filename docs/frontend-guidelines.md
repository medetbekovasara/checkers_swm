# Frontend Guidelines

## Core Rule
Frontend renders state and emits user intents. It does not decide checkers rules, AI search, or multiplayer synchronization.

## Component Guidelines
- Keep route components thin.
- Keep board rendering separate from match orchestration.
- Keep room controls separate from board stage.
- Keep panels reusable and controlled by typed props.
- Prefer explicit props over hidden global context until state shape stabilizes.

## Current Watchlist
- `components/game/Arena.tsx` mixes app shell, room link, board stage, and side panels.
- `components/game/GameHud.tsx` mixes stats, AI personality controls, mode switching, and reset.
- `components/board/CheckersBoard.tsx` mixes grid mapping, cell rendering, legal destination rendering, last move marker, and perspective mapping.

## Target UI Modules
- `ArenaShell`
- `RoomControls`
- `BoardStage`
- `SidePanelStack`
- `BoardGrid`
- `BoardCell`
- `LegalMoveMarker`
- `PieceMotionLayer`

## Animation Rules
- Animation should be driven by move/replay events.
- Do not compute rules in animation callbacks.
- Avoid layout thrashing on the entire board when one piece moves.

## Mobile UX Rules
- Board must remain first-class on small screens.
- Controls must be reachable without covering legal destinations.
- Text must fit inside buttons and panels.
- Tap and drag should resolve to the same engine move command.
