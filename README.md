# Chaos Checkers

AI-powered multiplayer checkers platform built with Next.js App Router, TypeScript, TailwindCSS, Framer Motion, Supabase-ready realtime adapters, and OpenAI-ready post-game coaching.

## Product

Chaos Checkers is a modern competitive checkers platform for players who want more than a basic board game. It combines classic checkers, adaptive Chaos mode, local two-player matches, online room links, AI opponents, progression, match history, and post-game coaching in one clean product experience.

The platform is designed for casual competitive players, students practicing strategy, and friends who want quick online or same-screen matches. Its value is that it turns a familiar game into a replayable strategy product: players can learn from AI feedback, track progress, invite friends by link, and play modes that force real adaptation instead of repeating the same static match.

## Architecture

- `game-engine/`: UI-independent rules, move validation, multi-captures, promotion, win detection, minimax alpha-beta AI, and chaos/swap mechanics.
- `components/`: animated board, HUD, replay, coach, chaos feed, and leaderboard UI.
- `services/`: Supabase multiplayer, replay frames, ranking, and AI coach adapters.
- `app/`: Next.js routes and API endpoint for OpenAI coach reports.
- `hooks/`: reusable client orchestration around the pure engine.

## Environment

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
OPENAI_COACH_MODEL=
```

If Supabase or OpenAI variables are missing, the MVP runs locally with deterministic engine, local room links, and local coach analysis.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
```
# checkers_swm
