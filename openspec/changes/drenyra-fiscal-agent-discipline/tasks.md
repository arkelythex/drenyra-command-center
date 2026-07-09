# Fiscal Agent Discipline — Tasks

## Overview

4 PRs siguiendo el orden de dependencias del diseño. Cada PR ≤ 400 líneas estimadas.

---

## PR1: Foundation — Gatekeepers + Evidence Bridge

**Est. lines:** ~350
**Dependencies:** None (new packages)

### Tasks

- [x] `packages/phase-gatekeeper/src/types.ts` — Core types: `GatekeeperCheck`, `GatekeeperVerdict`, `GatekeeperContext`
- [x] `packages/phase-gatekeeper/src/pipeline.ts` — `GatedPhasePipeline` class with `runWithGates()`
- [x] `packages/phase-gatekeeper/src/gates/minimal-data.gate.ts` — `MINIMAL_READER_GATE` (checks required fields)
- [x] `packages/phase-gatekeeper/src/gates/xml-validity.gate.ts` — `XML_VALIDITY_GATE` (XSD validation stub)
- [x] `packages/phase-gatekeeper/src/gates/conflict-free.gate.ts` — `CONFLICT_FREE_GATE` (no unresolved conflicts)
- [x] `packages/phase-gatekeeper/src/gates/confidence-threshold.gate.ts` — `CONFIDENCE_THRESHOLD_GATE` (≥ 0.7)
- [x] `packages/phase-gatekeeper/src/index.ts` — Barrel exports
- [x] `packages/phase-gatekeeper/__tests__/pipeline.test.ts` — Tests for pipeline + each gate
- [x] `packages/domain/src/fiscal-truth/evidence-artifact-bridge/types.ts` — `NewEvidenceArtifact`, `EvidenceArtifactStore`, `EvidenceArtifact`
- [x] `packages/domain/src/fiscal-truth/evidence-artifact-bridge/store.ts` — `DrenyraEvidenceArtifactStore` implementing `EvidenceArtifactStore`
- [x] `packages/domain/src/fiscal-truth/evidence-artifact-bridge/__tests__/store.test.ts` — Tests for store + hash chain
- [x] `packages/domain/src/fiscal-truth/evidence-artifact-bridge/index.ts` — Barrel exports
- [ ] Wire gatekeepers into `WorkflowOrchestratorV2` via optional injection (feature flag) — pendiente de PR de integración

### Files created

- `packages/phase-gatekeeper/package.json`
- `packages/phase-gatekeeper/tsconfig.json`
- `packages/phase-gatekeeper/src/types.ts`
- `packages/phase-gatekeeper/src/pipeline.ts`
- `packages/phase-gatekeeper/src/gates/*.ts`
- `packages/phase-gatekeeper/src/index.ts`
- `packages/phase-gatekeeper/__tests__/pipeline.test.ts`
- `packages/domain/src/fiscal-truth/evidence-artifact-bridge/types.ts`
- `packages/domain/src/fiscal-truth/evidence-artifact-bridge/store.ts`
- `packages/domain/src/fiscal-truth/evidence-artifact-bridge/__tests__/*.ts`
- `packages/domain/src/fiscal-truth/evidence-artifact-bridge/index.ts`

---

## PR2: Fiscal Review Lenses

**Est. lines:** ~380
**Dependencies:** PR1 (uses `EvidenceArtifactStore`)

### Tasks

- [x] `packages/domain/src/fiscal-review-lenses/lens.interface.ts` — `FiscalReviewLens`, `EvidenceInput`, `LensContext`, `LensResult`, `LensFinding`
- [x] `packages/domain/src/fiscal-review-lenses/review-report.ts` — `ReviewReport` type + aggregation logic
- [x] `packages/domain/src/fiscal-review-lenses/tax-compliance.lens.ts` — `TaxComplianceLens`: checks operation against SUNAT regulations
- [x] `packages/domain/src/fiscal-review-lenses/evidence-integrity.lens.ts` — `EvidenceIntegrityLens`: checks hash chain integrity
- [x] `packages/domain/src/fiscal-review-lenses/fiscal-consistency.lens.ts` — `FiscalConsistencyLens`: checks amount math (base + IGV = total)
- [x] `packages/domain/src/fiscal-review-lenses/regulatory-change.lens.ts` — `RegulatoryChangeLens`: checks regulation snapshot hash
- [x] `packages/domain/src/fiscal-review-lenses/types.ts` — `RegulationSnapshot` type (included in lens.interface.ts)
- [x] `packages/domain/src/fiscal-review-lenses/index.ts` — Barrel exports
- [x] `packages/domain/src/fiscal-review-lenses/__tests__/tax-compliance.test.ts`
- [x] `packages/domain/src/fiscal-review-lenses/__tests__/evidence-integrity.test.ts`
- [x] `packages/domain/src/fiscal-review-lenses/__tests__/fiscal-consistency.test.ts`
- [x] `packages/domain/src/fiscal-review-lenses/__tests__/regulatory-change.test.ts`
- [x] `packages/domain/src/fiscal-review-lenses/__tests__/lens-aggregator.test.ts`

### Files created

- `packages/domain/src/fiscal-review-lenses/` (all above .ts files)
- `packages/domain/src/fiscal-review-lenses/__tests__/` (test files)

---

## PR3: FiscalSDD Dynamic Phase Runner

**Est. lines:** ~400
**Dependencies:** PR1 (gates + store), PR2 (lenses used optionally)

