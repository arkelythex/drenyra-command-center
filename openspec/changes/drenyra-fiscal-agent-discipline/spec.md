# Fiscal Agent Discipline — Spec

## Overview

Spec detallado de contratos, APIs, tipos y responsabilidades para cada uno de los 5 componentes del Fiscal Agent Discipline.

---

## 1. FiscalSDD — Dynamic Phase Runner

**Package:** `packages/fiscal-sdd/`

### Core Types

```typescript
// packages/fiscal-sdd/src/types.ts

/** Phase definition */
export interface FiscalPhaseDef<P = unknown, R = unknown> {
  name: string
  description: string
  version: string
  execute: (input: P, ctx: PhaseContext) => Promise<PhaseResult<R>>
  gate?: PhaseGatekeeper<P, R>
}

/** Context available to every phase */
export interface PhaseContext {
  runId: string
  scope: FiscalSDDScope
  evidenceStore: EvidenceArtifactStore
  previousPhaseResults: Map<string, unknown>
  metadata: Record<string, unknown>
}

/** Phase execution result */
export interface PhaseResult<R = unknown> {
  status: 'SUCCESS' | 'BLOCKED' | 'MANUAL_REVIEW' | 'FAILED'
  output: R
  gatesPassed: GateResult[]
  evidenceArtifacts: NewEvidenceArtifact[]
  errors: string[]
  confidence: number // 0-1
}

/** Gatekeeper that validates phase output */
export interface PhaseGatekeeper<P, R> {
  name: string
  validate: (input: P, output: R, ctx: PhaseContext) => Promise<GateResult>
}

export interface GateResult {
  name: string
  passed: boolean
  reason: string
  severity: 'BLOCKING' | 'WARNING' | 'INFO'
}

/** SDD-like fiscal pipeline definition */
export interface FiscalSDDPipeline {
  id: string
  name: string
  phases: FiscalPhaseDef[]
  onGateBlocked: 'STOP' | 'WARN_CONTINUE' | 'ESCALATE'
}
```

### Pipeline Runner

```typescript
// packages/fiscal-sdd/src/runner.ts

export class FiscalSDDRunner {
  constructor(
    private options: {
      evidenceStore: EvidenceArtifactStore
      eventBus?: EventBus
    }
  ) {}

  async runPipeline<P>(
    pipeline: FiscalSDDPipeline,
    initialInput: P,
    runId?: string
  ): Promise<PipelineResult> {
    // Execute phases sequentially
    // After each phase: run gatekeeper
    // If gate blocks: STOP / WARN_CONTINUE / ESCALATE based on pipeline config
    // Collect evidence artifacts from each phase
  }
}
```

### Dependency: None on existing orchestrator

### Inversion: Orchestrator will use FiscalSDDRunner for dynamic phases

---

## 2. Fiscal Compliance Pipeline

**Package:** `packages/fiscal-compliance-pipeline/`

### Types

```typescript
// packages/fiscal-compliance-pipeline/src/types.ts

/** A change in a fiscal rule */
export interface FiscalRuleChange {
  changeId: string
  ruleType: 'RATE' | 'THRESHOLD' | 'SCHEMA' | 'REQUIREMENT'
  affectedRegulation: string // Law/article reference
  oldValue: unknown
  newValue: unknown
  effectiveDate: string
}

/** A compliance stage in the chain */
export interface ComplianceStage {
  stageId: string
  name: string
  description: string
  affectedSubsystem: string
  requiredApproval: boolean
  dependsOn: string[] // stageIds
  execute: (
    change: FiscalRuleChange,
    ctx: ComplianceContext
  ) => Promise<ComplianceStageResult>
}

export interface ComplianceContext {
  evidenceStore: EvidenceArtifactStore
  fiscalReviewLenses: FiscalReviewLens[]
}

export interface ComplianceStageResult {
  status: 'PASSED' | 'REVIEW_NEEDED' | 'BLOCKED'
  evidenceId: string
  findings: ComplianceFinding[]
  confidence: number
}
```

### Compliance chain registry

