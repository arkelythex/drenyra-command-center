# Proposal: Engram Fiscal Memory Wiring — institutional fiscal memory goes live

**Change**: engram-fiscal-memory-wiring
**Status**: proposal
**Date**: 2026-08-02

## Problem

Drenyra built a complete institutional fiscal-memory capability that nothing
uses in production:

- **`FiscalMemoryService`** (packages/application) — recordDecision /
  recordAuditFinding / recordMonthlyClosingMemory / resolveMemory /
  supersedeMemory. **Zero production consumers.**
- **`EngramFiscalMemoryRepository`** (packages/memory, delivered and tested in
  the engram adapter stack, PR #139) — implements the domain
  `FiscalMemoryRepository` port against the drenyra-engram sidecar (ruc +
  period scope, revisions, evidence refs, category/severity). **Zero call
  sites.**
- **`PostgresFiscalMemoryRepository`** (packages/persistence) — dormant too.

Meanwhile the production fiscal flow on `main` is itself scaffolding: the
`MonthlyCloseOrchestrator` has no production constructor, the mission intent
handler registry (`INTENT_HANDLERS`) is never populated, and the real monthly
close lives in unmerged M-series work (`m2-real-monthly-close` worktree,
feature branches). There is **no live fiscal workflow on main** that records
decisions, findings, or closing memory — so the institutional memory the
organization could accumulate (what was decided, which criterion applied,
which evidence backed it, what got superseded) is being lost.

## Solution

Wire the tested engram fiscal-memory adapter into the production flow that
actually executes fiscal decisions, so every material decision/finding/
closing note is captured as an immutable, scoped, provenance-backed
observation in the engram sidecar.

The wiring point is a **decision**, not an implementation detail — it depends
on which flow is production-authoritative (see Decision).

## Key Principles (Gentle AI / Drenyra doctrine)

1. **Memory records; it never authorizes** — "recordar no significa
   autorizar". The wiring captures what was decided/observed with provenance;
   no approval logic moves into engram.
2. **Scope-first** — every memory is scoped to company RUC + fiscal period
   (structural isolation; a different tenant can never retrieve it).
3. **Provenance-preserving** — actor, timestamp, source, evidence refs,
   revision history are immutable and auditable.
4. **Best-effort, never fatal** — an engram outage must never break the
   fiscal flow (record or warn, never throw into the mission/pipeline).
5. **Backward compatible** — existing flows keep working; the wiring is an
   additive observer at decision points.

## Decision — where to wire (fork on pipeline maturity)

### Option A — Mission approval flow (live today, low value)

Wire at `missions.service.reconcileMission`/`approveMission` (the live
paths): when a mission reaches an approved/complete decision state, record a
`tax_decision`/`monthly_closing` memory via `EngramFiscalMemoryRepository`.

- **Pros**: live today; zero new infrastructure; exercises the write path in
  production immediately; the mission-memory recorder (PR #138) already proves
  the best-effort pattern.
- **Cons**: on `main` the monthly-close intent handlers are no-ops — missions
  are status machines, not actual closing pipelines. Recording "mission
  approved" memories captures workflow state, not fiscal substance. Low
  decision value until the real pipeline runs.

### Option B — MonthlyCloseOrchestrator decision points (after M-series merges)

Wire at the orchestrator's decision steps (when the real close pipeline lands
on main): record `tax_decision`/`accounting_criterion`/`monthly_closing`
memories with the actual evidence refs (invoices, SIRE data, journal
postings) each time a step decides.

- **Pros**: captures real fiscal substance with evidence; the natural
  destination of the dormant stack; the `EngramFiscalMemoryRepository` was
  designed for exactly this (evidenceRefs, categories, revisions).
- **Cons**: blocked on the M-series merge; the orchestrator needs its own
  production wiring first.

### Option C — Governance/audit findings service (fiscal-adjacent)

Wire at the governance-audit decision records (`GovernanceAuditRecord`) or a
future audit-findings flow: record `audit_finding` memories.

- **Pros**: audit findings are naturally memory-shaped (category, severity,
  evidence, resolution lifecycle — maps 1:1 to the fiscal-memory model).
- **Cons**: the audit-findings flow itself is not yet a live producer on main.

## Recommendation

**Two-phase, fork on the M-series merge:**

1. **Now (optional, low cost)**: a minimal Option-A probe — record
   `monthly_closing` memories on mission completion (reuse the PR #138
   recorder pattern) behind `DRENYRA_ENGRAM_ENABLED`. Value: proves the
   production write path end-to-end with real scope/provenance; cheap to
   remove if it proves noisy. **Defer** if the M-series merge is imminent.
2. **After the M-series monthly close lands on main**: Option B — wire the
   orchestrator's decision steps as the authoritative fiscal-memory source,
   with Option C (audit findings) as the second consumer when that flow goes
   live.

The **fiscal-memory adapter itself is done and tested** (PR #139 + live
integration 12/12) — this change is purely about choosing and wiring the
production entry point, then adding one integration test per decision point.

## Scope

### In scope (when the destination flow is chosen)
- Wiring `EngramFiscalMemoryRepository` + `FiscalMemoryService` into the
  chosen decision points (constructor injection, factory with
  `isEngramEnabled()` fail-closed gate).
- One integration test per wired decision point (memory recorded with
  correct ruc+period scope, provenance, evidence refs; engram outage →
  warning, flow unaffected).
- `findRevisions` remains fail-closed (`FISCAL_MEMORY_NO_SCOPE`) until the
  domain interface carries a scope.

### Out of scope (this change)
- Implementing the monthly-close pipeline itself (M-series work).
- Multi-jurisdiction fiscal rules (Phase 3 of the engine ROADMAP).
- Publishing the fiscal memory as "truth" — it is advisory institutional
  memory, never an approval.

## Open Questions

1. Which flow is production-authoritative for fiscal decisions on main once
   the M-series merges — the orchestrator, the mission protocol, or both?
2. Who is the `actor` for automated pipeline decisions (system agent id vs.
   the responsible human)?
3. Should memory records trigger RED receipts (drenyra-ai) or is engram
   provenance sufficient for this slice?
4. When is the M-series monthly close expected to merge (gates the
   two-phase plan)?
