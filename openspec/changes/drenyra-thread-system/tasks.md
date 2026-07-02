# SDD Tasks: Drenyra Thread System

**Última actualización:** 2026-07-02
**Fase:** Apply (PR2 complete)
**Plan:** F2 — Thread System
**Delivery:** auto-chain (3 PRs)

---

## PR1: Domain + Persistence (~9 files, ~350 lines)
    
### Task 1.1: Thread types and enums ✅
**File:** `packages/domain/src/entities/thread/types.ts`
**Lines:** ~40
**Depends on:** Nothing

- Export `ThreadStatus` union type: `'DRAFT' | 'ACTIVE' | 'BLOCKED' | 'PENDING_REVIEW' | 'AWAITING_INFO' | 'REVIEWED' | 'CLOSED'`
- Export `TaskStatus` union type: `'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED'`
- Export `ThreadEnvironment` union type: `'local' | 'sandbox' | 'cloud'`
- Export `ThreadPriority` union type: `'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'`
- Export `AgentRole` union type: `'PRIMARY' | 'SUPPORT' | 'REVIEWER' | 'OBSERVER'`
- Export `ThreadTaskProps` interface
- Export `ThreadAgentAssignmentProps` interface
- Export `ThreadProps` interface

### Task 1.2: Thread entity ✅
**File:** `packages/domain/src/entities/thread/thread.entity.ts`
**Lines:** ~120
**Depends on:** 1.1

- `Thread` class with private constructor
- Factory: `Thread.create(props)` — validates props via validator
- Factory: `Thread.fromPrimitives(data)` — reconstruct from DB row
- State machine methods:
  - `activate()` — DRAFT → ACTIVE (validates tasks exist)
  - `block(reason)` — ACTIVE → BLOCKED
  - `unblock()` — BLOCKED → ACTIVE
  - `submitForReview()` — ACTIVE → PENDING_REVIEW (validates all tasks done)
  - `awaitInfo()` — ACTIVE/PENDING_REVIEW → AWAITING_INFO
  - `provideInfo()` — AWAITING_INFO → PENDING_REVIEW/ACTIVE
  - `review(approved)` — PENDING_REVIEW → REVIEWED or back to ACTIVE
  - `close(userId, note?)` — REVIEWED → CLOSED
- Getters for all props (readonly)
- `toJSON()` serialization
- `canBeModified()` — not CLOSED
- `equals(other)` — compare by id

### Task 1.3: Thread validators ✅
**File:** `packages/domain/src/entities/thread/thread.validators.ts`
**Lines:** ~50
**Depends on:** 1.1

- `assertValidThreadProps(props)` — validates title length, period format, tags
- `assertValidTransition(current, target)` — validates state machine
- `assertThreadCanActivate(thread)` — at least one task
- `assertThreadCanSubmitForReview(thread)` — all tasks completed
- `assertThreadNotClosed(thread)` — guard for mutations

### Task 1.4: Thread barrel export ✅
**File:** `packages/domain/src/entities/thread/index.ts`
**Lines:** ~15
**Depends on:** 1.2, 1.3

- Re-export `Thread`, types, validators

### Task 1.5: Update domain entities index ✅
**File:** `packages/domain/src/entities/index.ts`
**Lines:** ~5 (edit)
**Depends on:** 1.4

- Add `export { Thread, ... } from './thread'`

### Task 1.6: Threads Drizzle schema ✅
**File:** `packages/persistence/src/schema/threads.schema.ts`
**Lines:** ~60
**Depends on:** Nothing

- `threads` pgTable with all columns (id UUID PK, companyId FK → companies, title, description, status, environment, period, priority, tags JSONB, createdById, closedById, closeNote, timestamps)
- Indices: company_id, status, company+status, period, priority, created_at DESC
- Relations: belongs to companies, has many tasks/agents/evidence

### Task 1.7: Thread tasks Drizzle schema ✅
**File:** `packages/persistence/src/schema/thread-tasks.schema.ts`
**Lines:** ~40
**Depends on:** 1.6

- `thread_tasks` pgTable (id, threadId FK → threads CASCADE, title, description, status, agentId, timestamps, sort_order, result_summary, evidence_ids JSONB)
- Indices: thread_id, status, agent_id

### Task 1.8: Thread agents Drizzle schema ✅
**File:** `packages/persistence/src/schema/thread-agents.schema.ts`
**Lines:** ~30
**Depends on:** 1.6

- `thread_agents` pgTable (id, threadId FK → threads CASCADE, agentId, agentName, role, assigned_at, unassigned_at, is_active)
- Indices: thread_id, agent_id, (thread_id, is_active)

### Task 1.9: Thread evidence Drizzle schema ✅
**File:** `packages/persistence/src/schema/thread-evidence.schema.ts`
**Lines:** ~25
**Depends on:** 1.6

