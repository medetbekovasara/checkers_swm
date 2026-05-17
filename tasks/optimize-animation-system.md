# Optimize Animation System

## Goal
Prepare board animation for polished gameplay without coupling animation to rule logic.

## Current Problems
- Piece animation is local to `GamePiece`.
- Board does not expose a clear motion event stream.
- Replay timeline is not connected to animated board playback.

## Incremental Plan
1. Create shared board animation variants.
2. Derive visual events from accepted moves and replay frames.
3. Add capture and promotion animation states.
4. Add replay playback controller.
5. Verify desktop and mobile board framing.

## Acceptance Criteria
- Animations consume move/replay events.
- Rules stay in `game-engine`.
- Board remains responsive and avoids full layout thrash where possible.
