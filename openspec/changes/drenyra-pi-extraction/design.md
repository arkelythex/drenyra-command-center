# Design: Drenyra Pi — Arquitectura detallada

**Estado:** Working Draft · **Fecha:** 2026-07-07  
**Change:** `drenyra-pi-extraction`  
**Basado en:** [Spec](./spec.md)

---

## 1. Diagrama de componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                        MONOREPO DRENYRA                          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   apps/web   │  │   apps/api   │  │     apps/cli (TS)    │   │
│  │   (React)    │  │  (ElysiaJS)  │  │  (Commander + Ink)   │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
│         │                 │                      │               │
│         │         ┌───────┴───────┐              │               │
│         │         │               │              │               │
│         │    ┌────▼──────────────▼──────┐        │               │
│         │    │    @drenyra/pi (npm)     │◄───────┘               │
│         │    │    Drenyra Harness       │     HTTP/RPC           │
│         │    └───────────┬──────────────┘                        │
│         │                │                                       │
│         │    ┌───────────▼──────────────┐                        │
│         │    │   skills (npm plugins)   │                        │
│         │    │  @drenyra/skill-sire-*   │                        │
│         │    └──────────────────────────┘                        │
│         │                                                       │
│  ┌──────┴───────┐  ┌──────────────────────┐                    │
│  │ packages/*   │  │   drenyra-engram     │                    │
│  │ (domain,     │  │   (Go sidecar)       │                    │
│  │  application,│  │   evidence store     │                    │
│  │  persistence)│  └──────────────────────┘                    │
│  └──────────────┘                                             │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Flujo de datos

### 2.1 Sesión de agente (Runtime API)

```
CLI (HTTP)                    drenyra-pi                    engram
    │                            │                            │
    │  POST /session/create      │                            │
    │───────────────────────────►│                            │
    │                            │  SessionManager.create()   │
    │                            │─────────────────────────►  │
    │                            │◄────────────────────────── │
    │◄───────────────────────────│                            │
    │                            │                            │
    │  POST /session/:id/run     │                            │
    │  { task, context }         │                            │
    │───────────────────────────►│                            │
    │                            │  LatinModernoOrchestrator  │
    │                            │  .route(task)              │
    │                            │    ├→ DomainAgent.execute  │
    │                            │    ├→ ApprovalGate.check   │
    │                            │    └→ Mnevori.saveArtifact │
    │                            │─────────────────────────►  │
    │◄───────────────────────────│                            │
    │  { result, traceId }      │                            │
```

### 2.2 Instalación de skill

```
CLI                               drenyra-pi                    npm
  │                                  │                          │
  │  drenyra pi install              │                          │
  │  @drenyra/skill-sire-filing      │                          │
  │─────────────────────────────────►│                          │
  │                                  │  npm install             │
  │                                  │─────────────────────────►│
  │                                  │◄─────────────────────────│
  │                                  │                          │
  │                                  │  PluginRegistry          │
  │                                  │  .register(skill)        │
  │                                  │  skill.initialize(ctx)   │
  │◄─────────────────────────────────│                          │
  │  "Skill sire-filing installed"  │                          │
```

---

## 3. API HTTP (drenyra-pi → clients)

### 3.1 Formato de respuesta

```typescript
// Responses
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string }
  meta: { traceId: string; durationMs: number }
}

// Pagination
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: { total: number; offset: number; limit: number }
}
```

### 3.2 Endpoints

#### Session Management

```
POST /api/v1/sessions
  Body: { goal: string; context: AgentContext }
  → 201: { sessionId: string }

GET /api/v1/sessions/:id
  → 200: AgentSessionDTO

GET /api/v1/sessions
  Query: { status?, limit?, offset? }
  → 200: PaginatedResponse<AgentSessionDTO>

POST /api/v1/sessions/:id/pause
  → 200: { sessionId, status: "paused" }
POST /api/v1/sessions/:id/resume
  → 200: { sessionId, status: "active" }
POST /api/v1/sessions/:id/cancel
  → 200: { sessionId, status: "cancelled" }

GET /api/v1/sessions/:id/timeline
  → 200: AgentStepDTO[]
```

#### Agent Execution

```
POST /api/v1/agents/:id/run
  Body: { task: Task; context: AgentContext }
  → 202: { executionId: string }

GET /api/v1/agents/:id/executions/:executionId
  → 200: ExecutionResult
```

#### Workflow

```
POST /api/v1/workflows/run
  Body: { workflow: string; input: unknown; context: AgentContext }
  → 202: { workflowId: string }

GET /api/v1/workflows/:id
  → 200: WorkflowStatus
```

#### Skills

```
GET /api/v1/skills
  → 200: SkillDTO[]
POST /api/v1/skills/install
  Body: { package: string; version?: string }
  → 201: { skillId: string; name: string }
POST /api/v1/skills/:id/uninstall
  → 204
```

#### Health

```
GET /api/v1/health
  → 200: { status: "ok"; version: string; skills: number; uptime: number }
```

---

## 4. Schema sidecar engram

```sql
-- Evidence store for phase gates and audit trails
CREATE TABLE evidence_records (
  id          TEXT PRIMARY KEY,
  trace_id    TEXT NOT NULL,
  agent_id    TEXT NOT NULL,
  session_id  TEXT,
  phase       TEXT NOT NULL,         -- captura, clasificacion, etc.
  event_type  TEXT NOT NULL,         -- gate_pass, gate_fail, approval, etc.
  payload     JSONB NOT NULL,
  checksum    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidence_trace ON evidence_records(trace_id);
CREATE INDEX idx_evidence_session ON evidence_records(session_id);
CREATE INDEX idx_evidence_phase ON evidence_records(phase);

-- Phase state snapshots (for resume)
CREATE TABLE phase_snapshots (
  ruc         TEXT NOT NULL,
  periodo     TEXT NOT NULL,          -- "2026-01"
  phase       TEXT NOT NULL,
  status      TEXT NOT NULL,          -- pending, in_progress, completed, failed
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ruc, periodo, phase)
);
```

---

## 5. Plan de PRs (chained)

| PR      | Fase | Scope                                                         | Archivos estimados | Líneas |
| ------- | ---- | ------------------------------------------------------------- | ------------------ | ------ |
| **PR1** | F1   | Crear repo `drenyra-pi` con estructura, `package.json`, build | 60                 | ~300   |
| **PR2** | F1   | Migrar código de agents, ajustar imports internos             | 80                 | ~500   |
| **PR3** | F1   | Separar repo drenyra-pi, apuntar consumers con git dependency | 15                 | ~100   |
| **PR4** | F2   | Crear CLI thin en TS con comandos base                        | 20                 | ~400   |
| **PR5** | F2   | TUI con Ink, reemplazar bubble tea                            | 15                 | ~300   |
| **PR6** | F2   | Pipeline CLI → drenyra-pi HTTP completo                       | 10                 | ~200   |
| **PR7** | F3   | Interfaz de skill + PluginRegistry                            | 8                  | ~150   |
| **PR8** | F3   | Skill SIRE Filing como package                                | 12                 | ~250   |
| **PR9** | F3   | Comando `drenyra pi install/uninstall/list`                   | 5                  | ~100   |

### Orden de merge

```
main ── PR1 ── PR2 ── PR3 ── PR4 ── PR5 ── PR6 ── PR7 ── PR8 ── PR9
         F1               F2                        F3
```

Cada PR mergea a `main` secuencialmente. `stacked-to-main` chain strategy.

---

## 6. Riesgos técnicos

| Riesgo                                           | Probabilidad | Mitigación                                                   |
| ------------------------------------------------ | ------------ | ------------------------------------------------------------ |
| Split a repo separado requiere CI duplicado      | Media        | CI reutilizable vía GitHub Actions composite o workflow_call |
| Versiones de `@mastra/core` pueden divergir      | Media        | Pin a versión exacta en peerDependencies                     |
| CLI Go tiene features no documentadas            | Media        | Hacer un inventory de todos los comandos Go antes de PR4     |
| Skills modulares dependen de API pública estable | Alta         | No publicar hasta que F1 esté estable y testeada             |

---

## 7. Tasks de implementación

### PR1 — Scaffold repo

- [ ] Crear directorio `repos/drenyra-pi/` con estructura
- [ ] `package.json` con name `@drenyra/pi`
- [ ] `tsconfig.json`, `vitest.config.ts`
- [ ] `src/index.ts` barrel vacío

### PR2 — Migrar código

- [ ] Copiar `packages/agents/src/` → `drenyra-pi/src/`
- [ ] Ajustar imports internos (paths relativos)
- [ ] Remover dependencias del monorepo (drenyra domain, etc.)
- [ ] Tests pasando en standalone

### PR3 — Publicar + migrar consumers

- [ ] `npm publish`
- [ ] Monorepo: `packages/agents/package.json` → `@drenyra/pi`
- [ ] Actualizar imports en `apps/api`, `apps/web`
- [ ] Remover `packages/agents` del monorepo

### PR4 — CLI thin

- [ ] Reemplazar contenido de `apps/cli`
- [ ] Comandos: `agents`, `workflow`, `config`
- [ ] HTTP client contra drenyra-pi

### PR5 — TUI

- [ ] Ink components para sessions, workflows
- [ ] Status bar, spinners

### PR6 — Pipeline completo

- [ ] `drenyra workflow run` → HTTP → drenyra-pi → response
- [ ] E2E tests

### PR7 — Plugin system

- [ ] `DrenyraSkill` interface
- [ ] PluginRegistry.load(), install(), uninstall()

### PR8 — Skill SIRE

- [ ] Package `@drenyra/skill-sire-filing`
- [ ] Strategy + tests

### PR9 — CLI skill management

- [ ] `drenyra pi install/uninstall/list`
- [ ] Tests
