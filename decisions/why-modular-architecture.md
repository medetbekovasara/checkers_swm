# Why Modular Architecture

## Decision
The project keeps gameplay, rendering, services, routing, and shared utilities in separate modules with explicit dependency direction.

## Context
Chaos Checkers is not just a local board game. It needs AI opponents, realtime multiplayer, replay, ranking, and post-game analysis. These systems evolve at different speeds and should not require each other to change for unrelated improvements.

## Consequences
- Game rules can evolve without redesigning UI panels.
- UI can become more animated without changing legal move generation.
- Realtime can become authoritative without rewriting the board renderer.
- AI providers can be swapped behind interfaces.

## Tradeoff
More boundaries mean more small files and contracts, but the project becomes safer to scale.
