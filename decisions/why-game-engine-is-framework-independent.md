# Why Game Engine Is Framework Independent

## Decision
The checkers game engine must remain pure TypeScript and independent from React, Next.js, Supabase, OpenAI, browser APIs, and rendering helpers.

## Context
The engine is the source of truth for legal moves, state transitions, replay, AI search, and chaos mode behavior. Multiplayer and replay require deterministic reconstruction of game state.

## Consequences
- Engine functions can be tested without a browser or Next.js.
- AI and replay can share the same rules as UI gameplay.
- Multiplayer can validate events using the same deterministic state transitions.
- Future clients can reuse the engine without importing the web app.

## Tradeoff
Some convenience helpers must be duplicated or moved into engine-owned deterministic utilities instead of using app-level utilities.