- `thread_evidence` pgTable (id, threadId FK → threads CASCADE, evidenceId FK → evidence, linkedBy, linkedAt, note)
- Unique constraint: (thread_id, evidence_id)
- Indices: thread_id, evidence_id

### Task 1.10: Update persistence schema index ✅
**File:** `packages/persistence/src/schema/index.ts`
**Lines:** ~20 (edit)
**Depends on:** 1.7, 1.8, 1.9

- Add exports for all 4 new schemas

---

## PR2: API (~6 files, ~350 lines)

### Task 2.1: Threads service ✅
**File:** `apps/api/src/features/threads/threads.service.ts`
**Lines:** ~240
**Depends on:** 1.10

- [x] `list(companyId, filters)` — query threads with pagination, includes task counts
- [x] `getById(id)` — fetch thread with tasks, agents, evidence via relations
- [x] `create(data)` — validate, create Thread entity, INSERT thread + batch INSERT tasks
- [x] `update(id, data)` — validate, update thread fields
- [x] `updateStatus(id, status, userId?)` — fetch entity, transition, persist
- [x] `assignAgent(threadId, agentId, role)` — verify thread open, INSERT assignment
- [x] `removeAgent(threadId, agentId)` — soft-delete (set is_active = false)
- [x] `linkEvidence(threadId, evidenceId, note?)` — verify thread open, INSERT link
- [x] `unlinkEvidence(threadId, evidenceId)` — DELETE link
- [x] `closeThread(id, userId, note?)` — transition to CLOSED, set close metadata
- [x] `createTask(threadId, data)` — INSERT task
- [x] `updateTask(threadId, taskId, data)` — validate, UPDATE task

### Task 2.2: Quick actions service ✅
**File:** `apps/api/src/features/threads/quick-actions.service.ts`
**Lines:** ~50
**Depends on:** Nothing

- [x] `getForCompany(companyId, period?)` — return static quick action definitions
- [x] Quick actions: "Cerrar mes", "Conciliar bancos", "Validar SIRE compras", "Buscar riesgos fiscales"
- [x] Each action has id, title, description, icon, template (tasks to create)

### Task 2.3: Threads routes ✅
**File:** `apps/api/src/features/threads/threads.routes.ts`
**Lines:** ~260
**Depends on:** 2.1, 2.2

- [x] All 12 endpoints with Elysia validation schemas
- [x] Company scope guard on all endpoints
- [x] Proper error responses using `fail()` / `ok()` helpers
- [x] Elysia `t` schemas for request body validation

### Task 2.4: Threads feature barrel ✅
**File:** `apps/api/src/features/threads/index.ts`
**Lines:** ~1
**Depends on:** 2.3

- [x] Re-export `threadRoutes`

### Task 2.5: Register threads module in app-core ✅
**File:** `apps/api/src/app-core.ts`
**Lines:** ~3 (edit)
**Depends on:** 2.4

- [x] Import and `.use(threadRoutes)` in the app

### Task 2.6: Add thread error codes ✅
**File:** `apps/api/src/shared/error-codes.ts`
**Lines:** ~20 (new file)
**Depends on:** Nothing

- [x] Add all thread error codes

### Task 2.7: Service unit tests ✅
**File:** `apps/api/src/features/threads/__tests__/threads.service.test.ts`
**Lines:** ~280
**Depends on:** 2.1

- [x] Mock DB, test CRUD, state transitions, error cases
- [x] getById tests (detail, not found)
- [x] create test
- [x] updateStatus tests (DRAFT→ACTIVE, DRAFT→CLOSED rejects, REVIEWED→CLOSED)
- [x] assignAgent tests (success, already closed)
- [x] removeAgent test
- [x] linkEvidence tests (success, unique violation)
- [x] createTask test
- [x] QuickActionsService tests

---

## PR3: UI (~10 files, ~400 lines)

### Task 3.1: Thread types (frontend) ✅
**File:** `apps/web/src/features/threads/threads.types.ts`
**Lines:** ~40
**Depends on:** Nothing

- [x] Mirror domain types for frontend: `ThreadSummary`, `ThreadDetail`, `ThreadTask`, `ThreadAgentAssignment`, `QuickAction`, `CreateThreadPayload`, etc.

### Task 3.2: Thread API client ✅
**File:** `apps/web/src/features/threads/threads.api.ts`
**Lines:** ~60
**Depends on:** 3.1

- [x] `listThreads(params)` → GET /api/threads
- [x] `getThread(id)` → GET /api/threads/:id
- [x] `createThread(data)` → POST /api/threads
- [x] `updateThread(id, data)` → PATCH /api/threads/:id
- [x] `assignAgent(threadId, data)` → POST /api/threads/:id/agents
- [x] `removeAgent(threadId, agentId)` → DELETE ...
- [x] `linkEvidence(threadId, data)` → POST /api/threads/:id/evidence
- [x] `unlinkEvidence(threadId, evidenceId)` → DELETE ...
- [x] `closeThread(id, data)` → POST /api/threads/:id/close
- [x] `createTask(threadId, data)` → POST /api/threads/:id/tasks
- [x] `updateTask(threadId, taskId, data)` → PATCH ...
- [x] `getQuickActions(companyId, period?)` → GET /api/threads/quick-actions

