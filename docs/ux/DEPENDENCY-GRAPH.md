# Drenyra SDD Dependency Graph

**Last updated**: 2026-07-14

---

## SIRE Dependency Pack (20 SDDs)

Minimum SDD set needed before a complete SIRE vertical slice can ship. Organized by layer.

### Layer 1 — Language & Contracts

```
SDD-002  Fiscal Domain Language IA     → vocabulary, navigation, entity taxonomy
SDD-006  Fiscal Trust Contracts         → evidence, reversibility, approval, audit contracts
SDD-008  Evidence-First Content Strategy → presentation of fiscal data with evidence
SDD-007  Error Recovery Patterns        → error taxonomy, recovery paths, auto-retry
```

**Dependency flow**: 002 → 006 → 008 → 007

### Layer 2 — Fiscal Trust Core

```
SDD-010  Verified Fiscal Context Propagation  → RUC/period/actor verified per operation
SDD-013  Fiscal Artifact Identity & Versioning → entity identity, versioning, supersession
SDD-014  Evidence & Provenance Graph          → source types, provenance edges, confidence
SDD-015  Human Review & Approval Workflow     → proposal lifecycle, review, approval
SDD-016  Accounting Diff & Materiality Engine → semantic diff, materiality policies
SDD-019  AI Action Safety Contract            → L0-L3 levels, tool boundaries, validators
SDD-020  Durable Fiscal Execution             → idempotency, jobs, recovery, UNKNOWN state
```

**Dependency flow**: 010 → 013 → 014 → 015 → 016 → 019 → 020

### Layer 3 — Experience Platform (SIRE subset)

```
SDD-034  Financial Data Grid          → fiscal table patterns, virtual scroll
SDD-038  Persistent Fiscal Context Bar → RUC badge, period selector, trust bar
SDD-039  Adaptive Workspace & Inspector → canvas + inspector composition
```

**Dependency flow**: 034 → 038 → 039

### Layer 4 — Operational Workspace (SIRE subset)

```
SDD-052  Evidence & Approval Inspector   → evidence panel, approval UI
SDD-053  Accounting Review & Diff Workspace → side-by-side diff workspace
SDD-054  Contextual Agent Interaction     → agent composer scoped to SIRE context
SDD-056  Execution Timeline & Activity     → activity log, job status
```

**Dependency flow**: 052 → 053 → 054 → 056

### Layer 5 — Vertical Slice

```
SDD-072  SIRE Reconciliation Workspace   → matching grid, discrepancy resolution
```

### Layer 6 — Verification

```
SDD-091  Cross-layer Verification Strategy → contract tests, tenant isolation tests, e2e
```

---

## Dependency tree (simplified)

```
SDD-002 ─┐
SDD-006 ─┤
SDD-008 ─┤
SDD-007 ─┤
         ├──▶ SDD-010 ─▶ SDD-013 ─▶ SDD-014 ─▶ SDD-015 ─▶ SDD-016 ─▶ SDD-019 ─▶ SDD-020
         │                                                                    │
         │                                                                    ▼
SDD-034 ─▶ SDD-038 ─▶ SDD-039 ──────────────────────────────────────────▶ SDD-052 ─▶ SDD-053
                                                                                       │
                                                                                       ▼
SDD-091 ◀─────────────────────────────────────────────────────────────── SDD-056 ◀── SDD-054
                                                                                       │
                                                                                       ▼
                                                                                   SDD-072
```

---

## Capability packs (implementation order)

```
CAP-SIRE-00  Audit + Contract Freeze
CAP-SIRE-01  Read-only Reconciliation  (requires: 010 ctx, 020 jobs, 034 grid)
CAP-SIRE-02  Exception Resolution      (requires: 014 evidence, 016 diff)
CAP-SIRE-03  Review and Approval       (requires: 015 approval, 038 context bar, 052/053 inspector/workspace)
CAP-SIRE-04  Submission and Recovery   (requires: 019 L0-L3, 020 durable execution, 091 verification)
```

Each capability pack = 1 implementation phase with review + PR + verification gates.
