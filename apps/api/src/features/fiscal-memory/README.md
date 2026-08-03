# Fiscal Memory — read side of the institutional fiscal-memory loop

The **Consultar** step of **Decidir → Registrar → Consultar**.

| Step | Component | Where |
| --- | --- | --- |
| Decidir | Real monthly-close pipeline (10-step orchestrator) | `apps/api/src/features/missions/intent-handlers/` |
| Registrar | `EngramFiscalMemoryRecorder` — records approved proposals as `monthly_closing` memories | `fiscal-memory.recorder.ts` (PR #152) |
| **Consultar** | **`GET /api/v1/fiscal-memory` — this feature** | `apps/api/src/features/fiscal-memory/` |

## Activation chain

The loop runs only when both flags are on. Each is a deliberate deployment
decision — nothing runs by default (fail closed):

```bash
MONTHLY_CLOSE_PIPELINE_ENABLED=true   # the REAL monthly-close pipeline runs in missions
DRENYRA_ENGRAM_ENABLED=true           # approved decisions are recorded as fiscal memory
```

Both off (default): missions run the no-op intent handler and no fiscal memory
is written or served. See the `Drenyra Engram` / `Fiscal memory activation
chain` sections of `.env.example`.

## Endpoints

### `GET /api/v1/fiscal-memory`

List the calling company's fiscal memories (scoped by tenant + company + RUC
via `companyScopeGuard`). Optional query filters:

| Query param | Type | Notes |
| --- | --- | --- |
| `period` | `YYYY-MM` | Exact match on the memory's fiscal period |
| `category` | enum | `monthly_closing`, `tax_decision`, `audit_finding`, … |
| `severity` | enum | `info` \| `low` \| `medium` \| `high` \| `critical` |
| `evidenceRef` | string | Memories carrying that evidence reference |

```http
GET /api/v1/fiscal-memory?period=2026-07&category=monthly_closing&severity=high
```

### `GET /api/v1/fiscal-memory/:id`

Single fiscal memory by id, scoped to the calling company (404 when absent).

## Guarantees

- **Scope-first**: every read is scoped by tenantId + companyId + ruc
  (structural isolation — a different tenant/company/RUC can never retrieve
  another tenant's memory).
- **Fail closed**: when `DRENYRA_ENGRAM_ENABLED` is off, queries answer `503
  FISCAL_MEMORY_DISABLED` — nothing touches the sidecar.
- **Best-effort**: an unreachable sidecar answers `503 DEPENDENCY_FAILURE`
  (typed, with the error kind) — never an unhandled crash.
- **Non-authorizing**: this read side only serves institutional memory; it
  never approves, posts, or closes anything.
- **No monetary fields**: Drenyra money values are BigInt cents (repo-wide
  rule); fiscal memories carry no money values.

## Files

| File | Role |
| --- | --- |
| `fiscal-memory.routes.ts` | Elysia routes (list + findById) |
| `fiscal-memory.query.ts` | Query service + fail-closed factory |
| `company-scope-fiscal-memory.resolver.ts` | companyId → `{ tenantId, companyId: ruc, ruc }` |
| `__tests__/fiscal-memory.routes.test.ts` | 10 tests: scope, filters, fail-closed, 404, sidecar-down |
