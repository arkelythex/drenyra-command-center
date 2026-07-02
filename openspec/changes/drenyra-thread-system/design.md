# SDD Design: Drenyra Thread System

**Última actualización:** 2026-07-02
**Fase:** Design
**Plan:** F2 — Thread System

---

## 1. Architecture Overview

### Layer Architecture

```
┌────────────────────────────────────────────────────┐
│                    Web App (React 19)               │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │ Thread   │  │ Thread   │  │ ThreadCreate    │  │
│  │ List     │  │ Detail   │  │ (Let's Close)   │  │
│  └────┬─────┘  └────┬─────┘  └────────┬────────┘  │
│       │              │                 │           │
│  ┌────▼──────────────▼─────────────────▼────────┐  │
│  │            threads.api.ts                     │  │
│  └────────────────────┬────────────────────────┘  │
└───────────────────────┼───────────────────────────┘
                        │ HTTP
┌───────────────────────┼───────────────────────────┐
│              API Layer (ElysiaJS)                  │
│  ┌────────────────────▼────────────────────────┐  │
│  │        threads.routes.ts                      │  │
│  │  ┌──────────┐  ┌────────────┐  ┌─────────┐  │  │
│  │  │ List     │  │ CRUD       │  │ Agents  │  │  │
│  │  │ Queries  │  │ Operations │  │ Evidence│  │  │
│  │  └──────────┘  └─────┬──────┘  └─────────┘  │  │
│  └──────────────────────┼───────────────────────┘  │
│                         │                          │
│  ┌──────────────────────▼───────────────────────┐  │
│  │        threads.service.ts                      │  │
│  └──────────────────────┬───────────────────────┘  │
└─────────────────────────┼─────────────────────────┘
                          │
┌─────────────────────────┼─────────────────────────┐
│              Persistence Layer (Drizzle)           │
│  ┌──────────────────────▼───────────────────────┐  │
│  │  threads.schema.ts │ thread-tasks.schema.ts   │  │
│  │  thread-agents.schema.ts │ thread-evidence... │  │
│  └──────────────────────┬───────────────────────┘  │
└─────────────────────────┼─────────────────────────┘
                          │
┌─────────────────────────┼─────────────────────────┐
│              Domain Layer                          │
│  ┌──────────────────────▼───────────────────────┐  │
│  │  Thread entity │ ThreadTask │                │  │
│  │  ThreadAgentAssignment │ types                │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

---

## 2. Data Flow

### Thread Creation Flow

```
User clicks QuickAction
  → QuickActionButton.onClick()
  → ThreadCreatePage creates thread form data
  → threads.api.createThread(data)
  → POST /api/threads
  → threads.service.ts:
      1. Validate company scope (companyScopeGuard)
      2. Create Thread entity (DRAFT)
      3. Create ThreadTask VOs from body tasks
      4. Validate invariants
      5. INSERT into threads
      6. INSERT into thread_tasks (batch)
      7. Return thread with id
  → Navigate to /threads/$threadId
```

### Thread Status Transition Flow

```
PATCH /api/threads/:id { status: "ACTIVE" }
  → threads.service.updateStatus(id, "ACTIVE"):
      1. Fetch thread from DB
      2. Thread entity validate transition: DRAFT → ACTIVE
      3. Validate invariant: at least one task exists
      4. Call thread.activate() (returns new Thread)
      5. UPDATE threads SET status = 'ACTIVE', updated_at = NOW()
      6. Return updated thread
```

### Agent Assignment Flow

```
POST /api/threads/:id/agents { agentId, role }
  → threads.service.assignAgent(threadId, agentId, role):
      1. Verify thread exists and is not CLOSED
      2. Create ThreadAgentAssignment VO
      3. INSERT into thread_agents
      4. Return assignment
```

---

## 3. Route Configuration

### API Routes

```typescript
const threadRoutes = new Elysia({ prefix: '/api/threads' })
  .use(companyScopeGuard())

  // Thread CRUD
  .get('/',           listThreads)
  .post('/',          createThread)
  .get('/:id',        getThread)
  .patch('/:id',      updateThread)

  // Agent management
  .post('/:id/agents',             assignAgent)
  .delete('/:id/agents/:agentId',  removeAgent)

  // Evidence linking
  .post('/:id/evidence',            linkEvidence)
  .delete('/:id/evidence/:evidenceId', unlinkEvidence)

  // Task management
  .post('/:id/tasks',             createTask)
  .patch('/:id/tasks/:taskId',    updateTask)

  // Close
  .post('/:id/close', closeThread)

  // Quick actions
  .get('/quick-actions', getQuickActions)
```

### Web Routes

```typescript
// /threads → ThreadList
// /threads/new → ThreadCreatePage (existing, update)
// /threads/$threadId → ThreadDetailPage
```

---

## 4. Component Tree

### ThreadCreatePage (route: `/threads/new`)

```tsx
<AgenticLayout>
  <main className="flex flex-col gap-6 p-6">
    <header>
      <h1>Let's close</h1>
      <EnvironmentSelector />
    </header>

    <QuickActionGrid>
      <QuickActionButton action={...} />
      <QuickActionButton action={...} />
      <QuickActionButton action={...} />
      <QuickActionButton action={...} />
    </QuickActionGrid>

    <Separator />

    <ThreadCreateForm onSubmit={handleCreate} />
  </main>
