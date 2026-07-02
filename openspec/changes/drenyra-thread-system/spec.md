# SDD Spec: Drenyra Thread System

**Última actualización:** 2026-07-02
**Fase:** Spec
**Plan:** F2 — Thread System

---

## 1. Domain Model

### 1.1 Thread Entity

The `Thread` entity represents a unit of accounting work — a session where agents execute tasks to achieve a fiscal goal.

**File:** `packages/domain/src/entities/thread/thread.entity.ts`

```typescript
interface ThreadProps {
  id: string;
  companyId: string;
  title: string;
  description?: string;
  status: ThreadStatus;
  environment: ThreadEnvironment;
  period?: string; // e.g. "2026-06"
  priority: ThreadPriority;
  tags: string[];
  tasks: ThreadTask[];
  agentAssignments: ThreadAgentAssignment[];
  evidenceIds: string[];
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  closedById?: string;
  closeNote?: string;
}
```

**State Machine:**

```
DRAFT → ACTIVE → PENDING_REVIEW → REVIEWED → CLOSED
         ↓           ↓
    BLOCKED      AWAITING_INFO
         ↓           ↓
       ACTIVE    PENDING_REVIEW
```

- `DRAFT`: Initial state, editable
- `ACTIVE`: Agents are working on it
- `BLOCKED`: Blocked waiting on external info
- `PENDING_REVIEW`: All tasks done, awaiting human review
- `AWAITING_INFO`: Waiting for user to provide info
- `REVIEWED`: Human reviewed and approved
- `CLOSED`: Archived, no more changes

**Invariants:**
1. A closed thread cannot be reopened (create new instead)
2. At least one task must exist before transitioning to ACTIVE
3. All tasks must be completed before transitioning to PENDING_REVIEW
4. EvidenceIds can only be added when status is ACTIVE or PENDING_REVIEW
5. `period` must match pattern `^\d{4}-(0[1-9]|1[0-2])$` when provided

### 1.2 ThreadTask Value Object

```typescript
interface ThreadTaskProps {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  agentId?: string; // assigned agent
  assignedAt?: Date;
  completedAt?: Date;
  completedById?: string;
  resultSummary?: string;
  evidenceIds: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

type TaskStatus = 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
```

### 1.3 ThreadAgentAssignment Value Object

```typescript
interface ThreadAgentAssignmentProps {
  threadId: string;
  agentId: string;
  agentName: string;
  role: AgentRole;
  assignedAt: Date;
  unassignedAt?: Date;
  isActive: boolean;
}

type AgentRole = 'PRIMARY' | 'SUPPORT' | 'REVIEWER' | 'OBSERVER';
```

### 1.4 ThreadStatus Enum

```typescript
type ThreadStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'BLOCKED'
  | 'PENDING_REVIEW'
  | 'AWAITING_INFO'
  | 'REVIEWED'
  | 'CLOSED';
```

### 1.5 ThreadEnvironment

```typescript
type ThreadEnvironment = 'local' | 'sandbox' | 'cloud';
```

### 1.6 ThreadPriority

```typescript
type ThreadPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
```

---

## 2. Persistence Schema

### 2.1 `threads` Table

```sql
-- File: packages/persistence/src/schema/threads.schema.ts

threads:
  id                        UUID PK DEFAULT gen_random_uuid()
  company_id                UUID NOT NULL → companies.id
  title                     TEXT NOT NULL
  description               TEXT
  status                    VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
  environment               VARCHAR(20) NOT NULL DEFAULT 'local'
  period                    VARCHAR(7)  -- "2026-06"
  priority                  VARCHAR(10) NOT NULL DEFAULT 'MEDIUM'
  tags                      JSONB DEFAULT '[]'  -- string[]
  created_by_id             UUID → auth_users.id
  closed_by_id              UUID → auth_users.id
  close_note                TEXT
  created_at                TIMESTAMPTZ DEFAULT NOW()
  updated_at                TIMESTAMPTZ DEFAULT NOW()
  closed_at                 TIMESTAMPTZ

Indices:
  - idx_threads_company_id ON company_id
  - idx_threads_status ON status
  - idx_threads_company_status ON (company_id, status)
  - idx_threads_period ON period
  - idx_threads_priority ON priority
  - idx_threads_created_at ON created_at DESC
```

