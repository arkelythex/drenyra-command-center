# Tasks: Drenyra Agents Window

## Review Workload Forecast

| Field                   | Value                                                      |
| ----------------------- | ---------------------------------------------------------- |
| Estimated changed lines | ~880 (280 + 350 + 250)                                     |
| 400-line budget risk    | Medium                                                     |
| Chained PRs recommended | Yes                                                        |
| Suggested split         | PR 1 (API) → PR 2 (frontend core) → PR 3 (frontend panels) |
| Delivery strategy       | auto-chain                                                 |
| Chain strategy          | stacked-to-main                                            |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal                                                                                                                 | Likely PR | Notes                                                                                          |
| ---- | -------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------- |
| 1    | API endpoints + backend types + bridge to SessionManager                                                             | PR 1      | Base: main. Creates `apps/api/src/features/agents/` with 6 files, registers in app-core, tests |
| 2    | Frontend: AgentsWindowPage + AgentCard + AgentFilterBar + store + API client + route                                 | PR 2      | Base: main (after PR 1). Creates `apps/web/src/features/agents/` core (8 files) + route        |
| 3    | Frontend: AgentTabPanel + AgentTimeline + AgentRiskBadge + AgentCostDisplay + AgentSessionControls + AgentActionMenu | PR 3      | Base: main (after PR 2). Adds 6 panel/detail components                                        |

---

## PR 1 — API Endpoints + Backend Types + Bridge

### Phase 1: Types & Schemas

- [ ] **1.1 Create `agents.types.ts`**: Define `AgentSessionStatus`, `AgentStep`, `PaginatedAgentSessions`, `SessionActionResponse` types mirroring spec contracts
      **Files**: `apps/api/src/features/agents/agents.types.ts`
      **Pattern from**: `apps/api/src/features/threads/quick-actions.service.ts` (adjacent feature DTO pattern)
      **Acceptance**: All DTOs exported, `AgentSessionStatus` has all 18 fields from spec

- [ ] **1.2 Create `agents.schemas.ts`**: Elysia `t.Object` schemas for list query (client, period, status, risk, agentType), session params (id), and action body
      **Files**: `apps/api/src/features/agents/agents.schemas.ts`
      **Pattern from**: `apps/api/src/features/threads/threads.routes.ts` — match schema naming/pattern
      **Acceptance**: Schemas validate all query params and params, reject invalid enums

### Phase 2: Service & Routes

- [ ] **1.3 Create `agents.service.ts`**: Bridge class that wraps `SessionManager` from `drenyra-orchestrator`. Methods: `listSessions(filters)`, `getSession(id)`, `getTimeline(id)`, `pauseSession(id)`, `resumeSession(id)`, `cancelSession(id)`. Transforms internal `AgentSession` → `AgentSessionStatus` DTO
      **Files**: `apps/api/src/features/agents/agents.service.ts`
      **Pattern from**: `apps/api/src/features/threads/threads.service.ts` (service class + error class)
      **Acceptance**: Each method handles not-found → 404, invalid transition → 409. Tests for 3+ methods

- [ ] **1.4 Create `agents.routes.ts`**: Elysia routes with prefix `/api/agents`. 6 endpoints: GET `/sessions`, GET `/sessions/:id`, GET `/sessions/:id/timeline`, POST `/sessions/:id/pause`, POST `/sessions/:id/resume`, POST `/sessions/:id/cancel`. Uses `companyScopeGuard`, `ok()/fail()` helpers
      **Files**: `apps/api/src/features/agents/agents.routes.ts`
      **Pattern from**: `apps/api/src/features/threads/threads.routes.ts` — Elysia `.get/.post`, `handleServiceError`, `assertCompanyId`
      **Acceptance**: All 6 endpoints registered with validation schemas. Swagger `detail` tags included

- [ ] **1.5 Create `index.ts`**: Barrel export for `agentsRoutes`
      **Files**: `apps/api/src/features/agents/index.ts`
      **Pattern from**: `apps/api/src/features/threads/index.ts`
      **Acceptance**: Re-exports `agentsRoutes` from routes file

- [ ] **1.6 Register in `app-core.ts`**: Add `import { agentsRoutes }` + `.use(agentsRoutes)` registration chain
      **Files**: `apps/api/src/app-core.ts`
      **Acceptance**: Routes accessible at `/api/agents/sessions`

