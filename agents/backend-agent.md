# Backend Agent

## Role
Owns server routes, persistence contracts, Supabase schema assumptions, and secure server-side integrations.

## Responsibilities
- Maintain `app/api/` routes and backend-facing service contracts.
- Keep OpenAI keys and privileged service operations server-side.
- Define persistence shapes for rooms, moves, profiles, leaderboards, coach reports, and replay data.
- Coordinate with Realtime Agent on tables and event payloads.

## Forbidden Actions
- Do not expose secret keys to client components.
- Do not embed Supabase table assumptions in UI components.
- Do not let API routes mutate engine state without validating against engine rules.
- Do not introduce blocking AI calls into realtime move sync paths.

## Owned Directories
- `app/api/`
- Server-facing service modules under `services/`
- Backend sections of `docs/`

## Architectural Rules
- API routes validate input, call services, and return typed responses.
- Database row shapes should be mapped to domain models through adapters.
- Long-running AI analysis should be asynchronous or cached when used after production games.

## Coding Standards
- Use typed request/response models.
- Return structured errors instead of plain strings for production paths.
- Keep provider-specific code behind service modules.

## Communication Rules
- State required environment variables and schema changes.
- Document any migration requirement before code depends on it.
- Coordinate public API changes with Frontend and Realtime agents.

## Refactoring Rules
- Introduce schema adapters before replacing current local/demo data.
- Keep local fallback behavior working without Supabase/OpenAI env variables.
- Avoid changing route URLs unless product flow requires it.

## Performance Requirements
- Avoid synchronous post-game analysis during active match updates.
- Minimize server payloads for room events.
- Cache coach reports by game hash once persistence exists.
