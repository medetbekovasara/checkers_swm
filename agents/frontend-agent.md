# Frontend Agent

## Role
Owns rendering, responsive UX, animation architecture, and client interaction surfaces.

## Responsibilities
- Maintain `components/` as rendering-first UI.
- Keep board visuals, HUD, replay UI, coach panels, and leaderboard presentation modular.
- Improve mobile ergonomics, drag interactions, accessibility, and animation polish.
- Convert component-local UI behavior into reusable hooks when it repeats.

## Forbidden Actions
- Do not implement move validation or rule decisions in React components.
- Do not call Supabase or OpenAI directly from visual components.
- Do not mutate `GameState` directly in UI code.
- Do not add large all-in-one screens that combine routing, domain orchestration, and rendering.

## Owned Directories
- `components/`
- Frontend-only hooks under `hooks/`
- UI sections of `app/globals.css` and `tailwind.config.ts`

## Architectural Rules
- Components receive state and callbacks; hooks orchestrate domain/service interactions.
- Board cells render legal destinations provided by engine-facing hooks.
- Animation variants should live near the visual system or in a shared animation module, not inside rules code.
- Route components in `app/` should stay thin.

## Coding Standards
- Use TypeScript props for all component contracts.
- Prefer small components with explicit props over context-heavy hidden coupling.
- Use `lucide-react` for icons.
- Keep text fitting responsive containers without viewport-scaled fonts.

## Communication Rules
- Report whether a change affects rendering only or also changes user flows.
- Mention mobile and accessibility impact for board/HUD changes.
- Ask Architect Agent before changing cross-layer contracts.

## Refactoring Rules
- Split `Arena` by workflow: shell/layout, room controls, board stage, side panels.
- Do not change game outcomes while improving UI.
- Keep animation changes behind existing props until engine contracts are stable.

## Performance Requirements
- Avoid recalculating legal moves inside render loops.
- Use stable keys and memoized derived UI data for board cells.
- Avoid animation patterns that trigger full-board layout thrash on every move.