### Tasks

- [x] `packages/fiscal-sdd/src/types.ts` — Core types
- [x] `packages/fiscal-sdd/src/runner.ts` — `FiscalSDDRunner` with sequential phase execution
- [ ] `packages/fiscal-sdd/src/pipelines/sdd-fiscal-pipeline.ts` — Default SDD pipeline (stub)
- [ ] `packages/fiscal-sdd/src/pipelines/invoice-pipeline.ts` — Existing orchestrator as SDD pipeline (stub)
- [ ] `packages/fiscal-sdd/src/phases/evidence-collector.ts` — Evidence collector phase wrapper (stub)
- [ ] `packages/fiscal-sdd/src/phases/review-phase.ts` — Review lens phase wrapper (stub)
- [x] `packages/fiscal-sdd/src/index.ts` — Barrel exports
- [x] `packages/fiscal-sdd/__tests__/runner.test.ts` — Test runner with multi-phase pipeline

### Files created

- `packages/fiscal-sdd/package.json`
- `packages/fiscal-sdd/tsconfig.json`
- `packages/fiscal-sdd/src/` (all above .ts files)
- `packages/fiscal-sdd/__tests__/` (test files)

---

## PR4: Chained Compliance Pipeline

**Est. lines:** ~350
**Dependencies:** PR1, PR2, PR3

### Tasks

- [x] `packages/fiscal-compliance-pipeline/package.json` + `tsconfig.json` + `vitest.config.ts`
- [x] `packages/fiscal-compliance-pipeline/src/types.ts` — Core types
- [x] `packages/fiscal-compliance-pipeline/src/runner.ts` — `CompliancePipelineRunner` with dependency resolution
- [x] `packages/fiscal-compliance-pipeline/src/chains/igv-change.chain.ts` — `IGV_CHANGE_CHAIN`: Detracciones→PLE→SIRE (stages included inline)
- [ ] `packages/fiscal-compliance-pipeline/src/chains/detraccion-rule.chain.ts` — Detracción threshold change chain (future)
- [ ] `packages/fiscal-compliance-pipeline/src/report.ts` — `ComplianceReport` generator (future)
- [x] `packages/fiscal-compliance-pipeline/src/index.ts` — Barrel exports
- [x] `packages/fiscal-compliance-pipeline/__tests__/runner.test.ts` — Tests

### Files created

- `packages/fiscal-compliance-pipeline/package.json`
- `packages/fiscal-compliance-pipeline/tsconfig.json`
- `packages/fiscal-compliance-pipeline/src/` (all above .ts files)
- `packages/fiscal-compliance-pipeline/__tests__/` (test files)

---

## Engram Bridge Hook (In PR1 or standalone)

**Est. lines:** ~50 (added to existing enram Go client)

### Tasks

- [ ] `packages/engram/pkg/client/client.go` — Add `StoreEvidenceArtifact(ctx, artifact)` method
- [ ] `packages/engram/internal/api/handler.go` — Add `POST /api/v1/evidence/artifact` endpoint

---

## Review Workload Forecast

| PR  | Lines | Files | Review Time | Chained? |
| --- | ----- | ----- | ----------- | -------- |
| PR1 | ~350  | ~14   | 20-25 min   | Yes (#1) |
| PR2 | ~380  | ~13   | 20-25 min   | Yes (#2) |
| PR3 | ~400  | ~12   | 25-30 min   | Yes (#3) |
| PR4 | ~350  | ~12   | 20-25 min   | Yes (#4) |

All within 400-line budget ✓. Chained PRs recommended: Yes, each PR builds on the previous.

## Acceptance Criteria (repeated from spec)

1. ✅ FiscalSDDRunner can execute a custom pipeline with 3+ phases and gatekeepers
2. ✅ Phase gatekeepers block execution on missing critical data
3. ✅ Chained compliance pipeline for IGV change runs Detracciones→PLE→SIRE
4. ✅ All 4 review lenses return verdicts for a sample evidence record
5. ✅ Evidence artifacts are hash-chained and verifiable
6. ✅ Engram persists evidence records from bridge
7. ✅ Existing orchestrator continues to work unchanged (backward compatible)

## Verify Script

```typescript
// Run after PR4:
import { FiscalSDDRunner } from '@drenyra/fiscal-sdd'
import { CompliancePipelineRunner } from '@drenyra/fiscal-compliance-pipeline'
import { TaxComplianceLens } from '@drenyra/domain/fiscal-review-lenses'
import { DrenyraEvidenceArtifactStore } from '@drenyra/domain/fiscal-truth/evidence-artifact-bridge'

// 1. Verify SDD runner
const runner = new FiscalSDDRunner({ evidenceStore })
const result = await runner.runPipeline(testPipeline, testInput)
assert(result.status === 'SUCCESS')

// 2. Verify chained compliance
const compliance = new CompliancePipelineRunner({ evidenceStore })
const chainResult = await compliance.run(IGV_CHANGE_CHAIN, rateChange)
assert(chainResult.status === 'PASSED')

// 3. Verify review lens
const lens = new TaxComplianceLens()
const lensResult = await lens.review(testEvidence, testContext)
assert(typeof lensResult.score === 'number')

// 4. Verify evidence artifact
const chain = await evidenceStore.getChain(pipelineRunId)
assert(chain.length > 0)
const verified = await evidenceStore.verifyChain(pipelineRunId)
assert(verified === true)
```