### Phase 3: Tests

- [ ] **1.7 Write service tests**: Vitest test file for `agents.service.ts` covering: list with filters, get session by id, get session not found (404), get timeline, pause/resume/cancel lifecycle, invalid status transition (409)
      **Files**: `apps/api/src/features/agents/__tests__/agents.service.test.ts`
      **Pattern from**: `apps/api/src/features/threads/__tests__/threads.service.test.ts`
      **Acceptance**: ≥6 test cases covering success + error paths

---

## PR 2 — Frontend: Page, Grid, Card, Filters, Store, API Client

### Phase 1: Foundation (Types, API, Store)

- [ ] **2.1 Create `agents.types.ts` (frontend)**: Mirror backend DTOs: `AgentSessionStatus`, `AgentStep`, `AgentFilters`, `PaginatedResult<AgentSessionStatus>`. Re-export from barrel
      **Files**: `apps/web/src/features/agents/agents.types.ts`
      **Pattern from**: `apps/web/src/features/threads/threads.types.ts`
      **Acceptance**: All types match backend contract; `AgentFilters` has client, period, status, risk, agentType

- [ ] **2.2 Create `agents.api.ts`**: Eden Treaty API client with `listSessions(filters)`, `getSession(id)`, `getTimeline(id)`, `pauseSession(id)`, `resumeSession(id)`, `cancelSession(id)`. All use `unwrap()` + `getGovernanceAuditHeaders()`
      **Files**: `apps/web/src/features/agents/agents.api.ts`
      **Pattern from**: `apps/web/src/features/threads/threads.api.ts`
      **Acceptance**: 6 exported async functions, each calls `api.api.agents.*` endpoints

- [ ] **2.3 Create `query-keys.ts`**: TanStack Query key factory: `agentKeys` with all, lists, list(filters), details, detail(id)
      **Files**: `apps/web/src/features/agents/query-keys.ts`
      **Pattern from**: `apps/web/src/features/threads/query-keys.ts`
      **Acceptance**: Correct key structure matching threadKeys pattern

- [ ] **2.4 Create `query-options.ts`**: `agentsListQueryOptions(filters)` with `refetchInterval: 5000` (if active sessions) and backoff retry `(attempt) => Math.min(1000 * 2 ** attempt, 10000)`
      **Files**: `apps/web/src/features/agents/query-options.ts`
      **Pattern from**: `apps/web/src/features/threads/query-options.ts`
      **Acceptance**: Polling enabled; retry with exponential backoff

- [ ] **2.5 Create `agents.store.ts`**: Zustand store: `selectedSessionId`, `gridMode ('grid'|'tabs')`, `pollingActive`, `filters` + actions: selectSession, setGridMode, setPollingActive, setFilters, resetFilters
      **Files**: `apps/web/src/features/agents/agents.store.ts`
      **Pattern from**: `apps/web/src/stores/agentic-shell.store.ts`
      **Acceptance**: Store exported; test for selectSession and setFilters

### Phase 2: Core Components

- [ ] **2.6 Create `AgentSkeleton.tsx`**: Placeholder skeleton cards for loading state (4 skeleton cards in 2×2 grid)
      **Files**: `apps/web/src/features/agents/AgentSkeleton.tsx`
      **Acceptance**: Renders 4 animated skeleton cards matching AgentCard shape

- [ ] **2.7 Create `AgentProgressBar.tsx`**: Horizontal bar with `transition-all duration-500`. Fill color by status: primary (running), warning (awaiting_approval), success (completed), danger (failed). Label with phase name. Truncate progress to [0, 100]
      **Files**: `apps/web/src/features/agents/AgentProgressBar.tsx`
      **Acceptance**: Renders bar at given percentage; color changes with status prop; phase label visible

- [ ] **2.8 Create `AgentRiskBadge.tsx`**: Badge with color mapping: low→green, medium→yellow, high→orange, critical→red+pulse. Uses `bg-${color}/10` pattern
      **Files**: `apps/web/src/features/agents/AgentRiskBadge.tsx`
      **Acceptance**: Renders correct color per risk level; critical has pulse animation class

- [ ] **2.9 Create `AgentCostDisplay.tsx`**: Shows elapsed time (`<1h: "4m 32s"`, `≥1h: "1h 12m"`) and tokens (`<1M: "12,482"`, `≥1M: "1.2M"`)
      **Files**: `apps/web/src/features/agents/AgentCostDisplay.tsx`
      **Acceptance**: Correct formatting for all boundary values

