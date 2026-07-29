# Design: CAP-SIRE-01 — SIRE Reconciliation Implementation

**Change:** CAP-SIRE-01
**Source spec:** `openspec/changes/CAP-SIRE-01/spec.md` (20 requirements, 5 phases)
**Source proposal:** `openspec/changes/CAP-SIRE-01/proposal.md`
**Delivery:** auto-chain, 5 sequential PRs (Phase A → E)
**Strict TDD:** `true` — RED (fail) → GREEN (pass) → REFACTOR

---

## Architecture Overview

### System Context

CAP-SIRE-01 introduces three cross-cutting concerns layered over the existing SIRE subsystem:

```
┌────────────────────────────────────────────────────────────┐
│  apps/web (React + TanStack Router)                        │
│  ┌──────────┐  ┌───────────────┐  ┌────────────────────┐  │
│  │ SIRE     │  │ EvidenceBadge │  │ VirtualizedDiffGrid│  │
│  │ DiffPage │  │ (Phase C)     │  │ (Phase E)          │  │
│  │ (Phase E)│  └───────────────┘  └────────────────────┘  │
│  └──────────┘                                             │
├────────────────────────────────────────────────────────────┤
│  apps/api (Elysia)                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ /api/sire/*  routes (12+ existing, 1 new revert)     │  │
│  │                                                      │  │
│  │ ┌──────────────────┐ ┌───────────────────────────┐   │  │
│  │ │ companyScopeGuard │ │ FiscalPeriodGuard (Phase A)│   │  │
│  │ └──────────────────┘ └───────────────────────────┘   │  │
│  │                                                      │  │
│  │ Services:                                            │  │
│  │ ┌─────────────────────┐ ┌────────────────────────┐  │  │
│  │ │ SireDiffService      │ │ SireEvidenceService    │  │  │
│  │ │ (existing, extended) │ │ (Phase B, new)         │  │  │
│  │ ├─────────────────────┤ ├────────────────────────┤  │  │
│  │ │ buildSummary         │ │ SireReconcilerService  │  │  │
│  │ │ (Phase C, extended)  │ │ (Phase D, new)         │  │  │
│  │ └─────────────────────┘ └────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────┤
│  packages/persistence (Drizzle ORM)                        │
│  ┌───────────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │ core.schema   │ │ sire.schema  │ │ evidence-nodes.  │  │
│  │ +threshold    │ │ +UNKNOWN     │ │ schema (Phase B) │  │
│  │ +reversibility│ │ +payload_b64 │ │ evidence-edges.  │  │
│  │ (Phase C)     │ │ +RECONCILING │ │ schema (Phase B) │  │
│  │               │ │ (Phase D)    │ │                  │  │
│  └───────────────┘ └──────────────┘ └──────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ PostgreSQL: additive migrations only (REQ-X-002)     │  │
│  │ Append-only evidence tables (REQ-B-003)              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Phase Dependency Flow

```
Phase A (SDD-010)  ──┐
  fiscalPeriodId      │
                      ├──→ Phase B (SDD-014) ──┐
                      │   evidence_nodes,       │
                      │   evidence_edges,       │
                      │   hash chain            │
                      │                         ├──→ Phase C (SDD-016+006/008) ──┐
                      │                         │   badges, threshold,          │
                      │                         │   reversibility               │
                      │                         │                               ├──→ Phase D (SDD-020) ──┐
                      │                         │                               │   UNKNOWN, reconciler   │
                      │                         │                               │                         ├──→ Phase E (SDD-072+034+002)
                      │                         │                               │                         │   UX, workspace, vocab
                      │                         │                               │                         │
                      │                         │                               │                         │
```

**Phase B and C partial overlap:** badge component (Phase C) development can begin while Phase B evidence schema stabilizes, but Phase C MUST NOT merge before Phase B.

### Key Cross-Phase Data Flows

1. **Phase A → Phase B**: `fiscalPeriodId` from `TenantSunatContext` constrains `evidence_nodes.period` and `evidence_nodes.company_id` scoping. Every evidence node is company+period scoped.

2. **Phase B → Phase C**: `evidence_nodes.id` is the foreign key target for badge data resolution. When rendering a badge for a diff value, the system queries evidence nodes by `(company_id, period, type='DerivedArtifact')` to retrieve the evidence chain. Reversibility creates new evidence nodes for audit trail.

3. **Phase D → Phase E**: `SireReconcilerService` state transitions (`UNKNOWN → RECONCILING → COMPLETED/FAILED_RETRYABLE`) feed into the workspace step pipeline. The workspace's "reconcile" step displays reconciliation status.

---

## Phase A: Fiscal Context (SDD-010)

### Architecture Decisions

**Decision 1: Extend `TenantSunatContext`, not create a new wrapper**

- `fiscalPeriodId` is added as an optional field to the existing `TenantSunatContext` interface
- `resolveTenantSunatContext` gains a new parameter `period?: string` for optional period validation
- This avoids type fragmentation and keeps credential resolution unchanged
- **Rationale:** The spec mandates preservation of existing credential logic (REQ-A-004). Adding to the existing type is the minimal change.

**Decision 2: Fiscal period validation as a route-level concern**

- Fiscal period validation is NOT done inside `resolveTenantSunatContext` itself
- Instead, a new `resolveFiscalPeriodId` helper is called at the route handler level, BEFORE `resolveTenantSunatContext`
- The period validation returns `fiscalPeriodId`, which is then passed to `resolveTenantSunatContext` to attach to the context
- **Rationale:** `resolveTenantSunatContext` is a no-secrets credential resolver; mixing fiscal calendar logic would violate its single responsibility. Route-level validation ensures all 12+ routes benefit without changing the credential resolver's contract.

**Decision 3: Fiscal calendar resolution via database query**

- A `FiscalCalendarService.getFiscalPeriodId(companyId, period)` queries the `accounting_periods` table
- Returns `{ fiscalPeriodId: string }` or throws if period not found
- **Rationale:** The spec already hints at fiscal calendar entries. The existing `accountingPeriods` table has the necessary company+period structure.

### File Changes

| File                                                                  | Action     | Purpose                                                                                                              |
| --------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `apps/api/src/features/sire/types.ts`                                 | MODIFY     | Add `fiscalPeriodId?: string` to `TenantSunatContext`                                                                |
| `apps/api/src/features/sire/services/tenant-sunat-context.service.ts` | MODIFY     | Add `period?: string` to `ResolveTenantSunatContextInput`; append `fiscalPeriodId` to return                         |
| `apps/api/src/features/sire/services/fiscal-period.service.ts`        | **CREATE** | `resolveFiscalPeriodId(companyId, period)` — queries `accountingPeriods`                                             |
| `apps/api/src/features/sire/index.ts`                                 | MODIFY     | Inject `fiscalPeriodId` resolution in route pipeline (before `resolveTenantSunatContext` call in each route handler) |
| `apps/api/src/features/sire/routes/diff.route.ts`                     | MODIFY     | Add `fiscalPeriodId` resolution before `buildThreeWayDiff`                                                           |
| `apps/api/src/features/sire/routes/submit.route.ts`                   | MODIFY     | Add `fiscalPeriodId` resolution before submit                                                                        |
| `apps/api/src/features/sire/routes/analyze.route.ts`                  | MODIFY     | Add `fiscalPeriodId` resolution before analyze                                                                       |
| `apps/api/src/features/sire/routes/reporting.route.ts`                | MODIFY     | Add `fiscalPeriodId` resolution before reporting queries                                                             |
| `apps/api/src/features/sire/routes/diff-commit.route.ts`              | MODIFY     | Add `fiscalPeriodId` resolution before commit                                                                        |
| `docs/architecture/tenant-access-matrix.md`                           | **CREATE** | Stub documenting SIRE route guard coverage                                                                           |

### Data Model Changes

No schema changes in Phase A. The `accountingPeriods` table already exists:

```ts
// Already in packages/persistence/src/schema/accounting.schema.ts
export const accountingPeriods = pgTable('accounting_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(),
  period: varchar('period', { length: 7 }).notNull(), // "2026-03"
  // ... existing columns
})
```

**Resolution query:**

```sql
SELECT id FROM accounting_periods
WHERE company_id = $1 AND period = $2
LIMIT 1;
```

### Service Layer

```ts
// apps/api/src/features/sire/services/fiscal-period.service.ts

