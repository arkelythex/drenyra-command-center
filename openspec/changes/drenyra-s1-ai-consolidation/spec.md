# Specification — S1: AI/Agent Ecosystem Consolidation

## Context Update (2026-07-11)

Since the proposal was written (2026-07-04), three of five target packages have been removed:

- `@drenyra/platform-core` ❌ removed
- `@drenyra/harness` ❌ removed
- `@drenyra/agent-memory` ❌ removed

`drenyra-pi` standalone repo now contains the agent runtime, harness, and fiscal skills.

## Remaining work

### Requirement 1: Slim down @drenyra/ai

`@drenyra/ai` still carries agents/, memory/, governance/, and control-plane/ that drenyra-pi now provides.

**Acceptance criteria:**

- @drenyra/ai keeps only: gateway/, providers/, model-registry, tool-bridge, openrouter
- agents/, memory/, governance/, control-plane/ are removed from @drenyra/ai
- Consumers that need those modules import from @drenyra/pi instead
- @drenyra/ai typecheck passes with 0 errors after slim-down

### Requirement 2: @drenyra/drenyra-orchestrator consolidation

`@drenyra/drenyra-orchestrator` has 8 files (delegation-router, skills-resolver, work-routing, etc.) that overlap with drenyra-pi's harness-core.

**Acceptance criteria:**

- Orchestrator types and logic that overlap with drenyra-pi are deprecated or removed
- Orchestrator-specific logic (Drenyra-specific routing) stays
- Consumers are updated to use @drenyra/pi where applicable

### Requirement 3: Consumer alignment

Apps and packages that import from the old locations must be updated.

**Acceptance criteria:**

- apps/api imports from correct packages after migration
- No orphaned re-exports
- All downstream typecheck passes

## Non-goals

- Do NOT re-extract what drenyra-pi already has
- Do NOT rewrite @drenyra/ai gateway — keep it stable
- Do NOT touch @drenyra/drenyra-orchestrator's Drenyra-specific routing logic