```typescript
// IGV rate change → Detracciones → PLE → SIRE
export const IGV_CHANGE_CHAIN: ComplianceStage[] = [
  { stageId: "detracciones", name: "Detracciones Recalc", dependsOn: [], ... },
  { stageId: "ple", name: "PLE Regeneration", dependsOn: ["detracciones"], ... },
  { stageId: "sire", name: "SIRE Validation", dependsOn: ["ple"], ... },
];
```

---

## 3. Fiscal Review Lenses

**Package:** `packages/domain/src/fiscal-review-lenses/`

### Core Interface

```typescript
// packages/domain/src/fiscal-review-lenses/lens.interface.ts

export interface FiscalReviewLens {
  name: string
  id: string
  version: string
  review: (evidence: EvidenceInput, ctx: LensContext) => Promise<LensResult>
}

export interface EvidenceInput {
  operationId: string
  phase: FdPhase
  input: unknown
  output: unknown
  reasoning: string
  actor: 'ai' | 'human' | 'system'
  metadata: Record<string, unknown>
}

export interface LensContext {
  scope: FiscalTruthScope
  fiscalCalendar: { year: number; period: string }
  applicableRegulations: RegulationSnapshot[]
}

export interface LensResult {
  passed: boolean
  score: number // 0-1
  findings: LensFinding[]
  confidence: number
}

export interface LensFinding {
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  code: string
  message: string
  evidence: string
}
```

### Four Lenses

```typescript
// TaxComplianceLens — Does the operation comply with current SUNAT regulations?
export class TaxComplianceLens implements FiscalReviewLens { ... }

// EvidenceIntegrityLens — Is the hash chain intact?
export class EvidenceIntegrityLens implements FiscalReviewLens { ... }

// FiscalConsistencyLens — Do base amounts, IGV, total match?
export class FiscalConsistencyLens implements FiscalReviewLens { ... }

// RegulatoryChangeLens — Did regulation change since proposal?
export class RegulatoryChangeLens implements FiscalReviewLens { ... }
```

---

## 4. Phase Gatekeepers

**Package:** `packages/phase-gatekeeper/`

### Types

```typescript
// packages/phase-gatekeeper/src/types.ts

export interface GatekeeperCheck<I> {
  name: string
  description: string
  check: (data: I, ctx: GatekeeperContext) => Promise<GatekeeperVerdict>
}

export interface GatekeeperVerdict {
  passed: boolean
  reasons: string[]
  severity: 'BLOCKING' | 'WARNING' | 'INFO'
  details: Record<string, unknown>
}

export interface GatekeeperContext {
  scope: FiscalTruthScope
  evidenceStore: EvidenceArtifactStore
  previousGates: Map<string, GatekeeperVerdict>
}
```

### Gates for existing orchestrator phases

```typescript
// After Reader: minimal data present check
export const MINIMAL_READER_GATE: GatekeeperCheck<ExtractedData> = {
  name: "MinimalDataGate",
  check: (data) => {
    const required = ["issuerRuc", "invoiceNumber", "total"];
    const missing = required.filter(f => !data.extractedData[f]);
    return { passed: missing.length === 0, ... };
  },
};

// After Parser: XML valid against SUNAT XSD
export const XML_VALIDITY_GATE: GatekeeperCheck<ParsedInvoice> = { ... };

// After Validator: no unresolved conflicts
export const CONFLICT_FREE_GATE: GatekeeperCheck<ValidationResult> = { ... };

// After Arbitrator: confidence threshold
export const CONFIDENCE_THRESHOLD_GATE: GatekeeperCheck<ArbitrationResult> = {
  name: "ConfidenceGate",
  check: (result) => ({
    passed: result.confidence >= 0.7,
    ...
  }),
};
```

### Integration

```typescript
// packages/phase-gatekeeper/src/pipeline.ts

export class GatedPhasePipeline {
  async runWithGates<I, O>(
    phase: { name: string; execute: (input: I) => Promise<O> },
    gates: GatekeeperCheck<I | O>[],
    input: I
  ): Promise<{ output: O; gateResults: GatekeeperVerdict[] }> {
    // 1. Run pre-execution gates
    // 2. Execute phase
    // 3. Run post-execution gates
    // 4. If any BLOCKING gate fails, return BLOCKED
  }
}
```