export class FiscalPeriodValidationError extends Error {
  constructor(
    readonly code: 'FISCAL_PERIOD_INVALID',
    readonly companyId: string,
    readonly period: string
  ) {
    super(`Fiscal period "${period}" is not valid for company ${companyId}`)
  }
}

export async function resolveFiscalPeriodId(
  companyId: string,
  period: string
): Promise<string> {
  const rows = await db
    .select({ id: accountingPeriods.id })
    .from(accountingPeriods)
    .where(
      and(
        eq(accountingPeriods.companyId, companyId),
        eq(accountingPeriods.period, period)
      )
    )
    .limit(1)

  if (!rows[0]) {
    throw new FiscalPeriodValidationError(
      'FISCAL_PERIOD_INVALID',
      companyId,
      period
    )
  }
  return rows[0].id
}
```

**TenantSunatContext extension:**

```ts
// Modified TenantSunatContext
export interface TenantSunatContext {
  companyId: string
  ruc: string
  credential: SunatCredentialIdentity
  fiscalPeriodId?: string // NEW — resolved from fiscal calendar
}

// Modified ResolveTenantSunatContextInput
export interface ResolveTenantSunatContextInput {
  companyId: string
  scope: SunatCredentialScope
  deprecatedEnvRuc?: string | null
  suppliedRuc?: string | null
  fiscalPeriodId?: string // NEW — pre-resolved by caller
}

// resolveTenantSunatContext: if input.fiscalPeriodId is provided,
// attach it to the return object verbatim (already validated by caller)
```

### Route Integration Pattern

Each SIRE route handler follows this pattern:

```ts
// BEFORE (existing)
;async ({ body, query }) => {
  const tenantSunatContext = await resolveTenantSunatContext({
    companyId: query.companyId,
    scope: 'sire.submit',
  })
  // ... business logic
}

// AFTER (Phase A)
;async ({ body, query, set }) => {
  // Step 1: validate fiscal period
  const fiscalPeriodId = await resolveFiscalPeriodId(
    query.companyId,
    query.period
  )

  // Step 2: resolve tenant context with fiscal period
  const tenantSunatContext = await resolveTenantSunatContext({
    companyId: query.companyId,
    scope: 'sire.submit',
    fiscalPeriodId, // pre-resolved
  })
  // ... business logic
}
```

**Period-free routes** (e.g., credential status check) skip step 1.

### Testing Strategy (Strict TDD Order)

1. **RED** — Write unit test for `resolveFiscalPeriodId` with valid period → expect `fiscalPeriodId` string
2. **GREEN** — Implement `FiscalPeriodService.resolveFiscalPeriodId`
3. **RED** — Write unit test for `resolveFiscalPeriodId` with invalid period → expect `FiscalPeriodValidationError`
4. **GREEN** — Add error throwing
5. **RED** — Write unit test for `resolveTenantSunatContext` with `fiscalPeriodId` input → expect it in return
6. **GREEN** — Add `fiscalPeriodId` to `TenantSunatContext` type and resolver
7. **RED** — Write integration test: cross-company period isolation (company A period → rejected for company B)
8. **GREEN** — Ensure query scoping by `companyId`
9. **RED** — Write route-level test: `POST /api/sire/diff` with invalid period → HTTP 422, `FISCAL_PERIOD_INVALID`
10. **GREEN** — Add fiscal period validation to diff route
11. **RED** — Property-based test: for any valid `(companyId, period)` pair in fiscal calendar, `fiscalPeriodId` is non-empty string
12. **GREEN** — Verify with `fast-check`

### PR Boundary — Phase A

**PR #1 delivers:**

- `fiscalPeriodId` in `TenantSunatContext`
- `FiscalPeriodService.resolveFiscalPeriodId`
- Period validation on ALL SIRE routes that accept a `period` parameter
- `docs/architecture/tenant-access-matrix.md` stub
- All SIRE routes reject invalid periods with HTTP 422 + `FISCAL_PERIOD_INVALID`

**NOT in this PR:**

- Evidence tables (Phase B)
- Badges/thresholds (Phase C)
- UNKNOWN state (Phase D)
- UX changes (Phase E)

---

## Phase B: Evidence & Provenance (SDD-014)

### Architecture Decisions

**Decision 1: NEW `evidence_nodes` / `evidence_edges` tables, separate from `fiscal_evidence_nodes`**

- The spec explicitly mandates new tables with columns: `id`, `type`, `artifact_id`, `period`, `company_id`, `hash`, `created_at` for `evidence_nodes`
- The existing `fiscal_evidence_nodes` / `fiscal_evidence_edges` in `fiscal-truth.schema.ts` serve a different purpose (fiscal truth event sourcing with `companyRuc`, `traceId`, `correlationId`, `validatorSetVersion`, etc.)
- New tables are SIRE-specific and follow the simplified column spec
- **Rationale:** These tables serve SIRE reconciliation specifically, not the full fiscal truth event-sourcing pattern. Schema isolation prevents future fiscal-truth migrations from affecting SIRE evidence.

**Decision 2: Append-only enforced at DB level via REVOKE, not trigger**

- Application role `app_role` has `UPDATE` and `DELETE` permissions revoked on `evidence_nodes` and `evidence_edges`
- This is enforced in the migration SQL, not in application code
- **Rationale:** DB-level enforcement is stronger than application-level. A trigger adds overhead; permission revocation is declarative and auditable.

**Decision 3: Hash chain computed in TypeScript, not in PostgreSQL**

- `SHA-256(previous_hash + artifact_hash)` where `artifact_hash = SHA-256(JSON.stringify(canonical_artifact_payload))`
- Uses Node.js `crypto.createHash('sha256')` — same as existing `tenant-sunat-context.service.ts` pattern
- JSON serialization MUST use sorted keys via a stable serializer
- **Rationale:** Deterministic hash computation requires control over JSON serialization order. A PostgreSQL function would be less portable and harder to test deterministically. Using the same `crypto` module as existing code maintains consistency.

**Decision 4: Evidence created atomically within diff generation transaction**

- `SireDiffService.buildThreeWayDiff` wraps diff + evidence node + edges in a single DB transaction
- If any step fails, the entire transaction rolls back (no partial evidence)
- **Rationale:** REQ-B-005 requires atomicity. A failed diff must not leave orphan evidence nodes.

**Decision 5: `SireEvidenceService` as a separate service**

- Not inlined into `SireDiffService` to keep responsibilities separate
- `SireDiffService` calls `SireEvidenceService.createDerivedArtifactNode(...)` during diff generation
- **Rationale:** Separation of concerns; `SireEvidenceService` can be independently tested with mocked artifacts.

### File Changes

| File                                                           | Action     | Purpose                                                                          |
| -------------------------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| `packages/persistence/src/schema/evidence-nodes.schema.ts`     | **CREATE** | `evidence_nodes` table definition                                                |
| `packages/persistence/src/schema/evidence-edges.schema.ts`     | **CREATE** | `evidence_edges` table definition                                                |
| `packages/persistence/src/schema/index.ts`                     | MODIFY     | Export new tables                                                                |
| `packages/persistence/drizzle/XXXX_add_evidence_tables.sql`    | **CREATE** | Additive migration + REVOKE statements                                           |
| `apps/api/src/features/sire/services/sire-evidence.service.ts` | **CREATE** | `SireEvidenceService` — create nodes, edges, hash chain                          |
| `apps/api/src/features/sire/services/sire-diff.service.ts`     | MODIFY     | Call `SireEvidenceService` within `buildThreeWayDiff` transaction                |
| `apps/api/src/features/sire/types.ts`                          | MODIFY     | Add `EvidenceNode`, `EvidenceEdge`, `EvidenceNodeType`, `EvidenceEdgeType` types |

### Data Model Changes

```ts
// packages/persistence/src/schema/evidence-nodes.schema.ts

