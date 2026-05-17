# Chaos Checkers

AI-powered multiplayer checkers platform built with Next.js App Router, TypeScript, TailwindCSS, Framer Motion, Supabase-ready realtime adapters, and OpenAI-ready post-game coaching.

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