- [ ] **2.10 Create `AgentCard.tsx`**: Card component with: name+context header, AgentProgressBar, AgentRiskBadge, AgentCostDisplay, status badge, `onSelect(isSelected)` handler. States: running, awaiting_approval (border orange), completed (green), failed (red), paused (gray), critical+requiresAction (red pulse border)
      **Files**: `apps/web/src/features/agents/AgentCard.tsx`
      **Acceptance**: Renders all 6 status states; click calls onSelect; requiresAction shows orange badge

- [ ] **2.11 Create `AgentFilterBar.tsx`**: Combined filters: client (text input), period (month select), status (select), risk (select), agentType (select). Shows active filter chips + "Limpiar" button. States: loading (disabled+opacity), active (chips visible), empty ("Sin coincidencias")
      **Files**: `apps/web/src/features/agents/AgentFilterBar.tsx`
      **Acceptance**: All 5 filter controls rendered; onChange calls store setFilters; chips appear for active filters

- [ ] **2.12 Create `AgentGrid.tsx`**: Responsive grid: 2 columns (≥1024px), 1 column (<1024px). Maps sessions to AgentCard. States: loading (4×AgentSkeleton), empty ("No hay agentes" + CTA), data (grid), error (banner + "Reintentar"), filtered empty ("Sin coincidencias" + "Limpiar filtros")
      **Files**: `apps/web/src/features/agents/AgentGrid.tsx`
      **Acceptance**: All 5 states render correctly; grid resizes at breakpoints

- [ ] **2.13 Create `AgentsWindowPage.tsx`**: Page composable: AgentFilterBar + toggle (grid/tabs) + AgentGrid. Uses `agentsListQueryOptions(filters)` + Zustand store. Controls polling via `refetchInterval`. States: loading, empty, data, error
      **Files**: `apps/web/src/features/agents/AgentsWindowPage.tsx`
      **Acceptance**: Page renders all sub-components; grid/tab toggle works; polling stops when all sessions complete

### Phase 3: Route & Integration

- [ ] **2.14 Create route `agents/index.tsx`**: `createFileRoute` with `lazyRouteComponent` → `AgentsWindowPage`
      **Files**: `apps/web/src/routes/agents/index.tsx`
      **Pattern from**: `apps/web/src/routes/threads/index.tsx`
      **Acceptance**: Route registered at `/agents/`; lazy-loads AgentsWindowPage

### Phase 4: Tests

- [ ] **2.15 Write store tests**: Vitest for `agents.store.ts`: selectSession, setGridMode, setFilters, resetFilters
      **Files**: `apps/web/src/features/agents/__tests__/agents.store.test.ts`
      **Acceptance**: 4 test cases verifying all store actions

- [ ] **2.16 Write component tests**: Vitest + testing-library for AgentCard (renders each status), AgentRiskBadge (colors by level), AgentProgressBar (percentage + color), AgentCostDisplay (formatting)
      **Files**: `apps/web/src/features/agents/__tests__/AgentCard.test.tsx`, `AgentRiskBadge.test.tsx`, `AgentProgressBar.test.tsx`, `AgentCostDisplay.test.tsx`
      **Acceptance**: ≥8 test cases across 4 component files

---

## PR 3 — Frontend: Tab Panel, Timeline, Session Controls, Action Menu

### Phase 1: Detail Components

- [ ] **3.1 Create `AgentTabBar.tsx`**: Horizontal tab bar showing active session names. Active tab highlighted, click selects. Shows status indicator dot per tab
      **Files**: `apps/web/src/features/agents/AgentTabBar.tsx`
      **Acceptance**: Renders tabs for each session; click updates selectedSessionId in store

- [ ] **3.2 Create `AgentTimeline.tsx`**: Chronological list of `AgentStep[]`. Each step: status icon (check/spinner/x/dot) + label + duration. Completed steps have green connector line. Auto-scroll to running step
      **Files**: `apps/web/src/features/agents/AgentTimeline.tsx`
      **Acceptance**: Renders all steps; current step has spinner; auto-scrolls to running step