import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const evidenceNodes = pgTable('evidence_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 50 }).notNull(), // "DerivedArtifact" initially
  artifactId: uuid('artifact_id'), // FK to sire_comparisons.id
  period: varchar('period', { length: 7 }).notNull(), // "2026-03"
  companyId: uuid('company_id').notNull(), // FK to companies.id
  hash: varchar('hash', { length: 64 }).notNull(), // SHA-256 hex
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

```ts
// packages/persistence/src/schema/evidence-edges.schema.ts

import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const evidenceEdges = pgTable('evidence_edges', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromNodeId: uuid('from_node_id')
    .notNull() // FK to evidence_nodes.id
    .references(() => evidenceNodes.id),
  toNodeId: uuid('to_node_id')
    .notNull() // FK to evidence_nodes.id
    .references(() => evidenceNodes.id),
  edgeType: varchar('edge_type', { length: 50 }).notNull(), // "derived_from" | "supersedes"
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

**Migration SQL (additive only):**

```sql
CREATE TABLE evidence_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  artifact_id UUID,
  period VARCHAR(7) NOT NULL,
  company_id UUID NOT NULL,
  hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE evidence_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id UUID NOT NULL REFERENCES evidence_nodes(id),
  to_node_id UUID NOT NULL REFERENCES evidence_nodes(id),
  edge_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Append-only enforcement
REVOKE UPDATE, DELETE ON evidence_nodes FROM app_role;
REVOKE UPDATE, DELETE ON evidence_edges FROM app_role;
```

### Service Layer

```ts
// apps/api/src/features/sire/services/sire-evidence.service.ts

import { createHash } from "node:crypto";
import { db } from "@drenyra/persistence/client";
import { evidenceNodes, evidenceEdges } from "@drenyra/persistence/schema";

export type EvidenceNodeType = "DerivedArtifact";
export type EvidenceEdgeType = "derived_from" | "supersedes";

export interface CreateNodeInput {
  type: EvidenceNodeType;
  artifactId: string;
  period: string;
  companyId: string;
  canonicalPayload: unknown; // JSON-serializable artifact
}

export class SireEvidenceService {
  /**
   * Computes SHA-256 hash chain for a new evidence node.
   * hash = SHA-256(previous_hash || artifact_hash)
   * where artifact_hash = SHA-256(stableJSON(payload))
   */
  static computeHash(input: {
    previousHash: string;
    canonicalPayload: unknown;
  }): string {
    const artifactHash = createHash("sha256")
      .update(stableStringify(input.canonicalPayload))
      .digest("hex");
    return createHash("sha256")
      .update(input.previousHash + artifactHash)
      .digest("hex");
  }

  /**
   * Retrieves the previous hash for the same (companyId, period, type) scope.
   * Returns empty string for the first node.
   */
  static async getPreviousHash(input: {
    companyId: string;
    period: string;
    type: EvidenceNodeType;
  }): Promise<string> {
    const row = await db
      .select({ hash: evidenceNodes.hash })
      .from(evidenceNodes)
      .where(and(
        eq(evidenceNodes.companyId, input.companyId),
        eq(evidenceNodes.period, input.period),
        eq(evidenceNodes.type, input.type),
      ))
      .orderBy(desc(evidenceNodes.createdAt))
      .limit(1);
    return row[0]?.hash ?? "";
  }

  /**
   * Creates a DerivedArtifact evidence node with edges to source documents.
   * All operations within a single transaction.
   */
  static async createDerivedArtifactNode(input: {
    artifactId: string;
    period: string;
    companyId: string;
    canonicalPayload: unknown;
    sourceNodeIds: string[]; // source document nodes (ledger, SUNAT proposal)
  }): Promise<{ nodeId: string; hash: string }> {
    return db.transaction(async (tx) => {
      const previousHash = /* get previous hash within tx */;
      const hash = SireEvidenceService.computeHash({
        previousHash,
        canonicalPayload: input.canonicalPayload,
      });

      // Insert node
      const [node] = await tx.insert(evidenceNodes).values({
        type: "DerivedArtifact",
        artifactId: input.artifactId,
        period: input.period,
        companyId: input.companyId,
        hash,
      }).returning({ id: evidenceNodes.id });

      // Insert derived_from edges
      for (const sourceId of input.sourceNodeIds) {
        await tx.insert(evidenceEdges).values({
          fromNodeId: node.id,
          toNodeId: sourceId,
          edgeType: "derived_from",
        });
      }

      return { nodeId: node.id, hash };
    });
  }

  /**
   * Creates a supersedes edge and new node for a correction.
   */
  static async createSupersedingNode(input: {
    previousNodeId: string;
    canonicalPayload: unknown;
    /* ...same as createDerivedArtifactNode... */
  }): Promise<{ nodeId: string; hash: string }> {
    // Creates new node + supersedes edge to previous node
    // Previous node remains unchanged (append-only)
  }
}
```

### Testing Strategy (Strict TDD Order)

1. **RED** — Unit test: `computeHash` with empty previous → `SHA-256('' + artifactHash)`
2. **GREEN** — Implement `computeHash`
3. **RED** — Unit test: `computeHash` with non-empty previous → chaining works
4. **GREEN** — Verify chain correctness
5. **RED** — Property-based test: hash chain determinism (100+ random payloads, same inputs → same hash)
6. **GREEN** — Verify `fast-check` determinism
7. **RED** — Property-based test: `hash` is always 64 hex characters
8. **GREEN** — Verify hex output constraint
9. **RED** — Integration test: diff generation creates evidence node + edges atomically
10. **GREEN** — Wire `SireEvidenceService` into `SireDiffService.buildThreeWayDiff`
11. **RED** — Integration test: UPDATE on `evidence_nodes` rejected by DB
12. **GREEN** — Run migration with REVOKE, verify rejection
13. **RED** — Integration test: DELETE on `evidence_nodes` rejected by DB
14. **GREEN** — Verify same migration enforcement
15. **RED** — Snapshot test: `SHA-256(JSON.stringify(goldenArtifact))` matches expected hash
16. **GREEN** — Create golden fixture, verify hash

### PR Boundary — Phase B

**PR #2 delivers:**

- `evidence_nodes` and `evidence_edges` tables with append-only enforcement
- `SireEvidenceService` with hash chain computation
- Evidence node + edges created atomically on diff generation
- Hash chain determinism verified

**NOT in this PR:**

- Badges referencing evidence (Phase C)
- Reversibility evidence audit trail (Phase C)
- UNKNOWN reconciler evidence (Phase D)

---

## Phase C: Trust Layer (SDD-016 + SDD-006/008)

### Architecture Decisions

**Decision 1: Materiality threshold on `companies` table (additive column)**

- Add `sire_materiality_threshold_pen` (nullable numeric) to the existing `companies` table
- Add `sire_reversibility_window_hours` (integer, default 24) alongside it
- **Rationale:** Per-company configuration lives naturally on the `companies` table. Additive columns only. NULL means backward-compatible: all non-MATCH rows are critical.

**Decision 2: `buildSummary` signature change as overload**

- Current: `buildSummary(rows: SireDiffRow[]): SireDiffArtifactPayload["summary"]`
- New: `buildSummary(rows: SireDiffRow[], opts?: { threshold?: number }): SireDiffArtifactPayload["summary"]`
- When `opts.threshold` is provided, `critical` count filters by `|difference| >= threshold`
- When omitted, behavior is unchanged (backward compatible)
- **Rationale:** Optional parameter preserves all existing callers. TypeScript overload keeps the API clean.

**Decision 3: `EvidenceBadge` as a standalone presentational component**

- Location: `apps/web/src/components/evidence/EvidenceBadge.tsx`
- Props: `{ source: 'SUNAT' | 'ledger' | 'CPE', status: 'verified' | 'pending' | 'conflict', confidence: 'high' | 'medium' | 'low' }`
- Pure component — no data fetching, no side effects
- Rendered within existing `SireDiffTable` rows (each row cell that displays a value gets a badge)
- **Rationale:** Keeping it as a pure component allows Phase C badge development to begin while Phase B evidence schema settles. Badges initially render with mock/pending status; Phase B completion enables dynamic status resolution.

**Decision 4: Reversibility via JSONB extension of existing resolutions**

- Store `revert_available_until` and `revert_available` boolean in the existing `sire_discrepancy_resolutions.resolution_data` JSONB field
- New `POST /api/sire/diff/revert` endpoint
- No schema changes to `sire_discrepancy_resolutions` — JSONB is flexible
- **Rationale:** The spec specifically says to use the JSONB field. No migration needed for the resolution table itself.

**Decision 5: Revert recording creates evidence nodes**

- Reverting an ACCEPT_SUNAT resolution creates a new `evidence_nodes` row (type: "RevertAction") and a `supersedes` edge to the original resolution's evidence node
- **Rationale:** Append-only audit trail. Every state-changing action produces evidence.

### File Changes

| File                                                                          | Action     | Purpose                                                                                   |
| ----------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| `packages/persistence/src/schema/core.schema.ts`                              | MODIFY     | Add `sire_materiality_threshold_pen` and `sire_reversibility_window_hours` to `companies` |
| `packages/persistence/drizzle/XXXX_add_company_sire_config.sql`               | **CREATE** | Additive migration for new columns                                                        |
| `apps/api/src/features/sire/services/sire-diff.service.ts`                    | MODIFY     | `buildSummary` accepts optional `threshold` parameter                                     |
| `apps/api/src/features/sire/services/sire-revert.service.ts`                  | **CREATE** | `SireRevertService` — validate window, apply revert, create evidence                      |
| `apps/api/src/features/sire/routes/revert.route.ts`                           | **CREATE** | `POST /api/sire/diff/revert`                                                              |
| `apps/api/src/features/sire/index.ts`                                         | MODIFY     | Register revert route                                                                     |
| `apps/web/src/components/evidence/EvidenceBadge.tsx`                          | **CREATE** | Pure badge component                                                                      |
| `apps/web/src/features/artifacts/components/sire-diff-card/SireDiffTable.tsx` | MODIFY     | Render `EvidenceBadge` in each diff row cell                                              |
| `tests/fixtures/sire-diff-input.json`                                         | **CREATE** | Golden input fixture                                                                      |
| `tests/fixtures/sire-diff-expected.json`                                      | **CREATE** | Golden expected output fixture                                                            |
| `tests/fixtures/sire-diff-summary-expected.json`                              | **CREATE** | Golden summary fixture                                                                    |

### Data Model Changes

```sql
ALTER TABLE companies
  ADD COLUMN sire_materiality_threshold_pen NUMERIC,         -- NULL = all critical
  ADD COLUMN sire_reversibility_window_hours INTEGER DEFAULT 24; -- hours
```

### Service Layer

```ts
// Modified buildSummary
export function buildSummary(
  rows: SireDiffRow[],
  opts?: { threshold?: number }
): SireDiffArtifactPayload['summary'] {
  const threshold = opts?.threshold
  // ... existing counts ...

  const critical =
    threshold != null
      ? rows.filter(
          (r) => r.status !== 'MATCH' && Math.abs(r.difference) >= threshold
        ).length
      : mismatched + missingOnLedger + missingOnSunat

  return {
    matched,
    mismatched,
    missingOnLedger,
    missingOnSunat,
    critical,
    totalDifference,
  }
}
```

```ts
// apps/api/src/features/sire/services/sire-revert.service.ts

export class SireRevertService {
  static async revertResolution(input: {
    companyId: string
    period: string
    discrepancyId: string
  }): Promise<RevertResult> {
    // 1. Load resolution from sire_discrepancy_resolutions
    // 2. Read revert_available_until from resolution_data JSONB
    // 3. If now() > revert_available_until → throw 409
    // 4. If already REVERTED → throw 409
    // 5. Restore ledger value to pre-resolution state
    // 6. Mark resolution as REVERTED
    // 7. Create evidence node for revert action
    // 8. Create supersedes edge
    // All in a transaction
  }
}
```

### UI Component

```tsx
// apps/web/src/components/evidence/EvidenceBadge.tsx
type EvidenceSource = 'SUNAT' | 'ledger' | 'CPE'
type VerificationStatus = 'verified' | 'pending' | 'conflict'
type ConfidenceLevel = 'high' | 'medium' | 'low'

interface EvidenceBadgeProps {
  source: EvidenceSource
  status: VerificationStatus
  confidence: ConfidenceLevel
}

export function EvidenceBadge({
  source,
  status,
  confidence,
}: EvidenceBadgeProps) {
  // Renders a small badge with:
  // - Source icon/label
  // - Status indicator (color-coded)
  // - Confidence indicator
  // - aria-label for screen readers
  // - 3 sources × 3 statuses × 3 confidences = all states covered
}
```

### Testing Strategy (Strict TDD Order)

1. **RED** — Unit test: `buildSummary` with threshold 500, rows with differences [100,200,500,1000] → critical=2
2. **GREEN** — Add `opts` parameter to `buildSummary`
3. **RED** — Unit test: `buildSummary` without threshold → all non-MATCH critical (backward compat)
4. **GREEN** — Verify backward compatible default
5. **RED** — Property-based test: `critical` ≤ total non-MATCH for any threshold
6. **GREEN** — Verify invariant with `fast-check`
7. **RED** — Golden test: `buildDiffRows(goldenInput)` → matches `sire-diff-expected.json`
8. **GREEN** — Create golden fixtures, run deterministic comparison
9. **RED** — Golden test: `buildSummary(goldenRows, { threshold: 1000 })` → matches expected summary
10. **GREEN** — Verify golden summary
11. **RED** — Component test: `EvidenceBadge` renders source label for all 3 sources
12. **GREEN** — Implement badge render
13. **RED** — Component test: `EvidenceBadge` renders all 3×3×3 state combinations
14. **GREEN** — Verify all 27 states render correctly
15. **RED** — Accessibility test: badge has `aria-label`
16. **GREEN** — Add aria-label
17. **RED** — Integration test: threshold read from `companies` table, NULL → all critical
18. **GREEN** — Wire company config read
19. **RED** — Integration test: revert within window → succeeds, ledger restored
20. **GREEN** — Implement `SireRevertService.revertResolution`
21. **RED** — Integration test: revert after window expiry → 409
22. **GREEN** — Add window expiration check
23. **RED** — Integration test: revert already-reverted → 409
24. **GREEN** — Add idempotency guard

### PR Boundary — Phase C

**PR #3 delivers:**

- `sire_materiality_threshold_pen` and `sire_reversibility_window_hours` on `companies`
- `buildSummary` with optional threshold
- Golden test fixtures
- `EvidenceBadge` component (initially with pending/static status; Phase B provides dynamic data)
- Revert endpoint with window enforcement
- All tests pass

**NOT in this PR:**

- Dynamic evidence status in badges (requires Phase B merge)
- UNKNOWN state (Phase D)
- UX overhaul (Phase E)

---

## Phase D: Durable Execution (SDD-020)

### Architecture Decisions

**Decision 1: `UNKNOWN` and `RECONCILING` as new status values in the varchar column**

- The `sire_submissions.status` column is `varchar(20)`. `UNKNOWN` (7 chars) and `RECONCILING` (11 chars) fit.
- No enum change needed — it's a varchar, not a PostgreSQL enum
- **Rationale:** The spec says to add values to the status comment/validation, not create a new PG enum. This avoids migration complexity.

**Decision 2: `SireReconcilerService` as a standalone service**

- `SireReconcilerService.reconcileUnknown()` queries SUNAT for actual status
- Uses the same OAuth credential resolution as `SireSubmissionService` — calls `resolveTenantSunatContext`
- State machine: `UNKNOWN → RECONCILING → COMPLETED | FAILED_RETRYABLE`
- **Rationale:** Separate from submission service to keep concerns isolated. The reconciler is for recovery, not initial submission.

**Decision 3: Reconciler shares SUNAT API client infrastructure**

- Uses `SireService` (or the same HTTP client) to query SUNAT
- SUNAT reconciliation endpoint: to be determined from SUNAT API docs, but the design accommodates a configurable endpoint
- **Rationale:** Reuse existing HTTP client with OAuth token management. If SUNAT doesn't expose a direct status query endpoint, the reconciler attempts a status check via the submission tracking ID.

**Decision 4: `payload_base64` as nullable TEXT on `sire_submissions`**

- Additive column: `ALTER TABLE sire_submissions ADD COLUMN payload_base64 TEXT;`
- NULL for legacy submissions — retry on NULL payload fails with clear error
- **Rationale:** Spec mandates additive migrations. NULL is acceptable for existing rows. The retry service handles the NULL case explicitly.

**Decision 5: `RECONCILING` sweeper uses `SELECT ... FOR UPDATE SKIP LOCKED`**

- Sweeper job runs periodically (configurable interval, default 5 minutes)
- Detects submissions stuck in `RECONCILING` for > 30 minutes
- Resets stuck submissions to `UNKNOWN` and re-enqueues
- Uses advisory lock pattern from existing `sireJobs` infrastructure
- **Rationale:** `SKIP LOCKED` prevents sweeper conflicts. Matches existing patterns.

### File Changes

| File                                                             | Action     | Purpose                                                                                              |
| ---------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `packages/persistence/src/schema/sire.schema.ts`                 | MODIFY     | Add `UNKNOWN` and `RECONCILING` to status comment; add `payload_base64` column                       |
| `packages/persistence/drizzle/XXXX_add_sire_unknown_payload.sql` | **CREATE** | Additive migration                                                                                   |
| `apps/api/src/features/sire/types.ts`                            | MODIFY     | Add `UNKNOWN`, `RECONCILING`, `COMPLETED`, `FAILED_RETRYABLE` to `SireSubmissionResult.status` union |
| `apps/api/src/features/sire/services/sire-reconciler.service.ts` | **CREATE** | `SireReconcilerService`                                                                              |
| `apps/api/src/features/sire/services/sire-retry.service.ts`      | MODIFY     | `SireRetryService.processRetryQueue()` uses `payload_base64`                                         |
| `apps/api/src/features/sire/services/submission/service.ts`      | MODIFY     | Store `payload_base64` on submission; transition timeout → UNKNOWN                                   |
| `apps/api/src/features/sire/sire-submission.service.ts`          | MODIFY     | Set `payload_base64` during submission creation                                                      |

### Data Model Changes

```sql
-- Add UNKNOWN/RECONCILING to comment (no structural change)
COMMENT ON COLUMN sire_submissions.status IS
  'PENDING, SUBMITTED, ACCEPTED, REJECTED, OBSERVED, SIMULATED, FAILED, UNKNOWN, RECONCILING';

-- Add payload storage
ALTER TABLE sire_submissions
  ADD COLUMN payload_base64 TEXT;  -- NULL for pre-migration submissions
```

### Service Layer

```ts
// apps/api/src/features/sire/services/sire-reconciler.service.ts

export type ReconcilerState =
  | { status: 'COMPLETED'; sunatStatus: string }
  | { status: 'FAILED_RETRYABLE'; reason: string; retryPayload: string }
  | { status: 'RECONCILING'; nextRetryAt: Date }

export class SireReconcilerService {
  /**
   * Queries SUNAT for the actual status of a submission in UNKNOWN state.
   * State transitions: UNKNOWN → RECONCILING → COMPLETED | FAILED_RETRYABLE
   */
  static async reconcileUnknown(
    submissionId: string
  ): Promise<ReconcilerState> {
    // 1. Set status to RECONCILING
    // 2. Use resolveTenantSunatContext (with Phase A fiscalPeriodId) for credential
    // 3. Query SUNAT API for submission status by trackingId
    // 4. If SUNAT confirms (ACEPTADO/ACCEPTED) → COMPLETED
    // 5. If SUNAT has no record → FAILED_RETRYABLE
    // 6. If SUNAT API error (503) → stay RECONCILING, set nextRetryAt
    // 7. Create evidence node for reconciliation action (Phase B)
  }

  /**
   * Sweeper: detects submissions stuck in RECONCILING > timeout.
   * Resets to UNKNOWN and re-enqueues.
   */
  static async sweepStuckReconciling(): Promise<number> {
    // SELECT ... FOR UPDATE SKIP LOCKED
    // WHERE status = 'RECONCILING' AND updated_at < now() - interval '30 minutes'
    // Reset to UNKNOWN, re-enqueue
  }
}
```

```ts
// Modified submission flow
// In sire-submission.service.ts or submission/service.ts:

// When HTTP request to SUNAT times out:
if (isTimeout(error)) {
  await db
    .update(sireSubmissions)
    .set({ status: 'UNKNOWN', sunatStatus: null })
    .where(eq(sireSubmissions.id, submissionId))
  // Flag for reconciliation
}
// NOT FAILED — FAILED is for explicit SUNAT error responses.
```

### Testing Strategy (Strict TDD Order)

1. **RED** — Unit test: timeout during submission → status is `UNKNOWN` (not `FAILED`)
2. **GREEN** — Modify submission timeout handler
3. **RED** — Unit test: `reconcileUnknown` with SUNAT response "ACEPTADO" → `COMPLETED`
4. **GREEN** — Implement happy path reconciliation
5. **RED** — Unit test: `reconcileUnknown` with SUNAT "no record" → `FAILED_RETRYABLE`
6. **GREEN** — Implement no-record path
7. **RED** — Unit test: `reconcileUnknown` with SUNAT 503 → stays `RECONCILING` with `nextRetryAt`
8. **GREEN** — Implement error recovery with exponential backoff
9. **RED** — Unit test: retry uses stored `payload_base64`
10. **GREEN** — Modify `SireRetryService.processRetryQueue`
11. **RED** — Unit test: retry on NULL `payload_base64` → clear error, marked non-retryable
12. **GREEN** — Handle NULL case
13. **RED** — Property-based test: any valid Base64 string round-trips through store+retrieve
14. **GREEN** — Verify round-trip with `fast-check`
15. **RED** — Integration test: end-to-end `UNKNOWN → RECONCILING → COMPLETED` flow
16. **GREEN** — Mock SUNAT responses, verify full flow
17. **RED** — Integration test: sweeper detects stuck `RECONCILING` (>30 min) and resets
18. **GREEN** — Implement sweeper
19. **RED** — Contract test: SUNAT reconciliation API response shape validation

### PR Boundary — Phase D

**PR #4 delivers:**

- `UNKNOWN` and `RECONCILING` statuses in submission lifecycle
- `payload_base64` column on `sire_submissions`
- `SireReconcilerService` with SUNAT status query
- `SireRetryService` uses stored payload
- RECONCILING sweeper
- All tests pass

**NOT in this PR:**

- UX integration (Phase E)
- Workspace reconciliation step (Phase E)

---

## Phase E: UX & Integration (SDD-072 + SDD-034 + SDD-002)

### Architecture Decisions

**Decision 1: Workspace state persisted via `sire_comparisons` + `sire_discrepancy_resolutions`**

- The existing `sire_comparisons` table already stores the diff artifact (rows + summary)
- `sire_discrepancy_resolutions` already stores resolution progress
- Add `workspace_step` to `sire_comparisons` (or store in JSONB metadata) to track the current step
- **Rationale:** Leverages existing tables. No new tables needed. Only one additive column.

**Decision 2: URL-based recovery extends existing React Router pattern**

- `useSearchParams` reads `artifactId` from query string
- On mount, `SireDiffPage` checks for `?artifactId=X` and loads the artifact from the API
- **Rationale:** Matches existing TanStack Router patterns in the codebase. Clean, testable.

**Decision 3: `@tanstack/react-virtual` for rows > 100**

- Install `@tanstack/react-virtual` as a new dependency in `apps/web`
- Replace the current `SireDiffTable` row rendering with virtualized list when `rows.length > 100`
- Below 100 rows: render normally (no virtualization overhead)
- **Rationale:** Spec mandates this threshold. TanStack virtual is the standard React virtualization library. Only virtualize large diffs to avoid unnecessary complexity for small ones.

**Decision 4: Keyboard shortcuts via existing `useSireDiffKeyboardShortcuts`**

- Extend the existing hook to handle `j`/`k`/`Enter` for the virtualized row list
- `j`/`↓`: next row, `k`/`↑`: previous row, `Enter`: toggle selection
- **Rationale:** Hook already exists. Adding 3 handlers to it is minimal and keeps shortcuts centralized.

**Decision 5: Vocabulary alignment via string replacement**

- Update `<h1>` in `SireDiffPage.tsx`: "SIRE Diff" → "Conciliación SIRE"
- Update sidebar route label in route config: add or update the SIRE navigation item
- Replace any hardcoded "SIRE Diff" strings in the SIRE feature tree
- **Rationale:** String-level change. No refactoring needed. Phase E is the right time since it's the UX phase.

### File Changes

| File                                                                                        | Action     | Purpose                                                                     |
| ------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| `packages/persistence/src/schema/sire-comparisons.schema.ts`                                | MODIFY     | Add `workspace_step` column (or store in JSONB metadata)                    |
| `packages/persistence/drizzle/XXXX_add_workspace_step.sql`                                  | **CREATE** | Additive migration                                                          |
| `apps/api/src/features/sire/routes/workspace.route.ts`                                      | **CREATE** | `GET/PUT /api/sire/workspace` — persist/restore workspace state             |
| `apps/api/src/features/sire/index.ts`                                                       | MODIFY     | Register workspace routes                                                   |
| `apps/web/src/features/sire/SireDiffPage.tsx`                                               | MODIFY     | Loading/empty/error states, vocabulary, URL recovery, workspace persistence |
| `apps/web/src/features/sire/hooks/useSireDiffWorkspace.ts`                                  | **CREATE** | Workspace state management hook                                             |
| `apps/web/src/features/artifacts/components/sire-diff-card/SireDiffTable.tsx`               | MODIFY     | Virtualized rows (>100), keyboard nav                                       |
| `apps/web/src/features/artifacts/components/sire-diff-card/useSireDiffKeyboardShortcuts.ts` | MODIFY     | Add `j`/`k`/`Enter` handlers for virtualized list                           |
| `apps/web/package.json`                                                                     | MODIFY     | Add `@tanstack/react-virtual` dependency                                    |
| App route config / sidebar                                                                  | MODIFY     | "Cumplimiento SIRE" label                                                   |

### Data Model Changes

```sql
-- Option A: explicit column
ALTER TABLE sire_comparisons
  ADD COLUMN workspace_step VARCHAR(30) DEFAULT 'context';
-- Steps: context, sync, match, classify, resolve, diff, review, submit, reconcile

-- Option B: store in existing JSONB summary/metadata
-- No migration needed if stored in JSONB; chosen to minimize migration risk
```

**Design choice: Option B — store `workspace_step` in a new JSONB `workspace_metadata` column on `sire_comparisons`.** This is more flexible and doesn't require adding a step to every comparison that exists today.

### UI Component Architecture

```
SireDiffPage (Phase E refactor)
├── LoadingState          → skeleton loader + disabled button with spinner
├── EmptyState            → "All records match — no discrepancies" (when diff is empty but valid)
├── ErrorState            → error message + "Retry" button + previous artifact preserved
├── DiffInputForm         → period, file uploads, Run button (existing, preserved)
├── SireDiffArtifactCard  → (existing, now wraps EvidenceBadge cells)
│   ├── SireDiffSummaryGrid
│   └── SireDiffTable     → MODIFIED:
│       ├── VirtualizedList (when rows > 100, uses @tanstack/react-virtual)
│       │   └── DiffRow  → renders EvidenceBadge (Phase C) per cell
│       └── StaticList    (when rows ≤ 100, renders normally)
├── EvidenceBadge         → per diff row cell (Phase C, integrated here)
└── WorkspaceStepIndicator → shows current step, persists on reload
```

### Component States

```
State Machine for SireDiffPage:
┌─────────┐    run diff    ┌──────────┐   success    ┌──────────┐
│  IDLE   │ ─────────────→ │ LOADING  │ ───────────→ │  READY   │
│ (input  │               │ (skeleton│              │ (artifact│
│  form)  │               │  loader) │              │  shown)  │
└─────────┘               └──────────┘              └──────────┘
                                │                        │
                                │ error                  │ reload
                                ▼                        ▼
                           ┌──────────┐              ┌──────────┐
                           │  ERROR   │              │ RESTORING│
                           │ (retry   │              │ (loading │
                           │  button) │              │  saved)  │
                           └──────────┘              └──────────┘
                                                         │
                                                         │ success
                                                         ▼
                                                    ┌──────────┐
                                                    │  READY   │
                                                    │(restored)│
                                                    └──────────┘
```

### Testing Strategy (Strict TDD Order)

1. **RED** — Integration test: page reload restores workspace (artifact + resolutions + step)
2. **GREEN** — Implement `useSireDiffWorkspace` hook + API endpoint
3. **RED** — Integration test: URL `?artifactId=X` loads correct artifact
4. **GREEN** — Implement URL-based recovery
5. **RED** — Component test: virtualized list renders only visible rows (DOM node count ≤ viewport + overscan)
6. **GREEN** — Integrate `@tanstack/react-virtual`, verify DOM node count
7. **RED** — Component test: non-virtualized list (≤100 rows) renders all rows
8. **GREEN** — Verify threshold logic
9. **RED** — Component test: keyboard `j` moves highlight to next row
10. **GREEN** — Extend `useSireDiffKeyboardShortcuts`
11. **RED** — Component test: keyboard `k` moves to previous row, `Enter` selects
12. **GREEN** — Add remaining handlers
13. **RED** — Component test: loading skeleton renders when diff is computing
14. **GREEN** — Implement loading state in `SireDiffPage`
15. **RED** — Component test: empty state renders "All records match" when diff is all matches
16. **GREEN** — Implement empty state
17. **RED** — Component test: error state renders retry button, preserves previous artifact
18. **GREEN** — Implement error state
19. **RED** — Snapshot test: page title is "Conciliación SIRE"
20. **GREEN** — Update vocabulary strings
21. **RED** — Snapshot test: sidebar label is "Cumplimiento SIRE"
22. **GREEN** — Update route config
23. **RED** — Accessibility test: keyboard navigation is screen-reader compatible
24. **GREEN** — Add `aria-*` attributes, verify with testing-library
25. **RED** — E2E test: full workspace flow — generate diff → resolve → reload → verify state restored
26. **GREEN** — Playwright/Cypress E2E

### PR Boundary — Phase E

**PR #5 delivers (terminal phase):**

- Workspace state persistence (page reload restores)
- URL-based recovery (`?artifactId=X`)
- Virtualized diff rows (`@tanstack/react-virtual`) for >100 rows
- Keyboard navigation (`j`, `k`, `Enter`)
- Loading / empty / error states
- SIRE vocabulary alignment
- All tests pass

---

## Cross-Phase Concerns

### Evidence Flow: Phase B → Phase C

```
Phase B:                                     Phase C:
┌─────────────────────┐                     ┌────────────────────────┐
│ evidence_nodes       │                     │ EvidenceBadge           │
│ ┌─────────────────┐ │                     │ ┌────────────────────┐ │
│ │ id               │ │◄── FK reference ───│ │ source: evidence   │ │
│ │ type             │ │                     │ │  node type         │ │
│ │ artifact_id      │ │                     │ │ status: resolved   │ │
│ │ hash             │ │                     │ │  from hash chain   │ │
│ │ period           │ │                     │ │ confidence:        │ │
│ │ company_id       │ │                     │ │  chain length      │ │
│ └─────────────────┘ │                     │ └────────────────────┘ │
│                     │                     │                        │
│ evidence_edges       │                     │ Revert creates:        │
│ ┌─────────────────┐ │                     │ new evidence node      │
│ │ from_node_id     │ │                     │ + supersedes edge      │
│ │ to_node_id       │ │                     │                        │
│ │ edge_type        │ │                     │                        │
│ └─────────────────┘ │                     └────────────────────────┘
└─────────────────────┘
```

When a badge needs to determine `status` and `confidence`:

1. Query `evidence_nodes` by `(company_id, period, type)` for the relevant artifact
2. Follow `evidence_edges` to determine source data provenance
3. If hash chain is unbroken and source nodes exist → `status: verified`, `confidence: high`
4. If hash chain exists but some source nodes are unverified → `status: pending`, `confidence: medium`
5. If values conflict between sources → `status: conflict`, `confidence: low`

### Reconciler → Workspace Flow: Phase D → Phase E

```
Phase D:                                     Phase E:
┌────────────────────────┐                  ┌───────────────────────────┐
│ SireReconcilerService   │                  │ SireDiffPage               │
│ ┌────────────────────┐ │                  │ ┌───────────────────────┐ │
│ │ UNKNOWN            │ │                  │ │ Workspace Step:       │ │
│ │  → RECONCILING     │ │                  │ │ "reconcile"           │ │
│ │    → COMPLETED     │ │ ── status ──────→│ │                       │ │
│ │    → FAILED_RETRY  │ │                  │ │ Shows:                │ │
│ └────────────────────┘ │                  │ │ - Reconciling spinner  │ │
│                         │                  │ │ - Completed checkmark  │ │
│ Payload stored:         │                  │ │ - Failed retry button  │ │
│ payload_base64          │                  │ │                       │ │
└────────────────────────┘                  └───────────────────────────┘
```

### Phase A `fiscalPeriodId` → Phase B Evidence Scoping

```
Phase A:                                     Phase B:
┌──────────────────────┐                    ┌─────────────────────────┐
│ TenantSunatContext    │                    │ evidence_nodes           │
│ ┌──────────────────┐ │                    │ ┌─────────────────────┐ │
│ │ companyId        │ │──┐                 │ │ company_id = X       │ │
│ │ ruc              │ │  │                 │ │ period = "2026-03"    │ │
│ │ credential       │ │  │  constrains     │ │                      │ │
│ │ fiscalPeriodId ◄─┼──┼─────────────────→│ │ Every node is         │ │
│ └──────────────────┘ │  │                 │ │ scoped by both        │ │
│                       │  │                 │ │ company AND period    │ │
│ Route validation:     │  │                 │ │                      │ │
│ Period must exist     │  │                 │ │ Prevents cross-       │ │
│ in company's fiscal   │  │                 │ │ company evidence      │ │
│ calendar before       │  │                 │ │ leakage               │ │
│ resolving context     │  │                 │ └─────────────────────┘ │
└──────────────────────┘  │                 └─────────────────────────┘
                           │
                           │  constrains
                           ▼
                    ┌─────────────────────────┐
                    │ evidence_edges           │
                    │ (jointly scoped by       │
                    │  from/to node FK to      │
                    │  evidence_nodes)         │
                    └─────────────────────────┘
```

---

## Migration Plan — Per-Phase Rollout

### Phase A Rollout

1. Deploy migration (no schema changes, just new service)
2. Deploy API with `FiscalPeriodService`
3. Verify all 12+ SIRE routes reject invalid periods
4. No user-facing changes (periods already validated at app level; now enforced at API level)

**Rollback:** Remove `fiscalPeriodId` from `TenantSunatContext` and route handlers. No DB rollback needed.

### Phase B Rollout

1. Deploy migration: `CREATE TABLE evidence_nodes`, `CREATE TABLE evidence_edges`, `REVOKE UPDATE/DELETE`
2. Deploy API with `SireEvidenceService`
3. Existing diff flow is extended — evidence is created alongside existing behavior
4. Verify evidence nodes appear in DB after diff generation

**Rollback:** Drop tables, remove service calls. Existing `sire_comparisons` unchanged.

### Phase C Rollout

1. Deploy migration: `ALTER TABLE companies ADD COLUMN sire_materiality_threshold_pen`, `sire_reversibility_window_hours`
2. Deploy API with threshold support + revert endpoint
3. Deploy web with `EvidenceBadge` component
4. NULL threshold means backward compatible — all existing companies get the old behavior

**Rollback:** Drop columns, remove route, remove component. `buildSummary` has backward-compatible default.

### Phase D Rollout

1. Deploy migration: `ALTER TABLE sire_submissions ADD COLUMN payload_base64 TEXT`
2. Deploy API with `SireReconcilerService`
3. Existing submission flow unchanged — `FAILED` still reachable for explicit errors
4. Only timeouts transition to `UNKNOWN` (new behavior)

**Rollback:** Drop column, remove reconciler service. Submissions that were `UNKNOWN` would need manual intervention — rollback safely leaves them as-is.

### Phase E Rollout

1. Deploy migration: `ALTER TABLE sire_comparisons ADD COLUMN workspace_metadata JSONB`
2. Deploy API with workspace endpoints
3. Deploy web with virtualized grid, keyboard nav, states, vocabulary
4. Install `@tanstack/react-virtual`

**Rollback:** Remove workspace column, revert UI to previous `SireDiffPage`. No data loss — `sire_comparisons` retains diff artifacts.

---

## Risk Mitigation Summary

| Risk                                                     | Phase | Mitigation in Design                                                                                                              |
| -------------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------- |
| Hash chain non-determinism across environments           | B     | Design specifies sorted-key JSON serializer; property-based tests with 100+ payloads                                              |
| `@tanstack/react-virtual` version conflict               | E     | Pin exact version; test in isolation before integration; fallback to static list if library fails                                 |
| SUNAT reconciliation API contract changes                | D     | Mock all SUNAT responses in tests; configurable endpoint URL via env variables; `RECONCILING` state handles API errors gracefully |
| DB migration conflicts with company columns              | C     | Additive only — `ALTER TABLE ... ADD COLUMN`; NULL defaults                                                                       |
| Workspace state recovery breaks on schema change         | E     | Store workspace metadata as JSONB — schema-flexible; version field for future migration                                           |
| RECONCILING sweeper conflicts with manual reconciliation | D     | `SELECT ... FOR UPDATE SKIP LOCKED` pattern; configurable timeout                                                                 |
| Partial evidence on transaction failure                  | B     | All evidence operations wrapped in DB transaction; rollback on any failure                                                        |

---

## File Inventory (Complete)

### Phase A (5 files changed, 1 new service, 1 new doc)

| File                                                                  | Action |
| --------------------------------------------------------------------- | ------ |
| `apps/api/src/features/sire/types.ts`                                 | MODIFY |
| `apps/api/src/features/sire/services/tenant-sunat-context.service.ts` | MODIFY |
| `apps/api/src/features/sire/services/fiscal-period.service.ts`        | CREATE |
| `apps/api/src/features/sire/routes/diff.route.ts`                     | MODIFY |
| `apps/api/src/features/sire/routes/submit.route.ts`                   | MODIFY |
| `apps/api/src/features/sire/routes/analyze.route.ts`                  | MODIFY |
| `apps/api/src/features/sire/routes/reporting.route.ts`                | MODIFY |
| `apps/api/src/features/sire/routes/diff-commit.route.ts`              | MODIFY |
| `docs/architecture/tenant-access-matrix.md`                           | CREATE |

### Phase B (4 new files, 2 modified)

| File                                                           | Action |
| -------------------------------------------------------------- | ------ |
| `packages/persistence/src/schema/evidence-nodes.schema.ts`     | CREATE |
| `packages/persistence/src/schema/evidence-edges.schema.ts`     | CREATE |
| `packages/persistence/src/schema/index.ts`                     | MODIFY |
| `packages/persistence/drizzle/XXXX_add_evidence_tables.sql`    | CREATE |
| `apps/api/src/features/sire/services/sire-evidence.service.ts` | CREATE |
| `apps/api/src/features/sire/services/sire-diff.service.ts`     | MODIFY |

### Phase C (5 new files, 4 modified)

| File                                                                          | Action |
| ----------------------------------------------------------------------------- | ------ |
| `packages/persistence/src/schema/core.schema.ts`                              | MODIFY |
| `packages/persistence/drizzle/XXXX_add_company_sire_config.sql`               | CREATE |
| `apps/api/src/features/sire/services/sire-diff.service.ts`                    | MODIFY |
| `apps/api/src/features/sire/services/sire-revert.service.ts`                  | CREATE |
| `apps/api/src/features/sire/routes/revert.route.ts`                           | CREATE |
| `apps/api/src/features/sire/index.ts`                                         | MODIFY |
| `apps/web/src/components/evidence/EvidenceBadge.tsx`                          | CREATE |
| `apps/web/src/features/artifacts/components/sire-diff-card/SireDiffTable.tsx` | MODIFY |
| `tests/fixtures/sire-diff-input.json`                                         | CREATE |
| `tests/fixtures/sire-diff-expected.json`                                      | CREATE |
| `tests/fixtures/sire-diff-summary-expected.json`                              | CREATE |

### Phase D (3 new files, 4 modified)

| File                                                             | Action |
| ---------------------------------------------------------------- | ------ |
| `packages/persistence/src/schema/sire.schema.ts`                 | MODIFY |
| `packages/persistence/drizzle/XXXX_add_sire_unknown_payload.sql` | CREATE |
| `apps/api/src/features/sire/types.ts`                            | MODIFY |
| `apps/api/src/features/sire/services/sire-reconciler.service.ts` | CREATE |
| `apps/api/src/features/sire/services/sire-retry.service.ts`      | MODIFY |
| `apps/api/src/features/sire/services/submission/service.ts`      | MODIFY |
| `apps/api/src/features/sire/sire-submission.service.ts`          | MODIFY |

### Phase E (4 new files, 5 modified)

| File                                                                                        | Action |
| ------------------------------------------------------------------------------------------- | ------ |
| `packages/persistence/src/schema/sire-comparisons.schema.ts`                                | MODIFY |
| `packages/persistence/drizzle/XXXX_add_workspace_metadata.sql`                              | CREATE |
| `apps/api/src/features/sire/routes/workspace.route.ts`                                      | CREATE |
| `apps/api/src/features/sire/index.ts`                                                       | MODIFY |
| `apps/web/src/features/sire/SireDiffPage.tsx`                                               | MODIFY |
| `apps/web/src/features/sire/hooks/useSireDiffWorkspace.ts`                                  | CREATE |
| `apps/web/src/features/artifacts/components/sire-diff-card/SireDiffTable.tsx`               | MODIFY |
| `apps/web/src/features/artifacts/components/sire-diff-card/useSireDiffKeyboardShortcuts.ts` | MODIFY |
| `apps/web/package.json`                                                                     | MODIFY |

**Total: ~40 files across all 5 phases, 21 new files, ~19 modified files.**

---

## Design Review Checklist

- [ ] Phase A: `fiscalPeriodId` is read-only (resolved from DB, never from user input)
- [ ] Phase A: All 12+ SIRE routes validate period before business logic
- [ ] Phase B: `evidence_nodes` and `evidence_edges` are append-only at DB level
- [ ] Phase B: Hash chain uses deterministic JSON serialization
- [ ] Phase C: `buildSummary` backward compatible (no threshold → all non-MATCH critical)
- [ ] Phase C: NULL `sire_materiality_threshold_pen` = all critical (backward compatible)
- [ ] Phase C: Revert creates evidence node (append-only audit trail)
- [ ] Phase D: `UNKNOWN` state only for timeouts, not explicit errors
- [ ] Phase D: `payload_base64` is nullable (legacy submissions have NULL)
- [ ] Phase D: Sweeper uses `SKIP LOCKED` to prevent conflicts
- [ ] Phase E: Virtualization threshold is exactly 100 rows
- [ ] Phase E: All states (loading, empty, error) render correctly
- [ ] Phase E: Vocabulary alignment changes labels only, not routes
- [ ] Cross-phase: All migrations are additive (`ALTER TABLE ... ADD COLUMN`, `CREATE TABLE`)
- [ ] Cross-phase: No existing SIRE route is renamed or moved (`/api/sire` prefix preserved)
- [ ] Cross-phase: Strict TDD: RED → GREEN → REFACTOR per requirement