### 2.2 `thread_tasks` Table

```sql
-- File: packages/persistence/src/schema/thread-tasks.schema.ts

thread_tasks:
  id                        UUID PK DEFAULT gen_random_uuid()
  thread_id                 UUID NOT NULL → threads.id (CASCADE delete)
  title                     TEXT NOT NULL
  description               TEXT
  status                    VARCHAR(20) NOT NULL DEFAULT 'PENDING'
  agent_id                  UUID → ai_agents.id
  assigned_at               TIMESTAMPTZ
  completed_at              TIMESTAMPTZ
  completed_by_id           UUID → auth_users.id
  result_summary            TEXT
  evidence_ids              JSONB DEFAULT '[]'
  sort_order                INTEGER NOT NULL DEFAULT 0
  created_at                TIMESTAMPTZ DEFAULT NOW()
  updated_at                TIMESTAMPTZ DEFAULT NOW()

Indices:
  - idx_thread_tasks_thread_id ON thread_id
  - idx_thread_tasks_status ON status
  - idx_thread_tasks_agent_id ON agent_id
```

### 2.3 `thread_agents` Table

```sql
-- File: packages/persistence/src/schema/thread-agents.schema.ts

thread_agents:
  id                        UUID PK DEFAULT gen_random_uuid()
  thread_id                 UUID NOT NULL → threads.id (CASCADE delete)
  agent_id                  UUID NOT NULL → ai_agents.id
  agent_name                TEXT NOT NULL
  role                      VARCHAR(20) NOT NULL DEFAULT 'PRIMARY'
  assigned_at               TIMESTAMPTZ DEFAULT NOW()
  unassigned_at             TIMESTAMPTZ
  is_active                 BOOLEAN DEFAULT TRUE

Indices:
  - idx_thread_agents_thread_id ON thread_id
  - idx_thread_agents_agent_id ON agent_id
  - idx_thread_agents_active ON (thread_id, is_active)
```

### 2.4 `thread_evidence` Table

```sql
-- File: packages/persistence/src/schema/thread-evidence.schema.ts

thread_evidence:
  id                        UUID PK DEFAULT gen_random_uuid()
  thread_id                 UUID NOT NULL → threads.id (CASCADE delete)
  evidence_id               UUID NOT NULL → evidence.id
  linked_by                 UUID → auth_users.id
  linked_at                 TIMESTAMPTZ DEFAULT NOW()
  note                      TEXT

Indices:
  - idx_thread_evidence_thread_id ON thread_id
  - idx_thread_evidence_evidence_id ON evidence_id
  UNIQUE (thread_id, evidence_id)
```

### 2.5 Relations

```typescript
// threads → companies (many:one)
// threads → thread_tasks (one:many, CASCADE)
// threads → thread_agents (one:many, CASCADE)
// threads → thread_evidence (one:many, CASCADE)
```

---

## 3. API Contracts

### 3.1 `GET /api/threads`

List threads for a company.

