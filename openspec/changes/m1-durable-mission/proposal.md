# SDD Proposal: M1 — Durable Monthly Close Mission

**Status:** Proposed  
**Date:** 2026-07-30  
**Author:** Orchestrator (post-review synthesis)  
**Delivery strategy:** auto-chain (feature-branch-chain → `feature/m1-durable-mission`)  
**Worktree:** `~/Documents/PROYECTOS/Drenyra/worktrees/m1-durable-mission`  

---

## 1. PRD — Problem Statement

### Business Problem

El cierre mensual contable es actualmente un proceso manual asistido por checklist. La vertical slice implementó un workspace de misión con 11 estados canónicos, SSE, mock, y aprobación humana — pero la máquina de estados y los invariantes viven **únicamente en el frontend**.

Esto significa que:
- Un cliente HTTP puede saltarse las transiciones de estado (DRAFT→APPROVED, RUNNING→COMPLETED)
- No hay idempotencia real: dos clicks pueden duplicar una ejecución
- No hay concurrencia segura: dos pestañas pueden sobrescribirse mutuamente
- No hay receipt criptográfico: la aprobación devuelve un ID pero no es verificable
- No hay evidencia versionada: una aprobación podría referenciar evidencia que cambió

### Target Users

- **Contadores** en empresas peruanas que ejecutan cierres mensuales
- **Auditores** que necesitan verificar cada acción con un receipt inmutable
- **Firmas contables** con múltiples RUCs que necesitan tenant isolation

### Business Rules

1. Toda transición de estado debe ser validada por backend — el frontend es solo un preview
2. Una misión no puede ejecutarse dos veces con el mismo idempotency key + payload
3. Si el mismo idempotency key llega con payload diferente → 409 CONFLICT
4. Toda escritura debe usar optimistic concurrency (UPDATE ... WHERE version = ?)
5. Toda aprobación debe generar un receipt canónico con SHA-256 del estado resultante
6. El evidence bundle visto por el usuario al aprobar debe ser el mismo que se persiste
7. El estado UNKNOWN no se convierte automáticamente a FAILED — requiere reconciliación

---

## 2. Scope

### IN — M1 Durable Monthly Close Mission