- [ ] **3.3 Create `AgentSessionControls.tsx`**: Contextual action buttons by status: running→[Pause, Cancel], paused→[Resume, Cancel], awaiting_approval→(no controls), completed→[Restart placeholder], failed→[Restart placeholder]. Calls API via agents.api.ts
      **Files**: `apps/web/src/features/agents/AgentSessionControls.tsx`
      **Acceptance**: Correct buttons per status; pause/resume calls API; shows toast on success/error

- [ ] **3.4 Create `AgentActionMenu.tsx`**: Dropdown menu: Review diff, Open evidence, Approve, Reject, Pedir sustento. Visible when `requiresAction || status === 'awaiting_approval'`. Review diff opens inspector, Open evidence opens inspector
      **Files**: `apps/web/src/features/agents/AgentActionMenu.tsx`
      **Acceptance**: Menu visible only on actionable sessions; Review diff calls `openInspector({ type: 'diff' })`; Open evidence calls `openInspector({ type: 'evidence' })`

- [ ] **3.5 Create `AgentTabPanel.tsx`**: Detailed session view: header (name, status, risk badge), AgentTimeline, AgentProgressBar, AgentCostDisplay, AgentSessionControls, AgentActionMenu. States: no selection (placeholder), loading (skeleton), data (all sections), error (panel error)
      **Files**: `apps/web/src/features/agents/AgentTabPanel.tsx`
      **Acceptance**: All 4 states render; data state shows all sub-components; no-selection shows placeholder

### Phase 2: Integration

- [ ] **3.6 Integrate tab mode in AgentsWindowPage**: Update `AgentsWindowPage.tsx` to render `AgentTabBar + AgentTabPanel` when `gridMode === 'tabs'`. Connect selectedSessionId flow
      **Files**: `apps/web/src/features/agents/AgentsWindowPage.tsx`
      **Acceptance**: Toggle switches between grid and tab view; tab panel shows selected session details

### Phase 3: Tests

- [ ] **3.7 Write component tests**: Vitest + testing-library for AgentTimeline (renders steps, auto-scroll), AgentSessionControls (correct buttons per status, API call), AgentActionMenu (visibility, inspector call), AgentTabPanel (all states)
      **Files**: `apps/web/src/features/agents/__tests__/AgentTimeline.test.tsx`, `AgentSessionControls.test.tsx`, `AgentActionMenu.test.tsx`, `AgentTabPanel.test.tsx`
      **Acceptance**: ≥8 test cases across 4 component files

## Implementation Order

1. **PR 1** must ship first — frontend depends on the API contract. Start with types, then schemas, then service, then routes, then tests.
2. **PR 2** can begin once PR 1 types stabilize — types → store → API client → query layer → skeleton → progress/risk/cost primitives → card → filter bar → grid → page → route → tests.
3. **PR 3** can begin once PR 2 provides the AgentCard and AgentsWindowPage — tab bar → timeline → controls → action menu → tab panel → integrate → tests.

## Next Step

Ready for implementation (sdd-apply). PR 1 first: API endpoints.

---

## Acceptance Report

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Tasks split into 3 chained PRs (880 est. lines) within scope of Agents Window feature. No scope widening to Plans 1, 2, 4, 5, or 6."
    }
  ],
  "changedFiles": [
    ".pi-subagents/artifacts/outputs/79cf4d2b/openspec/changes/drenyra-agents-window/tasks.md"
  ],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "mkdir -p .pi-subagents/artifacts/outputs/79cf4d2b/openspec/changes/drenyra-agents-window",
      "result": "passed",
      "summary": "Created output directory"
    }
  ],
  "validationOutput": [
    "Spec and design read and analyzed. Thread feature patterns inspected: types, routes, service, API client, query keys. Existing sidebar, inspector, and store patterns verified."
  ],
  "residualRisks": [
    "SessionManager is in-memory only — agents.service.ts bridge may return empty results until orchestrator populates sessions. This is acceptable per design decision."
  ],
  "noStagedFiles": true,
  "diffSummary": "Created tasks.md with 24 tasks split across 3 PRs: PR1 (API, 7 tasks), PR2 (frontend core, 9 tasks), PR3 (frontend panels, 8 tasks). Total ~880 est. lines across all PRs.",
  "reviewFindings": [
    "no blockers: tasks follow existing thread feature patterns throughout"
  ],
  "manualNotes": "All 3 PRs use stacked-to-main strategy. Parent should apply PR1 first via sdd-apply."
}
```
