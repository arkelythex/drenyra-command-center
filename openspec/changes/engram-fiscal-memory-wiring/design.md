# Design: Engram Fiscal Memory Wiring

**Change**: engram-fiscal-memory-wiring
**Status**: design (proposal-level sketch — final shape lands with the chosen flow)
**Date**: 2026-08-02

## Context recap

The engram fiscal-memory adapter is **built and tested** (PR #139):

- `EngramFiscalMemoryRepository` (packages/memory) implements the domain
  `FiscalMemoryRepository` port — save / findById / findByPeriod /
  findByCategory / findBySeverity / findByEvidenceRef / findRelated /
  saveRevision. Scope convention (engine): period-less company scope with
  `companyId = ruc`; the fiscal period + domain companyId live in the
  observation's `learned` metadata (searchable + exactly reconstructable via
  `FiscalMemory.rehydrate`). `findRevisions` fails closed
  (`FISCAL_MEMORY_NO_SCOPE`) — the domain interface carries no scope.
- Live integration verified 12/12 against the real engine (save → every
  read path round-trips).

This design covers the WIRING (the production entry point), which the
proposal forks on pipeline maturity.

## Wiring shape

### 1. Factory (mirror the mission recorder, PR #138)

```ts
// packages/memory/src/fiscal-memory-recorder.ts (or apps/api if flow-local)
export interface FiscalMemoryRecorder {
  recordDecision(input: RecordDecisionInput): Promise<void>;
  recordMonthlyClosing(input: MonthlyClosingInput): Promise<void>;
}

export function createFiscalMemoryRecorder(): FiscalMemoryRecorder {
  if (!isEngramEnabled()) return new NoopFiscalMemoryRecorder(); // fail closed
  const repo = new EngramFiscalMemoryRepository(new EngramClient(engramConfig()));
  return new EngramFiscalMemoryRecorder(repo); // wraps FiscalMemoryService(repo)
}
```

- **Fail closed**: nothing touches the sidecar unless `DRENYRA_ENGRAM_ENABLED`.
- **Best-effort**: the recorder catches errors and logs a warning; the caller
  (mission/pipeline step) is never broken by an engram outage.
- **Non-authorizing**: records what was decided; approval stays in the
  existing gates (drenyra-ai, human review).

### 2. Injection points (by chosen option)

| Option | Injection point | Records |
|---|---|---|
| A (live) | `missions.service` constructor (4th/5th param, like `MissionMemoryRecorder`) — call in `approveMission`/`reconcileMission` on decision states | `tax_decision` / `monthly_closing` |
| B (post-M-series) | `MonthlyCloseOrchestrator` constructor — call at each decision step (`analyze-ledger`, `analyze-compliance`, posting decisions) | `tax_decision` / `accounting_criterion` / `monthly_closing` with evidenceRefs |
| C (audit) | the audit-findings producer when live | `audit_finding` (severity, evidence, resolution) |

### 3. Memory shape (per record)

- `topicKey`: `fiscal-memory/<uuid>` (stable handle per decision/finding)
- `scope`: `{ kind: company, organizationId: <tenantId>, companyId: <ruc>, ruc }`
  (period-less; the period travels in `learned`)
- `content.what`: decision summary · `content.why`: rationale · `content.where`:
  evidence refs (invoices, SIRE data, journal postings) · `content.learned`:
  `{ id, companyId, period, category, severity, status, tags,
  relatedMemoryIds, approvedBy?, sourceAgentId?, updatedAt }`
- `provenance`: `{ actor, timestamp, source: "api", session: <missionId|pipeline run> }`
- Revisions: a subsequent save on the same topicKey is a new immutable
  revision (the fiscal revision model).

### 4. Test plan (per wired decision point)

1. Decision recorded with the correct ruc + period scope (integration against
   the real engine or a mock client for unit).
2. Provenance + evidenceRefs preserved exactly (round-trip via rehydrate).
3. `isEngramEnabled() === false` → noop, flow untouched.
4. Engram outage → warning logged, decision flow completes normally.
5. Repeated save of the same topicKey → new revision (findById returns the
   latest; the chain grows).

## Risks

- **Fiscal-adjacent**: wiring touches decision flows — preserve provenance,
  never move approval logic into engram (doctrine: memory never authorizes).
- **Dormant destination**: wiring into a stub pipeline (Option A) captures
  workflow state, not fiscal substance — low value until the real flow runs
  (Option B). The proposal recommends deferring Option B until the M-series
  monthly close lands on main.
- **findRevisions**: stays fail-closed until the domain interface gains a
  scope (a domain change — separate small PR when needed).

## Acceptance criteria (when implemented)

- A fiscal decision recorded via the wired flow appears in
  `findByPeriod`/`findByCategory`/`findById` for the same tenant+ruc, and is
  invisible to any other tenant (scope isolation).
- The decision flow completes normally when engram is down (warning, no
  throw).
- No authorize/approve/allow path is added anywhere.