| # | Component | Descripción |
|---|-----------|-------------|
| 1 | **packages/mission-domain/** | Máquina de estados canónica, transiciones, errores, contratos compartidos |
| 2 | **API /missions/** | CRUD + state machine enforcement en backend |
| 3 | **API /harness/execute** | Endpoint SSE con idempotencia + concurrencia |
| 4 | **Idempotencia atómica** | Tabla mission_idempotency con key+payload+result+expiración |
| 5 | **Optimistic concurrency** | UPDATE missions SET version = version + 1 WHERE version = ? |
| 6 | **Receipt canónico** | SHA-256 del snapshot post-mutación + metadatos completos |
| 7 | **Evidence bundle versionado** | Aprobación ligada a proposalVersion + evidenceHash |
| 8 | **SSE reanudable** | Eventos persistentes con sequence numbers, resume desde N |
| 9 | **Refactor MissionWorkspace** | Dividir en MissionHeader, MissionStateView, MissionProgress, MissionBlockedState, MissionUnknownState, MissionApprovalGate, MissionEvidenceBundle, MissionReceipt, MissionActions |
| 10 | **Refactor useAccountingMission** | Reducer con eventos explícitos (MISSION_EVENT_RECEIVED, APPROVAL_COMPLETED, etc.) |
| 11 | **Suite de tests (>50)** | Unitarias, integración, seguridad, navegador |
| 12 | **Tenant isolation** | Tests de companyId ajeno, RUC manipulado, periodo ajeno |
| 13 | **Quarantine register** | docs/testing/quarantine-register.md con fecha límite |

### OUT — M1 (explícitamente no incluido)

- Invoices, conciliaciones bancarias, otros intents
- Implementación real del harness (cálculos contables, SIRE, IGV)
- Firma digital de receipts
- Interfaz de mobile/desktop/CLI (solo web)
- Multi-idioma (solo español por ahora)
- Dashboard de métricas de misión
- Notificaciones push o email

---

## 3. Architecture

### Package Structure

```
packages/mission-domain/
├── src/
│   ├── mission-status.ts         # 11-state canonical machine (shared)
│   ├── mission-transitions.ts    # Transition validation logic
│   ├── mission-errors.ts         # Typed error classes
│   ├── mission-contracts.ts      # Shared TypeScript types
│   ├── mission-events.ts         # SSE event types
│   ├── mission-receipt.ts        # Receipt generation + hash
│   └── __tests__/
│       ├── mission-status.test.ts
│       ├── mission-transitions.test.ts
│       └── mission-receipt.test.ts
├── package.json
└── tsconfig.json
```

### API Routes

```
POST   /api/v1/missions                    → create mission
GET    /api/v1/missions/:id                → get snapshot (polling/reconnect)
POST   /api/v1/missions/:id/execute        → run intent (SSE stream)
POST   /api/v1/missions/:id/approve        → approve proposal
POST   /api/v1/missions/:id/reject         → reject proposal
POST   /api/v1/missions/:id/reconcile      → resolve UNKNOWN state
```

### DB Schema (new tables)

```sql
-- Canonical mission table
CREATE TABLE accounting_missions (
    id            UUID PRIMARY KEY,
    company_id    UUID NOT NULL REFERENCES companies(id),
    fiscal_period TEXT NOT NULL, -- YYYY-MM
    intent        TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'DRAFT',
    version       INTEGER NOT NULL DEFAULT 1,
    progress      REAL NOT NULL DEFAULT 0,
    input         JSONB,
    proposal      JSONB, -- proposal snapshot at time of creation
    rejection     JSONB, -- rejection metadata
    receipt_id    UUID,
    receipt_hash  TEXT,  -- SHA-256 of canonical snapshot
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(company_id, id)
);

-- Idempotency table
CREATE TABLE mission_idempotency (
    id              UUID PRIMARY KEY,
    company_id      UUID NOT NULL REFERENCES companies(id),
    command_type    TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    payload_hash    TEXT NOT NULL, -- SHA-256 of canonical payload
    mission_id      UUID REFERENCES accounting_missions(id),
    execution_status TEXT NOT NULL,
    response        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    UNIQUE(company_id, idempotency_key)
);

-- SSE event log
CREATE TABLE mission_events (
    id              BIGSERIAL PRIMARY KEY,
    mission_id      UUID NOT NULL REFERENCES accounting_missions(id),
    sequence        BIGINT NOT NULL,
    event_type      TEXT NOT NULL,
    snapshot        JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(mission_id, sequence)
);

-- Receipts
CREATE TABLE mission_receipts (
    id              UUID PRIMARY KEY,
    mission_id      UUID NOT NULL REFERENCES accounting_missions(id),
    company_id      UUID NOT NULL REFERENCES companies(id),
    actor_id        TEXT NOT NULL,
    decision        TEXT NOT NULL,
    proposal_version INTEGER NOT NULL,
    evidence_hash   TEXT NOT NULL,
    previous_status TEXT NOT NULL,
    new_status      TEXT NOT NULL,
    payload_hash    TEXT NOT NULL,
    receipt_hash    TEXT NOT NULL, -- SHA-256(all fields)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### State Machine (shared — enforced by backend)

```
DRAFT → QUEUED → RUNNING → AWAITING_APPROVAL → APPROVED → COMPLETED
                     ↓                             ↓
                 BLOCKED                        FAILED
                     ↓
                  RUNNING
                     ↓
               AWAITING_APPROVAL → REJECTED → REVISION_REQUESTED → QUEUED
                                       → APPROVED (only via REVISION)
RUNNING → UNKNOWN → RUNNING/FAILED/COMPLETED (recovery)
```

---

## 4. Delivery Plan — 3 Chained PRs

### PR1: Domain + Database (preparación)

**Scope:** `packages/mission-domain/`, migrations, shared contracts

Files:
- `packages/mission-domain/src/mission-status.ts` — state machine
- `packages/mission-domain/src/mission-transitions.ts` — validated transitions
- `packages/mission-domain/src/mission-errors.ts` — typed errors
- `packages/mission-domain/src/mission-contracts.ts` — TypeScript contracts
- `packages/mission-domain/src/mission-events.ts` — SSE event types
- `packages/mission-domain/src/mission-receipt.ts` — receipt generation + SHA-256
- `packages/mission-domain/package.json`
- `packages/mission-domain/tsconfig.json`
- Migrations: `accounting_missions`, `mission_idempotency`, `mission_events`, `mission_receipts`
- Tests: state machine, transitions, receipt hashing, contract validation

**Estimated:** ~400 lines

### PR2: API + Backend Enforcement

**Scope:** All API routes, idempotency middleware, concurrency control, SSE streaming, tenant isolation

Files:
- `apps/api/src/features/missions/missions.module.ts`
- `apps/api/src/features/missions/missions.routes.ts`
- `apps/api/src/features/missions/missions.controller.ts`
- `apps/api/src/features/missions/missions.service.ts`
- `apps/api/src/features/missions/middleware/idempotency.middleware.ts`
- `apps/api/src/features/missions/middleware/concurrency.middleware.ts`
- `apps/api/src/features/missions/sse/mission-sse.stream.ts`
- `apps/api/src/features/missions/sse/mission-event-store.ts`
- `apps/api/src/features/missions/schema/mission.schema.ts`
- Integration tests: idempotency, concurrency, SSE resume, state enforcement, tenant isolation

**Estimated:** ~800 lines

### PR3: Frontend Refactor + E2E

**Scope:** Subcomponent extraction, reducer pattern, comprehensive tests

Files:
- `apps/web/src/features/workspace/components/mission/MissionHeader.tsx`
- `apps/web/src/features/workspace/components/mission/MissionStateView.tsx`
- `apps/web/src/features/workspace/components/mission/MissionProgress.tsx`
- `apps/web/src/features/workspace/components/mission/MissionBlockedState.tsx`
- `apps/web/src/features/workspace/components/mission/MissionUnknownState.tsx`
- `apps/web/src/features/workspace/components/mission/MissionApprovalGate.tsx`
- `apps/web/src/features/workspace/components/mission/MissionEvidenceBundle.tsx`
- `apps/web/src/features/workspace/components/mission/MissionReceipt.tsx`
- `apps/web/src/features/workspace/components/mission/MissionActions.tsx`
- `apps/web/src/features/workspace/hooks/useMissionReducer.ts`
- `apps/web/src/features/workspace/hooks/useMissionSnapshot.ts`
- `apps/web/src/features/workspace/hooks/useMissionExecution.ts`
- `apps/web/src/features/workspace/hooks/useMissionEventStream.ts`
- `apps/web/src/features/workspace/hooks/useMissionDecision.ts`
- `apps/web/src/features/workspace/hooks/useMissionRecovery.ts`
- Unit tests: reducer, subcomponents, error mapping, serialization
- E2E tests (Playwright): reload, two tabs, timeout→UNKNOWN, companyId ajeno
- `docs/testing/quarantine-register.md`

**Estimated:** ~700 lines

---

## 5. Non-Goals

- No implementación real del harness de cierre contable (solo el framework de ejecución)
- No migración de datos históricos
- No multi-idioma
- No notificaciones externas (email, push)
- No CLI/desktop/mobile — solo web
- No dashboard de métricas de misión
- No firma digital de receipts (post-M1)

---

## 6. Risk Assessment

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Backend enforcement rompe contrato frontend existente | ALTA | Migración gradual: frontend usa shared package desde PR1 |
| SSE reanudable introduce complejidad de almacenamiento | MEDIA | Tabla mission_events con sequence + TTL; cleanup job post-M1 |
| Idempotencia atómica requiere transacciones DB | MEDIA | Usar transacciones Drizzle en el middleware |
| Optimistic concurrency puede causar 409 en alta concurrencia | BAJA | Retry lógico del lado del cliente con backoff |
| Receipt SHA-256 añade latencia en escrituras | BAJA | Hash calculado en memoria antes de persistir |
| Quarantined tests sin fecha límite se vuelven ruido permanente | MEDIA | quarantine-register.md con deadline explícito |

---

## 7. Definition of Done

1. ✅ Misión persistida en backend (tabla `accounting_missions`)
2. ✅ Estado y transiciones validados en servidor (shared `mission-status.ts`)
3. ✅ Idempotencia almacenada y atómica (tabla `mission_idempotency`)
4. ✅ Optimistic concurrency real (`UPDATE ... WHERE version = ?`)
5. ✅ SSE reanudable desde almacenamiento (`mission_events` con sequence)
6. ✅ UNKNOWN reconciliable (endpoint `/missions/:id/reconcile`)
7. ✅ Evidence bundle versionado e inmutable (proposalVersion + evidenceHash)
8. ✅ Aprobación ligada a proposal + evidence hashes
9. ✅ Receipt canónico con SHA-256 (tabla `mission_receipts`)
10. ✅ Tenant isolation verificada con tests reales
11. ✅ Reload y dos pestañas probados en navegador (Playwright)
12. ✅ Suite activa completamente verde (>50 tests)
13. ✅ Quarantine register con fecha límite
