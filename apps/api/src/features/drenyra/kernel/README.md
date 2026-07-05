# Drenyra Unified Runtime Kernel

**Status:** Design specification (Phase 2 implementation)  
**ADR:** [ADR-034](../../../../docs/02-adr/adr-034-drenyra-fiscal-app-server.md)  
**Protocol:** [DFAS Spec](../../../../docs/01-architecture/drenyra-fiscal-app-server-2026.md)

## Purpose

The kernel is a **thin composition layer** that unifies four existing runtime entry points into one `FiscalAppServer` instance:

| Legacy entry | Current module | Kernel wrapper |
|---|---|---|
| Brain threads | `brain/` | `FiscalThreadManager` |
| Runtime runs + SSE | `drenyra.routes.ts` runs | `TurnController` |
| Harness execution | `@drenyra/harness` | `DelegationRouter` |
| Orchestrator (tx + period) | `orchestrator/` + `drenyra-orchestrator` | `OrchestrationRouter` |

REST v0 endpoints delegate to the kernel. DFAS WebSocket v1 is the canonical transport.

## Module layout

```
apps/api/src/features/drenyra/kernel/
├── README.md                    # This file
├── index.ts                     # Public exports
├── fiscal-app-server.ts         # DFAS JSON-RPC handler + WS upgrade
├── fiscal-thread-manager.ts     # Brain + run metadata unification
├── turn-controller.ts           # Turn lifecycle, approval pause/resume
├── delegation-router.ts         # Harness tier graph dispatch
├── orchestration-router.ts      # transaction | period | auto routing
├── capability-guard.ts          # evaluateDrenyraCapability wrapper
├── skill-injector.ts            # Lexori context injection
├── truth-promotion-boundary.ts  # Fiscal Truth Engine gate
├── item-stream-publisher.ts     # Append-only item stream + subscribers
├── types.ts                     # Kernel-internal types (not domain duplicates)
└── __tests__/
    ├── turn-controller.test.ts
    ├── orchestration-router.test.ts
    └── fiscal-app-server.test.ts
```

## Composition diagram

```mermaid
flowchart TB
  subgraph kernel [FiscalAppServer]
    FAS[fiscal-app-server.ts]
    FTM[FiscalThreadManager]
    TC[TurnController]
    DR[DelegationRouter]
    OR[OrchestrationRouter]
    CG[CapabilityGuard]
    SI[SkillInjector]
    TPB[TruthPromotionBoundary]
    ISP[ItemStreamPublisher]
  end

  FAS --> FTM
  FAS --> TC
  TC --> CG
  TC --> SI
  TC --> OR
  TC --> DR
  TC --> TPB
  TC --> ISP
  OR --> MastraTx[Transaction Layer]
  OR --> PhaseOrch[Period Layer]
  DR --> Harness[@drenyra/harness]
  FTM --> BrainRepo[brain.repository]
  TPB --> TruthEngine[Fiscal Truth Engine]
  ISP --> FAL[FAL audit events]
```

## Component contracts

### FiscalThreadManager

**Responsibility:** Single identity for a fiscal conversation — merges Brain thread id with optional run id.

```typescript
interface FiscalThreadManager {
  create(input: DfasThreadCreateParams, actorId: string): Promise<DfasThreadCreateResult>;
  resume(threadId: string, scope: DrenyraFiscalScope): Promise<void>;
  subscribe(threadId: string, scope: DrenyraFiscalScope): AsyncIterable<DfasItemStreamEntry>;
  assertScope(threadId: string, scope: DrenyraFiscalScope): Promise<void>;
}
```

**Wraps:** `createDrenyraBrainService`, run repository metadata.

**Invariant:** Thread scope is immutable after creation. `dfasScopesMatch` enforced on every operation.

### TurnController

**Responsibility:** Turn lifecycle with approval pause/resume (Codex parity).

```typescript
interface TurnController {
  start(input: DfasTurnStartParams, actorId: string): Promise<DfasTurnStartResult>;
  cancel(input: DfasTurnCancelParams, actorId: string): Promise<void>;
  respondApproval(input: DfasApprovalRespondParams, actorId: string): Promise<void>;
  getActiveTurn(threadId: string): Promise<DfasTurnStatus | null>;
}
```

**State machine:**

```
queued → running → waiting_for_approval → running → completed
                 ↘ failed / cancelled
```

**On `approval/required`:** Turn pauses, `item/approval_required` emitted, no further tool calls until `approval/respond`.

### DelegationRouter

**Responsibility:** Route tasks to harness tier graph (tier0 → tier3b).

**Wraps:** `createDrenyraHarness().execute()`