**Query params:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| companyId | string | yes | Company scope |
| status | string | no | Filter by status |
| period | string | no | Filter by period |
| priority | string | no | Filter by priority |
| search | string | no | Text search in title |
| limit | number | no | Default 20, max 100 |
| offset | number | no | Default 0 |

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "companyId": "uuid",
      "title": "Cierre Jun 2026",
      "status": "ACTIVE",
      "environment": "local",
      "period": "2026-06",
      "priority": "HIGH",
      "tags": ["cierre", "igv"],
      "taskCount": 5,
      "completedTaskCount": 2,
      "agentCount": 3,
      "lastActivityAt": "2026-07-02T12:00:00Z",
      "createdAt": "2026-07-01T08:00:00Z"
    }
  ],
  "total": 12,
  "limit": 20,
  "offset": 0
}
```

### 3.2 `POST /api/threads`

Create a new thread.

**Body:**
```json
{
  "companyId": "uuid",
  "title": "Cierre Jun 2026",
  "description": "Cierre mensual de Andrés SAC",
  "environment": "local",
  "period": "2026-06",
  "priority": "HIGH",
  "tags": ["cierre", "igv"],
  "tasks": [
    { "title": "Validar SIRE compras", "order": 1 },
    { "title": "Conciliar BCP", "order": 2 },
    { "title": "Preparar declaración IGV", "order": 3 }
  ]
}
```

**Response `201`:**
```json
{
  "data": {
    "id": "uuid",
    "companyId": "uuid",
    "title": "Cierre Jun 2026",
    "status": "DRAFT",
    "createdAt": "2026-07-02T13:00:00Z"
  }
}
```

### 3.3 `GET /api/threads/:id`

Get full thread detail with tasks, agents, and evidence.

**Response `200`:**
```json
{
  "data": {
    "id": "uuid",
    "companyId": "uuid",
    "title": "Cierre Jun 2026",
    "description": "Cierre mensual...",
    "status": "ACTIVE",
    "environment": "local",
    "period": "2026-06",
    "priority": "HIGH",
    "tags": ["cierre"],
    "tasks": [
      {
        "id": "uuid",
        "title": "Validar SIRE compras",
        "status": "COMPLETED",
        "agentId": "uuid",
        "completedAt": "2026-07-02T10:00:00Z",
        "resultSummary": "Validación exitosa"
      }
    ],
    "agents": [
      {
        "agentId": "uuid",
        "agentName": "SIRE Agent",
        "role": "PRIMARY",
        "isActive": true
      }
    ],
    "evidenceIds": ["uuid"],
    "createdById": "uuid",
    "createdAt": "2026-07-01T08:00:00Z",
    "updatedAt": "2026-07-02T12:00:00Z"
  }
}
```

### 3.4 `PATCH /api/threads/:id`

Update thread properties.

**Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "ACTIVE",
  "priority": "URGENT",
  "tags": ["cierre", "igv", "urgente"]
}
```

**Response `200`:** Updated thread object.

### 3.5 `POST /api/threads/:id/agents`

Assign an agent to the thread.

**Body:**
```json
{
  "agentId": "uuid",
  "agentName": "SIRE Agent",
  "role": "PRIMARY"
}
```

**Response `200`:** Agent assignment object.

### 3.6 `DELETE /api/threads/:id/agents/:agentId`

Remove an agent from the thread.

**Response `204`:** No content.

### 3.7 `POST /api/threads/:id/evidence`

Link evidence to the thread.

**Body:**
```json
{
  "evidenceId": "uuid",
  "note": "CDR de factura F001-123"
}
```

**Response `200`:** Thread-evidence link object.

### 3.8 `DELETE /api/threads/:id/evidence/:evidenceId`

Unlink evidence from the thread.

**Response `204`:** No content.

### 3.9 `POST /api/threads/:id/close`

Close a thread.

**Body:**
```json
{
  "closeNote": "Cierre de mes completado exitosamente"
}
```

**Response `200`:** Closed thread object.

### 3.10 `POST /api/threads/:id/tasks`

Create a task within a thread.

**Body:**
```json
{
  "title": "Revisar detracciones",
  "description": "Validar detracciones pendientes",
  "order": 4
}
```

**Response `201`:** Task object.

### 3.11 `PATCH /api/threads/:id/tasks/:taskId`

Update a task.

**Body:**
```json
{
  "status": "COMPLETED",
  "resultSummary": "Revisión completada sin incidencias",
  "completedById": "uuid"
}
```

**Response `200`:** Updated task object.

### 3.12 `GET /api/threads/quick-actions`

Get contextual quick actions based on company and period.

**Query params:** `companyId` (required), `period` (optional)

