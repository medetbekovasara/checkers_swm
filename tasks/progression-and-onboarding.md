# Progression And Onboarding

## Goal
Implement the product progression flow in small, architecture-compatible increments.

## Tasks
1. Add action-first entry state with `Play Guest`, `Play AI`, `Create Room`, `Join Room`, and `Sign In`.
2. Add dismissible contextual onboarding for first move, mandatory capture, and first chaos event.
3. Add AI setup for side, difficulty, personality, and supported chaos mode.
4. Add post-match XP feedback that consumes ranking result data.
5. Add placeholder destinations for rankings, profile, match history, and settings.
6. Add lightweight retention surfaces: rematch, replay highlight, coach nudge, and streak display.

## Product Constraints
- Do not block guest play behind auth.
- Do not duplicate move legality, XP formulas, or AI search config in UI components.
- Do not promise saved guest progress before persistence exists.
- Keep placeholder copy honest and short.

## Acceptance Criteria
- Guest users can reach a playable board in one primary action.
- Sign-in is framed as saving profile, XP, and history.
- AI setup starts a match through the session/controller layer.
- XP feedback is shown only after completed or service-accepted results.
- Placeholder pages render without requiring backend persistence.
- Retention mechanics consume ranking, replay, coach, or match data.
