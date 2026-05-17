# Chaos Checkers Agent Operating Manual

This project uses a file-based multi-agent engineering system.

Before changing code, read the relevant ownership file in `agents/`:

- `agents/architect-agent.md`
- `agents/frontend-agent.md`
- `agents/game-engine-agent.md`
- `agents/backend-agent.md`
- `agents/realtime-agent.md`
- `agents/ai-agent.md`
- `agents/qa-agent.md`
- `agents/product-agent.md`

Architecture references live in `docs/`.
Incremental work items live in `tasks/`.
Architecture decisions live in `decisions/`.

Default rule: do not rewrite working systems. Make bounded changes that preserve the existing architecture and strengthen module boundaries.
