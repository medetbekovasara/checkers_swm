# Product Progression Flow

## Goal
Make Chaos Checkers feel immediately playable while giving returning players a clear reason to sign in, improve, and come back. The progression layer must sit above existing match, room, AI, replay, coach, and ranking concepts; it should not change legal move rules or require UI components to own game logic.

## Product Principles
- First playable interaction stays one click away: guests can start a local or AI match without an account.
- Auth is an upgrade path, not a gate. Use it for saved XP, profile identity, match history, and cross-device continuity.
- Progress feedback is fair and explainable. XP rewards should come from accepted rank results and completed matches, not local-only counters.
- Chaos events are framed as match texture, while legal move trust remains central.
- Placeholder surfaces should set expectations without pretending missing systems are complete.

## Entry And Onboarding Flow
1. Landing state opens directly to the playable arena or main menu with primary actions: `Play Guest`, `Play AI`, `Create Room`, and `Sign In`.
2. `Play Guest` creates an anonymous local profile for the session and starts with no modal blocker.
3. `Sign In` attaches future match results to a persistent profile. If the player was a guest, offer to carry forward only completed-session XP once persistence exists.
4. First-time guidance is dismissible and contextual:
   - Before move one: show one short prompt for tap/drag and legal destination highlights.
   - On first capture: explain mandatory captures only if the engine reports capture-only legal moves.
   - On first chaos event: explain the event outcome after it happens, never before as a blocking lesson.
5. Returning users bypass onboarding unless they open help from settings.

User impact: players reach a real board quickly and learn through play. Business reason: guest starts reduce activation friction, while saved progress creates a natural sign-in reason.

## Main Menu Flow
The main menu should be compact and action-first. It can be a route, shell state, or panel, but should map to existing session modes.

Primary actions:
- `Continue`: resumes the latest unfinished local/AI match if a recoverable match snapshot exists.
- `Play AI`: opens AI setup.
- `Create Room`: creates a shareable room using the multiplayer room flow.
- `Join Room`: accepts a room link or code.
- `Watch Replay`: opens recent completed matches once replay persistence exists.

Secondary destinations:
- `Rankings`
- `Profile`
- `Match History`
- `Settings`

Architecture fit: menu actions should create or select a session, then hand off to the session controller. They should not validate moves, calculate XP, or inspect board legality.

## AI Setup Flow
AI setup should be fast enough for repeat use and expressive enough to make practice feel intentional.

Required controls:
- Side: `Red`, `Black`, or `Random`.
- Difficulty: beginner, balanced, sharp, and expert labels mapped to bounded AI depth/config by the AI layer.
- Personality: use the existing personality concept, but describe it as play style rather than implementation.
- Chaos mode: on/off only if backed by the engine ruleset or chaos policy.

Start behavior:
1. Player chooses setup options.
2. The UI creates a match request.
3. The session controller asks the AI move selector for AI turns.
4. Post-game coach and replay surfaces load progressively after the match has enough history.

Acceptance note: AI setup must never expose search depth, provider names, or model implementation in user-facing copy.

## XP Feedback
XP is feedback for completed competitive effort, not a slot-machine loop.

When to show XP:
- After a completed local AI or multiplayer match.
- After a resignation or timeout only when the ranking service treats it as a valid result.
- Never mid-match as a speculative reward.

What to show:
- Result: win, loss, draw, resignation, or timeout.
- XP delta from the ranking service.
- Streak change if available.
- One coach insight or replay highlight when loaded.
- Next rank progress as a simple bar only when rank thresholds exist.

Guest behavior:
- Guests can see session XP earned in the current browser session.
- Persistent ranking, match history, and profile customization require sign-in.
- Do not promise saved progress until persistence is implemented.

Architecture fit: the result screen consumes a rank result from `services/ranking` and replay/coach summaries from their services. It should not duplicate XP formulas in components.

## Rankings, Profile, History, And Settings
These surfaces can ship as honest placeholders before full persistence is ready.

Rankings:
- Show current demo or service-backed leaderboard.
- Label demo data clearly as a preview if it is not live.
- Future live rankings should sort by service-provided rank or XP, not UI-side heuristics.

Profile:
- Show handle, XP, wins, losses, streak, and sign-in state.
- Guest profile should be clearly temporary.
- Custom avatars, cosmetics, and public profile links are future tasks, not MVP blockers.

Match History:
- Empty state: `Completed matches will appear here after history is enabled.`
- Future rows should reference match id, opponent/AI style, result, XP delta, replay availability, and coach report status.

Settings:
- Include audio, animation intensity, board orientation, accessibility, account, and help placeholders.
- Any setting that affects rules must be disabled unless backed by an engine ruleset or policy.

## Retention Mechanics
Use lightweight retention systems that reinforce improvement and fair competition.

Recommended MVP mechanics:
- Daily challenge placeholder backed by a saved engine position when available.
- Rematch prompt after completed matches.
- Replay highlight: best capture, missed capture, or decisive chaos event from replay/analysis data.
- Coach nudge: one concise improvement point after a match.
- Streak display based on ranking profile, capped in emphasis so losses remain acceptable.

Avoid for MVP:
- Loot boxes, random rewards, or excessive celebration for low-skill actions.
- Pushy account walls before play.
- Social feeds or monetization hooks before stable profiles and match history exist.

## Cross-Agent Dependencies
- Frontend Agent owns menu, onboarding, placeholders, and result presentation.
- Game Engine Agent owns rulesets, legal moves, chaos policies, deterministic replay, and state hashes.
- AI Agent owns difficulty/personality mapping and coach report contracts.
- Backend Agent owns auth, profile persistence, ranking persistence, and match history storage.
- Realtime Agent owns room creation, join flow, room versioning, and accepted move events.
- QA Agent owns acceptance coverage for onboarding, result display, guest behavior, and placeholder states.

## Acceptance Criteria
- A guest can start a playable match without signing in or dismissing a blocking modal.
- A signed-in path is presented as saving progress, not as required access.
- Main menu actions map to local/AI/multiplayer/replay concepts without introducing new gameplay rules.
- AI setup offers side, difficulty, personality, and chaos options only where supported by existing engine/AI contracts.
- XP feedback appears only after a completed or service-accepted match result.
- XP, wins, losses, and streak are read from ranking service outputs or profile data, not recalculated in UI.
- Rankings, profile, match history, and settings can render as placeholders with honest copy when backing services are absent.
- Retention surfaces use replay, coach, ranking, or match data and do not require local UI-only reward counters.
- Mobile users can reach play, rematch, and post-game feedback without covering the board or legal destinations.
- No requirement in this flow asks components, app routes, or services to bypass `game-engine` legal move validation.