**Input:** Turn prompt + fiscal scope + optional agent hint  
**Output:** Harness result linked to `brainThreadId`, `brainTurnId`, `traceId`

### OrchestrationRouter

**Responsibility:** Select transaction vs period orchestration.

| Mode | Router target |
|---|---|
| `transaction` | `DrenyraOrchestrator` (Mastra FD workflow) |
| `period` | `FiscalPhaseOrchestrator` (6-phase cycle) |
| `auto` | Intent detection → transaction if doc-scoped, period if month-scoped |

**Wraps:** `drenyra-orchestrator.module.ts`, `FiscalPhaseOrchestrator`

### CapabilityGuard

**Responsibility:** Pre-flight capability evaluation before any tool/harness call.

**Wraps:** `evaluateDrenyraCapability` from `@drenyra/domain/drenyra`

**On deny:** Emit `item/capability_decision` with `CAPABILITY_DENIED`, fail turn.

### SkillInjector

**Responsibility:** Load Lexori skill context for turn prompt augmentation.

**Wraps:** TS skill registry (future: `packages/drenyra-orchestrator/src/skills/`)

**On `skillId` in turn/start:** Prepend `renderLexoriSkillContext()` output to agent system prompt.

### TruthPromotionBoundary

**Responsibility:** Only path to material fiscal state changes.

**Rules:**
- AI/harness output → `proposed` only
- Promotion requires: evidence root, validator pass, approval (if material), guardian pass
- Emits `item/truth_promoted` on success

**Wraps:** Fiscal Truth Engine promotion API

### ItemStreamPublisher

**Responsibility:** Append-only, monotonic sequence per thread.

**Wraps:** `createDfasItemStreamEntry`, SSE/WS broadcast to subscribers

**Invariant:** `assertMonotonicSequence` on every append.

## Factory

```typescript
// kernel/index.ts — intended public API
export function createFiscalAppServer(deps: FiscalAppServerDeps): FiscalAppServer;

interface FiscalAppServerDeps {
  brainService: DrenyraBrainService;
  harness: DrenyraHarness;
  orchestratorModule: DrenyraOrchestratorModule;
  capabilityGrants: () => Promise<DrenyraCapabilityGrant[]>;
  skillRegistry?: LexoriSkillRegistry;
  truthEngine: TruthPromotionPort;
  auditEmitter: FALAuditEmitter;
}
```

## HTTP/WebSocket routes

| Route | Phase | Description |
|---|---|---|
| `WS /api/drenyra/v1/ws` | 2 | DFAS JSON-RPC primary transport |
| `GET /api/drenyra/v1/threads/:id/events` | 2 | SSE fallback |
| `POST /api/drenyra/brain/*` | 0→2 | Compat v0 — delegates to kernel |
| `POST /api/drenyra/runs` | 0→2 | Compat v0 — delegates to kernel |
| `GET /api/drenyra/threads/:id/replay` | 5 | Replay from FAL + Engram |

## Wiring existing modules (no rewrites)

```typescript
// drenyra-orchestrator.module.ts — already exists
const orchestratorModule = createDrenyraOrchestratorModule({ ... });

// brain/index.ts — already exists
const brainService = createDrenyraBrainService({ repository });

// harness — already exists
const harness = createDrenyraHarness({ onApprovalRequired });

// NEW: kernel composition
const fiscalAppServer = createFiscalAppServer({
  brainService,
  harness,
  orchestratorModule,
  capabilityGrants: loadScopedGrants,
  truthEngine: fiscalTruthPromotionPort,
  auditEmitter: falAuditEmitter,
});
```

## Test strategy

| Test | Validates |
|---|---|
| `turn-controller.test.ts` | Approval pause/resume, cancel, scope mismatch |
| `orchestration-router.test.ts` | transaction/period/auto routing |
| `fiscal-app-server.test.ts` | JSON-RPC message dispatch, item stream sequence |
| Contract test | DFAS protocol version + schema compliance |

Run: `cd apps/api && bun run test src/features/drenyra/kernel`

## Non-goals (kernel must NOT)

- Reimplement Mastra orchestrator logic
- Replace Brain repository schema
- Bypass capability matrix or truth promotion
- Become a god-object — each sub-component ≤ 300 lines

## Related docs

- [DFAS Protocol Spec](../../../../docs/01-architecture/drenyra-fiscal-app-server-2026.md)
- [Drenyra Dual-Surface Brain](../../../../docs/01-architecture/drenyra-dual-surface-brain.md)
- [SDD Tasks](../../../../docs/superpowers/specs/drenyra-fiscal-app-server-tasks-2026.md)