</AgenticLayout>
```

### ThreadDetailPage (route: `/threads/$threadId`)

```tsx
<AgenticLayout>
  <main className="flex flex-col gap-4 p-4">
    <ThreadHeader thread={thread} />

    <Tabs defaultValue="tasks">
      <TabsList>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="agents">Agents</TabsTrigger>
        <TabsTrigger value="evidence">Evidence</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
      </TabsList>

      <TabsContent value="tasks">
        <TaskList tasks={tasks} onUpdate={handleTaskUpdate} />
      </TabsContent>
      <TabsContent value="agents">
        <AgentList agents={agents} onAssign={handleAssignAgent} />
      </TabsContent>
      <TabsContent value="evidence">
        <EvidenceList evidence={evidence} onLink={handleLinkEvidence} />
      </TabsContent>
      <TabsContent value="timeline">
        <ThreadTimeline events={timeline} />
      </TabsContent>
    </Tabs>

    <ThreadActions
      onClose={handleClose}
      onAssignAgent={handleAssignAgent}
      onLinkEvidence={handleLinkEvidence}
    />
  </main>
</AgenticLayout>
```

### ThreadList (route: `/threads`)

```tsx
<AgenticLayout>
  <main className="flex flex-col gap-4 p-4">
    <header className="flex justify-between items-center">
      <h1>Threads</h1>
      <Button onClick={() => navigate('/threads/new')}>
        New Thread
      </Button>
    </header>

    <ThreadFilters
      status={filters.status}
      period={filters.period}
      onChange={setFilters}
    />

    <ThreadSearch value={search} onChange={setSearch} />

    <div className="grid gap-3">
      {threads.map(thread => (
        <ThreadCard
          key={thread.id}
          thread={thread}
          onClick={() => navigate(`/threads/${thread.id}`)}
        />
      ))}
    </div>
  </main>
</AgenticLayout>
```

---

## 5. API Service Structure

### threads.service.ts

```typescript
export class ThreadsService {
  constructor(private db: DrizzleDB) {}

  async list(companyId: string, filters: ThreadFilters): Promise<PaginatedResult<ThreadSummary>>
  async getById(id: string): Promise<ThreadDetail>
  async create(data: CreateThreadData): Promise<ThreadSummary>
  async update(id: string, data: UpdateThreadData): Promise<ThreadSummary>
  async updateStatus(id: string, status: ThreadStatus): Promise<ThreadSummary>
  async assignAgent(threadId: string, data: AssignAgentData): Promise<AgentAssignment>
  async removeAgent(threadId: string, agentId: string): Promise<void>
  async linkEvidence(threadId: string, evidenceId: string, note?: string): Promise<void>
  async unlinkEvidence(threadId: string, evidenceId: string): Promise<void>
  async closeThread(id: string, userId: string, note?: string): Promise<ThreadSummary>
  async createTask(threadId: string, data: CreateTaskData): Promise<ThreadTask>
  async updateTask(threadId: string, taskId: string, data: UpdateTaskData): Promise<ThreadTask>
}
```

### quick-actions.service.ts

```typescript
export class QuickActionsService {
  async getForCompany(companyId: string, period?: string): Promise<QuickAction[]>
}
```

Returns predefined quick actions for the company. No DB lookups — static definitions that use company context (period) to fill templates.

---

## 6. T3 Env / Feature Flag

Add a feature flag for the thread system:

```typescript
// packages/shared/src/feature-flags.ts
export const featureFlags = {
  threadSystem: false, // Toggle when ready
  // ...
};
```

API and web routes should check this flag. For now, we'll implement without the flag since Plan 1 is complete and this is the next step.

---

## 7. MCP / Drizzle Migrations

After creating schema files, generate migration:

```bash
bun run db:generate
bun run db:migrate
```

The migration file will be auto-generated by Drizzle Kit.

---

## 8. Testing Strategy

### Domain Tests (thread.entity.spec.ts)
- Create thread in DRAFT state
- Transition through valid states
- Reject invalid transitions
- Validate invariants (tasks required for ACTIVE, all tasks done for PENDING_REVIEW)
- ThreadTask creation and status changes

### Service Tests (threads.service.test.ts)
- CRUD operations
- Company scope enforcement
- Status transition logic
- Agent assignment lifecycle
- Evidence linking/unlinking
- Error cases (not found, already closed, invalid transition)

### API Integration Tests (E2E via Playwright)
- Create thread via API
- List threads with filters
- Full lifecycle: create → activate → complete tasks → review → close
- Error responses

### UI Tests
- ThreadCreatePage renders quick actions
- ThreadList shows threads
- ThreadDetailPage shows thread info
- Navigation between thread routes works

---

## 9. Migration

No data migration needed — this is a new feature with no existing threads. The new tables are additive.
