# Why Agent System

## Decision
The project uses file-based agent contracts under `agents/` to define ownership, forbidden actions, architectural rules, and refactoring expectations.

## Context
The project is intended to be AI-friendly and extensible. Without explicit ownership, multiple agents can accidentally edit the same boundary from different assumptions.

## Consequences
- Agents can work independently with clear directory ownership.
- Architecture decisions become reviewable and repeatable.
- Refactors can be broken into bounded tasks.
- Cross-boundary changes require explicit coordination.

## Tradeoff
The system adds documentation overhead, but it prevents chaotic rewrites and makes future AI-assisted development safer.