---

## 5. Evidence → Artifact Store Bridge

**Package:** `packages/domain/src/fiscal-truth/evidence-artifact-bridge/`

### Types

```typescript
// packages/domain/src/fiscal-truth/evidence-artifact-bridge/types.ts

/** An evidence artifact produced during an SDD/fiscal phase */
export interface NewEvidenceArtifact {
  artifactId: string
  phase: string
  pipelineRunId: string
  evidenceKind: 'INPUT' | 'OUTPUT' | 'GATE_RESULT' | 'REVIEW_FINDING'
  content: unknown
  hash: string
  parentHash: string | null // Previous artifact in chain
  createdAt: string
}

/** Bridge that stores evidence artifacts */
export interface EvidenceArtifactStore {
  store: (artifact: NewEvidenceArtifact) => Promise<EvidenceArtifact>
  getChain: (pipelineRunId: string) => Promise<EvidenceArtifact[]>
  verifyChain: (pipelineRunId: string) => Promise<boolean>
}

/** Stored, hash-chained evidence artifact */
export interface EvidenceArtifact extends NewEvidenceArtifact {
  storedAt: string
  hashChainVerified: boolean
}
```

### Bridge Implementation

```typescript
// Uses existing:
// - HashChain from @drenyra/domain/audit-ledger
// - EvidenceRecord from @drenyra/engram
// - EvidenceNode + EvidenceEdge from @drenyra/domain/fiscal-truth

export class DrenyraEvidenceArtifactStore implements EvidenceArtifactStore {
  constructor(
    private evidenceRepo: EvidenceRepository,
    private engramClient: EngramClient // Go sidecar
  ) {}

  async store(artifact: NewEvidenceArtifact): Promise<EvidenceArtifact> {
    // 1. Compute SHA-256 hash
    // 2. Link to previous artifact in run
    // 3. Store as EvidenceNode in domain
    // 4. Persist as EvidenceRecord in engram
    // 5. Return stored artifact with chain verification
  }
}
```

---

## Integration Points

```
┌───────────────────────────────────────────────────────────────┐
│                    Existing Orchestrator                       │
│  Reader → Gatekeeper → Parser → Gatekeeper → Validator → ...  │
└───────────────────────────┬───────────────────────────────────┘
                            │ uses
┌───────────────────────────▼───────────────────────────────────┐
│                  GatedPhasePipeline (NEW)                       │
│  Wraps each phase with pre/post gatekeepers                    │
└───────────────────────────┬───────────────────────────────────┘
                            │ feeds
┌───────────────────────────▼───────────────────────────────────┐
│              EvidenceArtifactStore (NEW bridge)                 │
│  Each phase output → EvidenceNode + engram EvidenceRecord      │
└───────────────────────────┬───────────────────────────────────┘
                            │ reviewed by
┌───────────────────────────▼───────────────────────────────────┐
│              FiscalReviewLenses (NEW)                           │
│  TaxCompliance | EvidenceIntegrity | FiscalConsistency | ...   │
└───────────────────────────┬───────────────────────────────────┘
                            │ orchestrated by
┌───────────────────────────▼───────────────────────────────────┐
│              FiscalSDDRunner (NEW)                              │
│  Dynamic phase pipeline for fiscal rule changes                │
└───────────────────────────────────────────────────────────────┘
```

## Acceptance Criteria

1. FiscalSDDRunner can execute a custom pipeline with 3+ phases and gatekeepers
2. Phase gatekeepers block execution on missing critical data
3. Chained compliance pipeline for IGV change runs Detracciones→PLE→SIRE
4. All 4 review lenses return verdicts for a sample evidence record
5. Evidence artifacts are hash-chained and verifiable
6. Engram persists evidence records from bridge
7. Existing orchestrator continues to work unchanged (backward compatible)
