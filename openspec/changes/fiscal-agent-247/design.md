# Design: Fiscal Agent 24/7 — Autonomous Recurring Fiscal Worker

**Change**: fiscal-agent-247  
**Status**: design  
**Date**: 2026-07-03  

## Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│  API Layer (apps/api/src/features/fiscal-agent/)        │
│  Routes: GET /fiscal-agent/reports, POST /corrections   │
│  Scheduler: cron registration, manual trigger           │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Application Layer (packages/application/)               │
│  FiscalNightlyRunUseCase — orchestrates 5 steps          │
│  CorrectionUseCase — process user feedback              │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Infrastructure Layer (packages/infrastructure/)          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Queue: fiscal-agent (BullMQ repeatable)         │   │
│  │  Steps: Collector → Categorizer → Calculator     │   │
│  │         → Reconciler → Reporter → Learner        │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Existing: SIRE, OSE, TaxRegime, PCGE agents,    │   │
│  │  Evidence/FAL, SunatApiClient, ReviewQueue       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Step Interfaces

Each step implements `FiscalAgentStep`:

```typescript
export interface FiscalAgentStep<TInput, TOutput> {
  readonly name: string;
  execute(input: TInput, context: StepContext): Promise<StepResult<TOutput>>;
}

export interface StepContext {
  organizationId: number;
  companyId: string;
  period: string; // YYYYMM
  runId: string;
  logger: Logger;
  fal: EvidencePort;
}

export interface StepResult<T> {
  success: boolean;
  data?: T;
  errors: StepError[];
  warnings: string[];
  metrics: StepMetrics;
}
```

### Pipeline Orchestration

```typescript
export class FiscalNightlyRunUseCase {
  async execute(orgId: number): Promise<RunReport> {
    // 1. Create run record in FAL
    // 2. Execute each step sequentially
    // 3. Each step saves intermediate state to FAL
    // 4. On step failure: retry (3x) or skip + log
    // 5. Generate final report
    // 6. Push exceptions to review queue
  }
}
```

### Review Queue Integration

Each exception (low-confidence categorization, SUNAT discrepancy, anomaly) creates a `ReviewQueueItem`:

```typescript
interface FiscalAgentException {
  type: "LOW_CONFIDENCE_CATEGORIZATION" | "SUNAT_DISCREPANCY" 
      | "AMOUNT_MISMATCH" | "IGV_CALCULATION_ANOMALY" | "MISSING_DOCUMENT";
  severity: "LOW" | "MEDIUM" | "HIGH";
  transactionId: string;
  suggestedAction: string;
  confidence: number;
  details: Record<string, unknown>;
}
```

### Learning Mechanism

Corrections are stored and used to improve future runs:

```typescript
interface CorrectionRecord {
  transactionId: string;
  originalCategory: string;
  correctedCategory: string;
  userId: string;
  timestamp: Date;
  reason?: string;
}
```

Corrections are applied:
- Same vendor → same category (vendor-based learning)
- Same description pattern → same category (pattern matching)
- Same account → similar transactions

## Data Flow

```
Trigger → Queue → Step 1 (Collect)
                     │
                     ▼
                  Step 2 (Categorize)
                     │
                     ▼
                  Step 3 (Calculate)
                     │
                     ▼
                  Step 4 (Reconcile)
                     │
                     ▼
                  Step 5 (Report)
                     │
                     ├──→ Review Queue (exceptions)
                     ├──→ FAL (audit trail)
                     └──→ Response to caller
```

## Error Handling

- Each step: 3 retries with exponential backoff (2s, 4s, 8s)
- Non-fatal errors: skip item, log warning, continue pipeline
- Fatal errors (SUNAT down, DB connection lost): abort run, alert admin
- Partial results: report what succeeded + what failed

## Security

- All operations scoped by organizationId
- No direct SUNAT submission (review + approve required)
- All mutations logged to FAL before execution
- API endpoints require authentication + org scope
