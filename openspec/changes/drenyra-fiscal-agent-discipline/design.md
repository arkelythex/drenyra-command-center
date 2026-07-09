# Fiscal Agent Discipline — Design

## Architecture Decisions

### ADR-1: GatedPhasePipeline wraps existing orchestrator, does not replace it

**Status:** ACCEPTED

**Context:** The existing `WorkflowOrchestratorV2` has 2000+ lines of production code with session recovery, circuit breakers, metrics, and event bus integration. Replacing it would risk regressions.

**Decision:** Create `GatedPhasePipeline` as a composable wrapper. The existing orchestrator continues to manage its agent execution; gatekeepers are injected as decorators around each phase execution method.

**Consequences:**

- Existing tests continue to pass without changes
- Gatekeepers can be enabled/disabled per environment via feature flags
- Migration path: existing orchestrator gradually delegates phase execution to `GatedPhasePipeline`

```
// Before: reader.execute(input)
// After: gatedPipeline.runWithGates("reader", [minimalDataGate], input, reader.execute)
```

### ADR-2: FiscalSDDRunner is a separate pipeline, not a modification of WorkflowOrchestrator

**Status:** ACCEPTED

**Context:** WorkflowOrchestrator is optimized for invoice processing (Reader→Parser→Validator→Arbitrator→OSE). Fiscal SDD phases (proposal→spec→design→tasks→apply→verify) have a completely different flow — sequential, human-reviewable, approval-gated.

**Decision:** `FiscalSDDRunner` is an independent class in its own package. It shares types with the existing system (scope, evidence, event bus) but has its own pipeline execution engine.

**Consequences:**

- Zero risk to existing invoice processing
- FiscalSDDRunner can evolve independently
- Shared type contracts (scope, evidence) prevent drift

### ADR-3: Review lenses return verdicts, not errors

**Status:** ACCEPTED

**Context:** Review lenses should compose. A TaxComplianceLens that throws on violation would prevent running EvidenceIntegrityLens on the same evidence. We need aggregate review reports.

**Decision:** Every lens returns `LensResult` with `passed: boolean`, `score: number`, and `findings: LensFinding[]`. The caller (or a LensOrchestrator) aggregates results from multiple lenses into a single `ReviewReport`.

```
ReviewReport = {
  lenses: LensResult[],
  overallScore: number,  // weighted average
  criticalFindings: LensFinding[],
  recommendation: "APPROVE" | "REVIEW" | "REJECT"
}
```

### ADR-4: Evidence hash chain uses existing HashChain VO, not a new chain

**Status:** ACCEPTED

**Context:** The domain already has `HashChain` in `packages/domain/src/audit-ledger/hash-chain.vo.ts`. Creating a new chain for evidence artifacts would fragment the audit trail.

**Decision:** `EvidenceArtifactStore.store()` computes the SHA-256 using existing `computeAuditHash()` (from `audit-ledger/compute-audit-hash.ts`), builds a `HashChain` VO entry, and stores it as an `EvidenceNode`. The engram Go sidecar receives the already-computed hash for its own `EvidenceRecord`.

### ADR-5: RegulatoryChangeLens polls regulation registry, not live SUNAT

**Status:** ACCEPTED

**Context:** The RegulatoryChangeLens needs to know "did the regulation change since this proposal was generated?". Querying SUNAT live is unreliable and slow.

**Decision:** The lens checks against a `RegulationSnapshot` — a cached, versioned snapshot of applicable regulations at the time of proposal generation. If the current snapshot hash differs from the proposal's snapshot hash, the lens reports a finding.

