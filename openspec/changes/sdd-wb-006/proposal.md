# SDD-WB-006 — Agent Activity & Semantic State

**Change ID:** `sdd-wb-006`
**Capability:** CAP-WB-06 (Agent Activity & Semantic State)
**Wave:** B (Agent Awareness)
**Status:** proposal
**Created:** 2026-07-27

## Purpose

Give each workspace pane visibility into its running agents: what state they're in (working, blocked, waiting for approval), what they've done (activity feed with tools, sources, results), and controls to act (pause, cancel, resume).

## Current-state gap

- Agent types exist (`AgentSessionStatusDTO`) but they're technical process states, not Workbench semantic states
- No activity feed showing concrete actions (tools executed, sources consulted, documents read)
- No pause/cancel/resume integrated into the pane system
- No real-time streaming from Pi to frontend

## Scope

### Included

1. **Semantic agent state model** — 9 states: queued, working, verifying, waiting_for_input, waiting_for_approval, blocked, completed, failed, unknown
2. **Agent state badge** — Compact dot for pane headers, full badge with reason for activity feed
3. **Activity feed component** — Real-time list of events showing: tool_executed, source_consulted, document_read, rule_applied, result_produced, decision_pending, error
4. **Agent activity store** (Zustand) — Manages feeds by agentId, event accumulation
5. **Control buttons** — Pause/cancel/resume per active agent
6. **Right panel agent tab** — Agent activity in the existing right panel

### Non-goals (Wave D)

- Skills browser and automation scheduler
- Full agent orchestration UI
- Persistent agent workspaces

## Existing code to evolve

| File                                           | Status    | Evolution                                      |
| ---------------------------------------------- | --------- | ---------------------------------------------- |
| `features/agents/agents.types.ts`              | ✅ exists | Technical states → extend with semantic states |
| `features/agents/agents.store.ts`              | ✅ exists | Session management → extend with activity feed |
| `features/agent-swarm/hooks/useAgentStates.ts` | ✅ exists | State polling → extend with semantic states    |
| `components/agentic/RightPanel.tsx`            | ✅ exists | Add agent activity tab                         |
| `stores/agent-activity.store.ts`               | ✅ NEW    | Activity feed store                            |
| `types/agent-activity.ts`                      | ✅ NEW    | Semantic state types + activity event types    |
| `components/workbench/AgentStateBadge.tsx`     | ✅ NEW    | Semantic state badge                           |
| `components/workbench/AgentActivityFeed.tsx`   | ✅ NEW    | Activity feed component                        |

## PRs

| PR  | Scope                                       | Files est. | Lines est. |
| --- | ------------------------------------------- | ---------- | ---------- |
| PR1 | Semantic state types + store                | 2          | ~100       |
| PR2 | AgentStateBadge component                   | 1          | ~80        |
| PR3 | AgentActivityFeed component                 | 1          | ~200       |
| PR4 | Right panel integration + controls          | 2          | ~120       |
| PR5 | Real-time streaming (SSE/WebSocket from Pi) | 3          | ~180       |