### Task 3.3: ThreadCreatePage ("Let's Close") ✅
**File:** `apps/web/src/features/threads/ThreadCreatePage.tsx`
**Lines:** ~100
**Depends on:** 3.2

- [x] Page with "Let's close" heading
- [x] EnvironmentSelector component
- [x] QuickActionGrid with 4 quick actions
- [x] ThreadCreateForm (title, period, tasks)
- [ ] Uses `AgenticCommandBar` from Plan 1 — not implemented yet in codebase
- [x] Navigation to `/threads/$id` after creation

### Task 3.4: QuickActionButton ✅
**File:** `apps/web/src/features/threads/QuickActionButton.tsx`
**Lines:** ~30
**Depends on:** Nothing

- [x] Card button with icon, title, description
- [x] Click creates thread from template
- [x] Loading state while creating

### Task 3.5: EnvironmentSelector ✅
**File:** `apps/web/src/features/threads/EnvironmentSelector.tsx`
**Lines:** ~25
**Depends on:** Nothing

- [x] Toggle group: local / sandbox / cloud
- [x] Visual indicator for current selection

### Task 3.6: ThreadDetailPage ✅
**File:** `apps/web/src/features/threads/ThreadDetailPage.tsx`
**Lines:** ~100
**Depends on:** 3.2

- [x] Thread header with status badge
- [x] Tabs: Tasks, Agents, Evidence, Timeline
- [x] TaskList with status and update actions
- [x] AgentList with assign action
- [x] EvidenceList with link action
- [x] Close thread action

### Task 3.7: ThreadList ✅
**File:** `apps/web/src/features/threads/ThreadList.tsx`
**Lines:** ~60
**Depends on:** 3.2

- [x] Search + filters (status, period, priority)
- [x] Grid of ThreadCards
- [x] Loading, empty, error states

### Task 3.8: Update thread routes ✅
**File:** `apps/web/src/routes/threads/$threadId.tsx` (new)
**File:** `apps/web/src/routes/threads/index.tsx` (new)
**Lines:** ~15 (2 files)
**Depends on:** 3.6, 3.7

- [x] Register route files for `/threads/` and `/threads/$threadId`
- [ ] No `routes/threads/new.tsx` exists yet — skipped as instructed

### Task 3.9: Regenerate route tree ✅
**File:** `apps/web/src/routeTree.gen.ts`
**Lines:** auto
**Depends on:** 3.8

- [x] Run vite build to regenerate route tree

---

## Dependency Graph

```text
PR1 ──────────────────────────────────┐
  ├── 1.1 types.ts                     │
  ├── 1.2 thread.entity.ts ← 1.1      │
  ├── 1.3 thread.validators.ts ← 1.1   │
  ├── 1.4 index.ts ← 1.2, 1.3         │
  ├── 1.5 entities/index.ts ← 1.4     │
  ├── 1.6 threads.schema.ts           │
  ├── 1.7 thread-tasks.schema.ts ← 1.6│
  ├── 1.8 thread-agents.schema.ts ← 1.6│
  ├── 1.9 thread-evidence.schema.ts ← 1.6│
  └── 1.10 schema/index.ts ← 1.7-1.9  │
                                       │
PR2 ──────────────────────────────────┤
  ├── 2.1 threads.service.ts ← 1.10   │
  ├── 2.2 quick-actions.service.ts     │
  ├── 2.3 threads.routes.ts ← 2.1, 2.2│
  ├── 2.4 index.ts ← 2.3             │
  ├── 2.5 app-core.ts ← 2.4          │
  ├── 2.6 error-codes.ts             │
  └── 2.7 threads.service.test.ts ← 2.1│
                                       │
PR3 ──────────────────────────────────┤
  ├── 3.1 threads.types.ts            │
  ├── 3.2 threads.api.ts ← 3.1        │
  ├── 3.3 ThreadCreatePage.tsx ← 3.2  │
  ├── 3.4 QuickActionButton.tsx       │
  ├── 3.5 EnvironmentSelector.tsx     │
  ├── 3.6 ThreadDetailPage.tsx ← 3.2  │
  ├── 3.7 ThreadList.tsx ← 3.2       │
  ├── 3.8 route files ← 3.6, 3.7     │
  └── 3.9 codegen ← 3.8              │
```

---

## Estimated Total: ~1,100 lines

| PR | Files | Lines |
|----|-------|-------|
| PR1 | 10 | ~410 |
| PR2 | 7 | ~380 |
| PR3 | 12 | ~435 |