**Response `200`:**
```json
{
  "data": [
    {
      "id": "quick-close-month",
      "title": "Cerrar mes",
      "description": "Iniciar cierre mensual completo",
      "icon": "calendar-check",
      "template": {
        "title": "Cierre {period}",
        "priority": "HIGH",
        "tags": ["cierre"],
        "tasks": [
          { "title": "Validar SIRE compras", "order": 1 },
          { "title": "Conciliar bancos", "order": 2 },
          { "title": "Preparar declaración IGV", "order": 3 },
          { "title": "Cerrar mes", "order": 4 }
        ]
      }
    },
    {
      "id": "quick-reconcile-banks",
      "title": "Conciliar bancos",
      "description": "Conciliar movimientos bancarios del período",
      "icon": "landmark",
      "template": {
        "title": "Conciliación bancaria {period}",
        "priority": "MEDIUM",
        "tags": ["conciliacion", "bancos"],
        "tasks": [
          { "title": "Importar movimientos bancarios", "order": 1 },
          { "title": "Conciliar transacciones", "order": 2 },
          { "title": "Revisar diferencias", "order": 3 }
        ]
      }
    },
    {
      "id": "quick-validate-sire",
      "title": "Validar SIRE compras",
      "description": "Revisar y validar compras en SIRE",
      "icon": "file-search",
      "template": {
        "title": "Validación SIRE compras {period}",
        "priority": "MEDIUM",
        "tags": ["sire", "compras"],
        "tasks": [
          { "title": "Descargar libro de compras SIRE", "order": 1 },
          { "title": "Validar consistencia", "order": 2 },
          { "title": "Reportar discrepancias", "order": 3 }
        ]
      }
    }
  ]
}
```

---

## 4. Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `THREAD_NOT_FOUND` | 404 | Thread not found |
| `THREAD_INVALID_TRANSITION` | 409 | Invalid status transition |
| `THREAD_NO_TASKS` | 422 | Cannot activate thread without tasks |
| `THREAD_TASKS_INCOMPLETE` | 422 | Cannot review thread with incomplete tasks |
| `THREAD_ALREADY_CLOSED` | 409 | Thread is already closed |
| `THREAD_EVIDENCE_ALREADY_LINKED` | 409 | Evidence already linked to this thread |
| `THREAD_COMPANY_MISMATCH` | 403 | Company scope mismatch |
| `THREAD_INVALID_PERIOD` | 422 | Period format invalid |

---

## 5. UI Component Specifications

### 5.1 ThreadCreatePage ("Let's Close")

**Route:** `/threads/new`
**Purpose:** Landing page for creating new threads

**Components:**
- `QuickActionGrid` — 2×2 or 3×2 grid of contextual quick actions
- `EnvironmentSelector` — Toggle between local/sandbox/cloud
- `ThreadCreateForm` — Manual thread creation with title, period, tasks
- `AgenticCommandBar` — Already built in Plan 1, contextual to thread creation

**States:**
- Loading: Skeleton grid
- Empty: No quick actions available (no company selected)
- Data: Grid of quick actions + create form
- Error: Error creating thread (with retry)

### 5.2 ThreadDetailPage

**Route:** `/threads/$threadId`
**Purpose:** View and manage a single thread

**Components:**
- `ThreadHeader` — Title, status badge, priority, environment, period
- `ThreadTimeline` — Chronological event list (created, agent assigned, task completed, etc.)
- `TaskList` — Ordered list of tasks with status, assignee, actions
- `AgentList` — Assigned agents with roles and status
- `EvidenceList` — Linked evidence items
- `ThreadActions` — Close, assign agent, link evidence

**States:**
- Loading: Full-page skeleton
- Active: Thread with tasks, agents, evidence
- Closed: Archived view with close note and timestamp
- Error: Error loading thread (with retry)
- Not found: 404 state

### 5.3 ThreadList

**Route:** `/threads` or sidebar widget
**Purpose:** List active threads for current company

**Components:**
- `ThreadCard` — Card with status indicator, title, progress bar, last activity
- `ThreadFilters` — Filter by status, period, priority
- `ThreadSearch` — Search by title

