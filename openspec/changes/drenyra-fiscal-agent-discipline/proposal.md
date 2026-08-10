# Fiscal Agent Discipline — SDD Proposal

## Executive Summary

Implementar los 5 gaps del mapping gentle-pi → Drenyra para llevar la madurez del agente fiscal de 70% a 100%:
SDD dinámico, flujos encadenados, lenses contables, gatekeepers entre fases, y evidence → artifact store.

## Current State Assessment

### What exists (70%)

| Component                         | Location                                                          | State                                         |
| --------------------------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| WorkflowOrchestrator (V1)         | `packages/ai/src/agents/orchestrator/workflow.orchestrator.ts`    | Fixed 4-agent pipeline                        |
| WorkflowOrchestrator (V2)         | `packages/ai/src/agents/orchestrator/workflow-v2/orchestrator.ts` | Parallel execution, recovery, circuit breaker |
| DrenyraFiscalCommandCenterService | `packages/application/src/drenyra/service/orchestrator.ts`        | Application-layer fiscal case orchestration   |
| EvidenceNode + EvidenceEdge       | `packages/domain/src/fiscal-truth/entities/`                      | Evidence graph entities                       |
| FiscalTruthEvent                  | `packages/domain/src/fiscal-truth/entities/FiscalTruthEvent.ts`   | Append-only fiscal event                      |
| HashChain VO                      | `packages/domain/src/audit-ledger/hash-chain.vo.ts`               | SHA-256 chain validation                      |
| Capability system                 | `packages/domain/src/drenyra/capabilities.ts`                     | Policy-based grants with scope                |
| Engram (Go sidecar)               | `drenyra-engram` (standalone repo)                               | Evidence record persistence with phases       |
| Audit ledger                      | `packages/domain/src/audit-ledger/`                               | Hash computation + normalization              |

### What's missing (the 5 gaps)

1. **SDD dynamic phase runner** — No generic phase pipeline. Orchestrator is hardcoded to Reader→Parser→Validator→Arbitrator.
2. **Chained compliance workflows** — No mechanism to cascade a fiscal change through dependent subsystems with review gates.
3. **Review lenses contables** — No specialized fiscal review lenses (Tax Compliance, Evidence Integrity, etc.).
4. **Gatekeepers between phases** — Reader passes to Parser even if data is minimal/incomplete. No "is this safe to proceed?" check.
5. **Evidence → artifact store bridge** — Evidence exists but isn't connected to SDD-style phase artifacts.

## Proposal

### Item 1: SDD Dynamic Phase Runner (`packages/fiscal-sdd/`)

Generic pipeline engine that accepts declarative phase definitions:

```typescript
interface FiscalPhase<P, R> {
  name: string
  execute(input: P, context: PhaseContext): Promise<PhaseResult<R>>
  gate?: Gatekeeper<P, R> // Optional post-phase gate
}
```

Replaces the hardcoded pipeline with a registry of phases that can be composed dynamically.

### Item 2: Chained Compliance Workflows (`packages/fiscal-compliance-pipeline/`)

When a fiscal rule changes, define a dependency graph of affected subsystems:

```
IGV rate change → Detracciones recalculation → PLE regeneration → SIRE validation
```

Each link is a reviewable, approvable stage. No stage runs until the previous is approved.

### Item 3: Review Lenses Contables (`packages/domain/src/fiscal-review-lenses/`)

Four specialized review lenses:

| Lens                  | What it checks                                               |
| --------------------- | ------------------------------------------------------------ |
| TaxComplianceLens     | Does the operation comply with current SUNAT regulations?    |
| EvidenceIntegrityLens | Is the hash chain intact? Is the trail continuous?           |
| FiscalConsistencyLens | Do base amounts, IGV, total match? Detracción correct?       |
| RegulatoryChangeLens  | Did the regulation change since this proposal was generated? |

### Item 4: Phase Gatekeepers (`packages/phase-gatekeeper/`)

Gatekeepers that sit between orchestrator phases and validate output before passing to next phase:

```
Reader → Gatekeeper: minimal data present?
  → Parser → Gatekeeper: XML valid against SUNAT XSD?
    → Validator → Gatekeeper: no unresolved conflicts?
      → Arbitrator → Gatekeeper: decision within confidence threshold?
```

### Item 5: Evidence → Artifact Store Bridge (`packages/domain/src/fiscal-truth/evidence-artifact-bridge/`)

Connect the evidence system with phases so every fiscal operation generates:

```
Cited law (spec) → Implemented rule → Passing test → Saved evidence → Audited seal
```

## Affected Packages

| Package                                                      | Action                                |
| ------------------------------------------------------------ | ------------------------------------- |
| `packages/ai/src/agents/orchestrator/`                       | MODIFY — Extract generic pipeline     |
| `packages/fiscal-sdd/`                                       | CREATE — Dynamic phase runner         |
| `packages/fiscal-compliance-pipeline/`                       | CREATE — Chained compliance workflows |
| `packages/domain/src/fiscal-review-lenses/`                  | CREATE — Review lenses                |
| `packages/phase-gatekeeper/`                                 | CREATE — Phase gatekeepers            |
| `packages/domain/src/fiscal-truth/evidence-artifact-bridge/` | CREATE — Evidence → artifact store    |
| `drenyra-engram` (standalone repo)                         | MODIFY — Add evidence phase bridge    |
| `packages/domain/src/drenyra/`                               | MODIFY — Add types if needed          |

## Non-Goals

- No changes to existing fiscal calculation logic (IGV, detracciones)
- No changes to SUNAT/UBL adapters unless needed for type alignment
- No new UI components
- No database migrations

## Estimated Size

~1500-2000 lines across 7+ packages. Requires chained PRs (3-4 PRs).

## Risks

| Risk                                      | Mitigation                                                   |
| ----------------------------------------- | ------------------------------------------------------------ |
| Over-engineering the generic phase runner | Start with concrete fiscal SDD phases, extract generic later |
| Breaking existing orchestrator behavior   | Add gatekeepers behind feature flags, default to passthrough |
| Engram Go package changes                 | Minimal bridge code, no breaking changes to existing API     |
| Chained compliance complexity             | First slice: single known flujo (IGV → Detracciones → SIRE)  |

## Next Steps

1. Spec: Detailed API contracts for each new package
2. Design: Architecture diagram + phase pipeline design
3. Tasks: Implementation breakdown with 400-line review budget
4. Apply: Implement in chained PRs
5. Verify: Validate against existing orchestrator tests + new fiscal compliance tests