```
interface RegulationSnapshot {
  snapshotId: string;
  capturedAt: string;
  applicableRules: Array<{
    ruleId: string;
    version: string;
    content: string;
  }>;
  hash: string; // SHA-256 of content
}
```

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────┐
│                     Existing System                        │
│                                                            │
│  WorkflowOrchestratorV2                                    │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Reader  │→ │ Parser  │→ │Validator │→ │Arbitrator  │  │
│  └────┬────┘  └────┬────┘  └────┬─────┘  └──────┬─────┘  │
│       │            │            │               │        │
│  ┌────▼────────────▼────────────▼───────────────▼──────┐  │
│  │              GatedPhasePipeline (NEW)                │  │
│  │  preGates[] + phase.execute() + postGates[]         │  │
│  └───────────────────────┬─────────────────────────────┘  │
│                          │ feeds evidence                 │
│  ┌───────────────────────▼─────────────────────────────┐  │
│  │           DrenyraEvidenceArtifactStore (NEW)         │  │
│  │  EvidenceNode + HashChain + engram EvidenceRecord   │  │
│  └───────────────────────┬─────────────────────────────┘  │
│                          │ reviewed by                    │
│  ┌───────────────────────▼─────────────────────────────┐  │
│  │           FiscalReviewLenses (NEW)                   │  │
│  │  TaxCompliance | EvidenceIntegrity | FiscalConsistency│  │
│  │  RegulatoryChange                                   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌──────────────────┐  ┌───────────────────────────────┐  │
│  │FiscalSDDRunner   │  │ CompliancePipeline (NEW)       │  │
│  │(NEW)             │  │ IGV→Detracciones→PLE→SIRE     │  │
│  │Dynamic phases    │  │ reviewable chain               │  │
│  └──────────────────┘  └───────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

## Data Flow

### Phase Execution with Gates

```
1. Pre-gates validate input
2. Phase executes (reader, parser, etc.)
3. Post-gates validate output
4. Evidence artifact created from phase output
5. Hash chain updated
6. Review lenses optionally run on evidence
7. Result passed to next phase or BLOCKED
```

### Compliance Chain Flow

```
1. FiscalRuleChange detected (e.g. IGV 18%→19%)
2. First stage (Detracciones) executes
3. Stage result reviewed → approved?
   YES → next stage (PLE)
   NO → BLOCKED, manual review needed
4. Final stage (SIRE) completes
5. Full compliance report generated
```

## Backward Compatibility

All new packages are opt-in. The existing `WorkflowOrchestratorV2`:

- Continues to work without gatekeepers (feature flag default: false)
- `GatedPhasePipeline` is injected when configured
- No changes to constructor signature, `processInvoice()`, or `recoverRun()`

## Package Dependencies

```
fiscal-sdd
  → domain (scope, evidence types)
  → phase-gatekeeper (for gate integration)
  → domain/fiscal-truth/evidence-artifact-bridge

fiscal-compliance-pipeline
  → domain
  → domain/fiscal-review-lenses
  → domain/fiscal-truth/evidence-artifact-bridge

phase-gatekeeper
  → domain (scope, types)

domain/fiscal-review-lenses
  → domain (types, fiscal-truth)

domain/fiscal-truth/evidence-artifact-bridge
  → domain (audit-ledger, fiscal-truth/entities)
  → engram (client)
```

## Implementation Order (Dependency-Based)

```
PR1: phase-gatekeeper + domain/fiscal-truth/evidence-artifact-bridge
     (foundation: gates + store)

PR2: fiscal-review-lenses
     (depends on evidence-store for review inputs)

PR3: fiscal-sdd
     (depends on gates + store)

PR4: fiscal-compliance-pipeline
     (depends on sdd + lenses + store)
```

## Open Questions

1. **Engram bridge protocol:** Should the Go sidecar expose a gRPC endpoint for evidence artifact storage, or should the TypeScript bridge write directly to the engram SQLite database? Current engram uses HTTP REST. The bridge should call the REST API.

2. **Gatekeeper failure mode on recovery:** When recovering a run via `recoverRun()`, should skipped phases skip gatekeepers too? Decision: yes — if a phase is skipped because it already completed, its gatekeepers are also skipped (the output was already gated when first executed).

3. **RegulationSnapshot source:** Where is the "current regulation snapshot" populated? For now, a manually curated file. Future: periodic scraped from SUNAT/Normas Legales.