**States:**
- Loading: Card skeletons
- Empty: "No threads yet" with CTA to create
- Data: List of thread cards with pagination
- Error: Error loading threads (with retry)

### 5.4 QuickActionButton

**Props:**
- `action`: QuickAction definition (icon, title, description, template)
- `onClick`: Creates thread from template
- `disabled`: When company not selected

### 5.5 EnvironmentSelector

**Props:**
- `value`: Current environment
- `onChange`: Callback on change
- `disabled`: When thread is active

---

## 6. Validation Rules

### Domain validation (Thread entity)

| Field | Rule |
|-------|------|
| id | Required, valid UUID |
| companyId | Required, valid UUID |
| title | Required, 1-200 chars |
| description | Optional, max 2000 chars |
| status | Must be valid ThreadStatus |
| environment | Must be valid ThreadEnvironment |
| period | Optional, must match YYYY-MM |
| priority | Must be valid ThreadPriority |
| tags | Optional, each tag 1-50 chars, max 10 tags |

### API validation (Elysia)

- All body params validated via Elysia `t` schemas
- `companyId` validated via company scope guard
- UUID params validated as UUID format
- Pagination params: limit 1-100, offset 0+

---

## 7. Files to Create

### PR1: Domain + Persistence (8 files, ~350 lines)

| # | File | Purpose |
|---|------|---------|
| 1 | `packages/domain/src/entities/thread/thread.entity.ts` | Thread entity with state machine |
| 2 | `packages/domain/src/entities/thread/thread-task.ts` | ThreadTask value object |
| 3 | `packages/domain/src/entities/thread/thread-agent-assignment.ts` | ThreadAgentAssignment value object |
| 4 | `packages/domain/src/entities/thread/types.ts` | Thread types and enums |
| 5 | `packages/domain/src/entities/thread/index.ts` | Barrel exports |
| 6 | `packages/persistence/src/schema/threads.schema.ts` | Threads Drizzle schema |
| 7 | `packages/persistence/src/schema/thread-tasks.schema.ts` | Thread tasks Drizzle schema |
| 8 | `packages/persistence/src/schema/thread-agents.schema.ts` | Thread agents Drizzle schema |
| 9 | `packages/persistence/src/schema/thread-evidence.schema.ts` | Thread evidence link Drizzle schema |

### PR2: API (6 files, ~350 lines)

| # | File | Purpose |
|---|------|---------|
| 1 | `apps/api/src/features/threads/threads.routes.ts` | All thread API routes |
| 2 | `apps/api/src/features/threads/threads.service.ts` | Thread business logic |
| 3 | `apps/api/src/features/threads/quick-actions.service.ts` | Quick actions generation |
| 4 | `apps/api/src/features/threads/index.ts` | Barrel exports |
| 5 | `apps/api/src/features/shared/error-codes.ts` | Update with thread error codes |
| 6 | `apps/api/src/features/threads/__tests__/threads.service.test.ts` | Service tests |

### PR3: UI (10 files, ~400 lines)

| # | File | Purpose |
|---|------|---------|
| 1 | `apps/web/src/routes/threads/new.tsx` | Thread create route (exists, update) |
| 2 | `apps/web/src/routes/threads/$threadId.tsx` | Thread detail route |
| 3 | `apps/web/src/routes/threads/index.tsx` | Thread list route |
| 4 | `apps/web/src/features/threads/ThreadCreatePage.tsx` | "Let's Close" page |
| 5 | `apps/web/src/features/threads/ThreadDetailPage.tsx` | Thread detail page |
| 6 | `apps/web/src/features/threads/ThreadList.tsx` | Thread list component |
| 7 | `apps/web/src/features/threads/QuickActionButton.tsx` | Quick action components |
| 8 | `apps/web/src/features/threads/EnvironmentSelector.tsx` | Environment selector |
| 9 | `apps/web/src/features/threads/threads.api.ts` | API client |
| 10 | `apps/web/src/features/threads/threads.types.ts` | TypeScript types for thread UI |
