# SDD Design: drenyra-invoicing-ap — Invoicing, Purchases & AP

**Change:** `drenyra-invoicing-ap`
**Phase:** Design
**Created:** 2026-07-25
**Depends on:** `drenyra-invoice-entity-unification` (prerequisite), `drenyra-invoice-update-refactor` (prerequisite)

---

## Executive Summary

This design covers the four-phase AP/Invoicing formalization. Phase 1 is documentation + tests only (no schema changes). Phase 2 introduces `BillApproval` as a standalone aggregate with `approval_rules` per tenant. Phase 3 adds `PurchaseOrder` aggregate root with bill matching. Phase 4 delivers real-time AP aging, payment calendar, batch payments, and links detractions to bills via a new `spot_rates` table.

---

## Current State Audit (Phase 0 Understanding)

### Existing Schema Surface

| Table              | File                          | Status          | Notes                                                         |
| ------------------ | ----------------------------- | --------------- | ------------------------------------------------------------- |
| `invoices`         | `invoicing.schema.ts`         | ✅ In use       | AR lifecycle: DRAFT→SENT→OVERDUE→PAID→CANCELLED               |
| `invoice_items`    | `invoicing.schema.ts`         | ✅ In use       | Line items with tax classification                            |
| `bills`            | `invoicing.schema.ts`         | ✅ In use       | AP lifecycle: DRAFT→SENT→PAID→OVERDUE→CANCELLED               |
| `bill_items`       | `invoicing.schema.ts`         | ✅ In use       | Line items                                                    |
| `payments`         | `invoicing.schema.ts`         | ⚠️ Invoice-only | Links to `invoices.id` only — **gap: no bill payments table** |
| `businessPartners` | `business-partners.schema.ts` | ✅ In use       | Unified vendor + customer                                     |
| `vendorProfiles`   | `business-partners.schema.ts` | ✅ In use       | paymentTermDays, preferredPaymentMethod                       |
| `customerProfiles` | `business-partners.schema.ts` | ✅ In use       | creditLimit, creditDays                                       |
| `detractions`      | `accounting.schema.ts`        | ✅ In use       | Standalone — **not linked to bills**                          |

### Design Decisions Embedded in Existing Code

1. **Workflow trace in `notes`**: Status transitions are serialized as `[BILL_WORKFLOW]{"at":"...","from":"DRAFT","to":"SENT",...}` and appended to the `notes` text field. Phase 2 replaces this with a proper `bill_approvals` audit table.

2. **`approvalState` derivation**: Currently derived from bill status: `SENT`→`PENDING`, `OVERDUE`/`PAID`→`APPROVED`, everything else→`NOT_STARTED`. Phase 2 makes this explicit via `BillApproval` entity.

3. **No `workflowEvents` or `balanceDue` on bills table**: The `bills` table lacks `balanceDue`, `paidAmount`, and `paidDate` columns that `invoices` has. Phase 1 documents this gap; Phase 4 adds them.

4. **Payments only for invoices**: The `payments` table has `invoiceId` (FK to `invoices`). Bills currently lack any payment tracking in the schema.

5. **Money stored as `decimal(12,2)`** in DB, but the domain layer uses `Money` value object with cents. Mapper layer handles conversion.

---

## Phase 1 — Formalize Existing AR/AP

### Design Strategy

**No schema changes. No new entities. No refactors.** This phase is documentation + test hardening only.

### 1.1 AR Invoice Lifecycle — State Machine

```
                    ┌─────────┐
                    │  DRAFT  │
                    └────┬────┘
                         │ send
                    ┌────▼────┐
               ┌────│  SENT   │────┐
               │    └────┬────┘    │
               │  due     │  full  │
               │  passes  │payment │
          ┌────▼────┐ ┌──▼──────┐ │
          │ OVERDUE │ │  PAID   │ │
          └─────────┘ └─────────┘ │
                                  │
          ┌───────────────────────┘
          │ cancel (from DRAFT, SENT, or OVERDUE)
     ┌────▼──────┐
     │ CANCELLED │ ← terminal
     └───────────┘
```

**Allowed transitions:**

| From      | To        | Valid                               |
| --------- | --------- | ----------------------------------- |
| DRAFT     | SENT      | ✅                                  |
| DRAFT     | CANCELLED | ✅                                  |
| SENT      | OVERDUE   | ✅ (system-driven: due date passes) |
| SENT      | PAID      | ✅                                  |
| SENT      | CANCELLED | ✅                                  |
| OVERDUE   | PAID      | ✅                                  |
| OVERDUE   | CANCELLED | ✅                                  |
| PAID      | *         | ❌                                  |
| CANCELLED | *         | ❌                                  |

**Enforcement points:**

- `PATCH /api/invoices/:id/status` — validates transition against allowed list
- Domain: `Invoice.markAsSent()`, `Invoice.cancel()`, etc.
- `resolveSessionContext` with `sensitive-write` profile on write operations

### 1.2 AP Bill Lifecycle — State Machine

Identical to AR, but with vendor association and workflow trace. The current `bills` table uses `invoiceStatusEnum` (reused).

```
DRAFT → SENT → PAID / OVERDUE → CANCELLED
```

**Current gaps in bills schema (vs invoices):**

- No `balanceDue` column
- No `paidAmount` column
- No `paidDate` column
- No `sunatStatus` / `fiscalStatus` (AP bills are received, not emitted)
- `subtotalAmount` instead of `subtotal` (naming inconsistency)

**Phase 1 Action:** Document these as known gaps. Phase 4 adds `balanceDue`, `paidAmount`, `paidDate` to `bills`.

### 1.3 Workflow Trace Design (current, pre-Phase 2)

The existing embedded workflow trace pattern:

- `appendWorkflowEventToNotes()` serializes `BillWorkflowEvent` as `[BILL_WORKFLOW]{...json...}` and appends to `notes`
- `extractWorkflowEventsFromNotes()` parses these back
- `stripWorkflowEventsFromNotes()` removes them for display

**Known limitation:** This is a temporary design. Parsing JSON from a text field is fragile. Phase 2 replaces this with a proper `bill_approvals` table.

### 1.4 Test Plan (Phase 1)

| Test category                   | Target                                                                | Framework            |
| ------------------------------- | --------------------------------------------------------------------- | -------------------- |
| Invoice lifecycle state machine | `packages/domain/__tests__/invoice-lifecycle.property.test.ts`        | `@fast-check/vitest` |
| Bill lifecycle state machine    | `packages/domain/__tests__/bill-lifecycle.property.test.ts`           | `@fast-check/vitest` |
| Tenant isolation on bills       | `apps/api/__tests__/bills-tenant-isolation.test.ts`                   | vitest + test-utils  |
| Tenant isolation on invoices    | `apps/api/__tests__/invoices-tenant-isolation.test.ts`                | vitest + test-utils  |
| Credit/debit note linking       | `packages/domain/__tests__/credit-debit-notes.test.ts`                | vitest               |
| Vendor CRUD + RUC uniqueness    | `apps/api/__tests__/vendors-crud.test.ts`                             | vitest               |
| Workflow trace integrity        | `apps/api/src/features/billing/bill/__tests__/workflow-trace.test.ts` | vitest               |
| Money value object invariants   | `packages/domain/__tests__/fiscal-invariants.property.test.ts`        | `@fast-check/vitest` |

### 1.5 Capability Map Updates (Phase 1)

After test hardening:

- CAP-AP-03: 🟡 partial → ✅ applied
- CAP-AP-04: 🟡 partial → ✅ applied
- CAP-AP-05: 🟡 partial → ✅ applied
- CAP-AP-07: 🟡 partial → ✅ applied

---

## Phase 2 — AP Approval Workflow

### 2.1 New Entities

#### `BillApproval` Aggregate

```
BillApproval {
  id: UUID
  billId: UUID (FK → bills.id)
  companyId: UUID (FK → companies.id)
  status: PENDING_REVIEW | APPROVED | REJECTED
  approverId: UUID? (FK → users.id)
  approverName: string?
  comment: string? (on approve)
  reason: string? (on reject)
  autoApproved: boolean
  submittedAt: datetime
  reviewedAt: datetime?
  createdAt: datetime
  updatedAt: datetime
}
```

**Lifecycle:**

```
PENDING_REVIEW ──approve()──► APPROVED (terminal)
PENDING_REVIEW ──reject()───► REJECTED (sets bill back to DRAFT)
```

**Rules:**

- One `BillApproval` per bill (1:1 relationship)
- Created when bill is submitted (`POST /api/bills/:id/submit`)
- `autoApproved: true` when bill total ≤ `approval_rules.auto_approve_threshold`
- Immutable after reaching `APPROVED` or `REJECTED` (audit trail)
- Approval check: `hasPermission("approve:ap-bills")`

#### `approval_rules` Table

```
approval_rules {
  id: UUID
  companyId: UUID (FK → companies.id, unique)
  autoApproveThresholdCents: integer (default: 0 — all bills require manual)
  currency: PEN | USD | EUR (default: PEN)
  enabled: boolean (default: true)
  createdAt: datetime
  updatedAt: datetime
}
```

**Rules:**

- One row per tenant (company-level configuration)
- `autoApproveThresholdCents = 0` means "manual approval for all bills"
- Currency must match the bill's currency for threshold comparison
- When no row exists → default threshold of 0 (all manual)

### 2.2 DB Schema Changes (Phase 2)

#### New Enum

```sql
CREATE TYPE bill_approval_status AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');
```

#### New Tables

```sql
-- bill_approvals: One per bill, immutable audit trail
CREATE TABLE bill_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  status bill_approval_status NOT NULL DEFAULT 'PENDING_REVIEW',
  approver_id UUID REFERENCES users(id),
  approver_name VARCHAR(255),
  comment TEXT,
  reason TEXT,
  auto_approved BOOLEAN NOT NULL DEFAULT false,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX bill_approvals_bill_id_idx ON bill_approvals(bill_id);
CREATE INDEX bill_approvals_company_status_idx ON bill_approvals(company_id, status);

-- approval_rules: One row per tenant
CREATE TABLE approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) UNIQUE,
  auto_approve_threshold_cents INTEGER NOT NULL DEFAULT 0,
  currency currency NOT NULL DEFAULT 'PEN',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.3 API Contracts (Phase 2)

| Method | Path                      | Body                                 | Response                                                                                                     |
| ------ | ------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `POST` | `/api/bills/:id/submit`   | `{ actorId?, actorName? }`           | `{ billId, approvalId, status, autoApproved }`                                                               |
| `POST` | `/api/bills/:id/approve`  | `{ comment?, actorId?, actorName? }` | `{ billId, approvalId, status }`                                                                             |
| `POST` | `/api/bills/:id/reject`   | `{ reason, actorId?, actorName? }`   | `{ billId, approvalId, status, reason }`                                                                     |
| `GET`  | `/api/bills/:id/approval` | —                                    | `{ billId, approval: { id, status, approverName, comment, reason, autoApproved, submittedAt, reviewedAt } }` |

**Middlewares applied:**

- `companyScopeGuard` — tenant isolation
- `resolveSessionContext` with `sensitive-write` — on submit/approve/reject
- `hasPermission("approve:ap-bills")` guard on approve/reject

### 2.4 Bill Status + Approval Interaction

When `POST /api/bills/:id/submit`:

1. Validate bill in `DRAFT` status
2. Check `approval_rules` threshold
3. If auto-approve: create `BillApproval` with `status=APPROVED, autoApproved=true`
4. If manual: create `BillApproval` with `status=PENDING_REVIEW`
5. Transition bill to `SENT` (workflow-locked for review)

When `POST /api/bills/:id/approve`:

1. Validate `BillApproval.status = PENDING_REVIEW`
2. Validate `hasPermission("approve:ap-bills")`
3. Transition `BillApproval` to `APPROVED`
4. Bill remains `SENT` (now unlocked for payment)

When `POST /api/bills/:id/reject`:

1. Validate `BillApproval.status = PENDING_REVIEW`
2. Transition `BillApproval` to `REJECTED` with `reason`
3. Transition bill back to `DRAFT` (for correction)

### 2.5 Migration from Embedded Workflow Trace

**Phase 2 migration:**

1. Read existing `notes` from `bills` table
2. Extract `[BILL_WORKFLOW]` events via `extractWorkflowEventsFromNotes()`
3. For bills where the most recent transition was `→ SENT`, create `BillApproval` with `status=APPROVED` (treating existing SENT bills as already approved)
4. Strip workflow events from `notes` (using `stripWorkflowEventsFromNotes()`)
5. Future transitions use `bill_approvals` table exclusively

### 2.6 Drizzle Schema (Phase 2)

```typescript
// packages/persistence/src/schema/approval.schema.ts

export const billApprovalStatusEnum = pgEnum('bill_approval_status', [
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
])

export const billApprovals = pgTable(
  'bill_approvals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    billId: uuid('bill_id')
      .references(() => bills.id)
      .notNull()
      .unique(),
    companyId: uuid('company_id')
      .references(() => companies.id)
      .notNull(),
    status: billApprovalStatusEnum('status')
      .default('PENDING_REVIEW')
      .notNull(),
    approverId: uuid('approver_id').references(() => users.id),
    approverName: varchar('approver_name', { length: 255 }),
    comment: text('comment'),
    reason: text('reason'),
    autoApproved: boolean('auto_approved').default(false).notNull(),
    submittedAt: timestamp('submitted_at').defaultNow().notNull(),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    billIdx: index('bill_approvals_bill_id_idx').on(t.billId),
    companyStatusIdx: index('bill_approvals_company_status_idx').on(
      t.companyId,
      t.status
    ),
  })
)

export const approvalRules = pgTable('approval_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id')
    .references(() => companies.id)
    .notNull()
    .unique(),
  autoApproveThresholdCents: integer('auto_approve_threshold_cents')
    .default(0)
    .notNull(),
  currency: currencyEnum('currency').default('PEN').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

---

## Phase 3 — Purchase Order Integration

### 3.1 PurchaseOrder Aggregate

```
PurchaseOrder {
  id: UUID
  companyId: UUID (tenant scope)
  vendorId: UUID (FK → businessPartners.id)
  poNumber: string (auto-generated: OC-YYYY-NNNNN)
  issueDate: date
  expectedDate: date? (expected delivery)
  currency: PEN | USD | EUR
  items: POItem[]
  subtotalCents: integer (Money)
  igvCents: integer (Money)
  totalCents: integer (Money)
  receivedTotalCents: integer (Money, computed from matched bills)
  status: DRAFT | ISSUED | PARTIALLY_RECEIVED | FULLY_RECEIVED | CLOSED
  notes: string?
  createdAt: datetime
  updatedAt: datetime
}
```

**Lifecycle:**

```
DRAFT ──issue()──► ISSUED ──matchBill(partial)──► PARTIALLY_RECEIVED
                      │                                     │
                      │                         matchBill(full)
                      │                                     │
                      │                              FULLY_RECEIVED
                      │                                     │
                      └────close()──────────────────────────┘
                                      │
                                   CLOSED (terminal)
```

**States:**

| Status             | Meaning            | Editable               | Matchable |
| ------------------ | ------------------ | ---------------------- | --------- |
| DRAFT              | Being prepared     | Items, vendor, amounts | ❌        |
| ISSUED             | Sent to vendor     | ❌ (immutable)         | ✅        |
| PARTIALLY_RECEIVED | Some bills matched | ❌                     | ✅        |
| FULLY_RECEIVED     | All bills matched  | ❌                     | ❌        |
| CLOSED             | Manually closed    | ❌                     | ❌        |

### 3.2 PO→Bill Matching

Junction table: `purchase_order_bill_matches`

```
purchase_order_bill_matches {
  id: UUID
  purchaseOrderId: UUID (FK → purchase_orders.id)
  billId: UUID (FK → bills.id)
  matchedCents: integer
  matchedAt: datetime
}
```

**Matching rules:**

1. PO must be `ISSUED` or `PARTIALLY_RECEIVED`
2. Bill must belong to the same tenant
3. `matchedCents ≤ (PO.totalCents - PO.receivedTotalCents)`
4. When match is created, PO's `receivedTotalCents` is recalculated from all matches
5. If `receivedTotalCents ≥ totalCents`, PO transitions to `FULLY_RECEIVED`
6. Junction is immutable after creation (audit trail)

### 3.3 DB Schema Changes (Phase 3)

#### New Enum

```sql
CREATE TYPE purchase_order_status AS ENUM (
  'DRAFT', 'ISSUED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED'
);
```

#### New Tables

```sql
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  vendor_id UUID NOT NULL REFERENCES business_partners(id),
  po_number VARCHAR(50) NOT NULL,
  issue_date DATE NOT NULL,
  expected_date DATE,
  currency currency NOT NULL DEFAULT 'PEN',
  subtotal_cents INTEGER NOT NULL,
  igv_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  received_total_cents INTEGER NOT NULL DEFAULT 0,
  status purchase_order_status NOT NULL DEFAULT 'DRAFT',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(company_id, po_number)
);

CREATE INDEX po_company_status_idx ON purchase_orders(company_id, status);
CREATE INDEX po_vendor_idx ON purchase_orders(vendor_id);

CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  description VARCHAR(500) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  total_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX poi_order_idx ON purchase_order_items(purchase_order_id);

CREATE TABLE purchase_order_bill_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id),
  bill_id UUID NOT NULL REFERENCES bills(id),
  matched_cents INTEGER NOT NULL,
  matched_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(purchase_order_id, bill_id)
);

CREATE INDEX pobm_po_idx ON purchase_order_bill_matches(purchase_order_id);
CREATE INDEX pobm_bill_idx ON purchase_order_bill_matches(bill_id);
```

### 3.4 API Contracts (Phase 3)

| Method  | Path                                  | Body                                                                      | Response                                     |
| ------- | ------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------- |
| `POST`  | `/api/purchase-orders`                | `{ companyId, vendorId, currency?, expectedDate?, notes?, items: [...] }` | 201 `{ id, poNumber, status: "DRAFT", ... }` |
| `GET`   | `/api/purchase-orders`                | query: `{ companyId, status?, vendorId? }`                                | `{ orders: [...], total }`                   |
| `GET`   | `/api/purchase-orders/:id`            | —                                                                         | PO with `matchedBills[]`                     |
| `PATCH` | `/api/purchase-orders/:id/status`     | `{ status: "ISSUED"                                                       | "CLOSED", reason?, actorId?, actorName? }`   | `{ id, status }` |
| `POST`  | `/api/purchase-orders/:id/match-bill` | `{ billId }`                                                              | Updated PO                                   |

### 3.5 Spend Tracking (Computed, no new table)

```
GET /api/purchase-orders/spend?companyId=<id>[&vendorId=<id>]
```

Response:

```json
{
  "spend": [
    {
      "vendorId": "...",
      "vendorName": "...",
      "committedCents": 500000,
      "receivedCents": 300000,
      "remainingCents": 200000,
      "currency": "PEN"
    }
  ]
}
```

**Computation:** Aggregated from `purchase_orders` grouped by `vendorId`.

- `committed` = sum of all `total_cents` for ISSUED+ POs
- `received` = sum of `received_total_cents`
- `remaining` = `committed - received`

---

## Phase 4 — AP Aging & Payment Scheduling

### 4.1 Bills Table Extensions

Add to existing `bills` table:

```sql
ALTER TABLE bills ADD COLUMN balance_due_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bills ADD COLUMN paid_amount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bills ADD COLUMN paid_date TIMESTAMPTZ;
ALTER TABLE bills ADD COLUMN detraction_id UUID REFERENCES detractions(id);
```

**Migration strategy:** Backfill `balanceDue` = `totalAmount` for existing unpaid bills.

### 4.2 Detraction → Bill Linking

Extend `detractions` table to link to bills:

```sql
ALTER TABLE detractions ADD COLUMN bill_id UUID REFERENCES bills(id);
ALTER TABLE detractions ADD COLUMN operation_type VARCHAR(50);
```

Also add a `spot_rates` table for rate lookup:

```sql
CREATE TABLE spot_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_code VARCHAR(3) NOT NULL,        -- e.g., '010', '030'
  description VARCHAR(255) NOT NULL,    -- e.g., 'Azúcar', 'Construcción'
  rate_percent NUMERIC(5,2) NOT NULL,   -- e.g., 10.00
  operation_type VARCHAR(50) NOT NULL,  -- e.g., 'CONSTRUCCION'
  effective_from DATE NOT NULL,
  effective_until DATE,                 -- NULL = currently active
  sunat_resolution VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX spot_rates_code_idx ON spot_rates(spot_code);
CREATE INDEX spot_rates_operation_idx ON spot_rates(operation_type);
```

**Detraction calculation at bill registration:**

1. Receive bill with `operationType`
2. Look up `spot_rates` where `operation_type = bill.operationType` AND `effective_from ≤ bill.issueDate ≤ effective_until`
3. If match found: `detractionAmount = bill.totalAmount × (rate.ratePercent / 100)`
4. Create `detractions` record linked to `bill.id`
5. Store as immutable obligation — not recalculated on payment

### 4.3 AP Aging Endpoint

```
GET /api/bills/aging?companyId=<id>[&asOf=<date>][&vendorId=<id>]
```

**Implementation:** Pure SQL aggregation on `bills` table. No new tables.

```sql
-- Aging query (conceptual)
SELECT
  b.vendor_id,
  SUM(CASE WHEN b.due_date > $asOf THEN b.balance_due_cents ELSE 0 END) AS current_cents,
  SUM(CASE WHEN b.due_date <= $asOf AND b.due_date > $asOf - INTERVAL '30 days' THEN b.balance_due_cents ELSE 0 END) AS d1_30_cents,
  SUM(CASE WHEN b.due_date <= $asOf - INTERVAL '30 days' AND b.due_date > $asOf - INTERVAL '60 days' THEN b.balance_due_cents ELSE 0 END) AS d31_60_cents,
  SUM(CASE WHEN b.due_date <= $asOf - INTERVAL '60 days' THEN b.balance_due_cents ELSE 0 END) AS d61_plus_cents,
  SUM(b.balance_due_cents) AS total_cents
FROM bills b
WHERE b.company_id = $companyId
  AND b.status IN ('SENT', 'OVERDUE')
GROUP BY b.vendor_id;
```

**Response shape:**

```json
{
  "aging": [
    {
      "vendorId": "...",
      "vendorName": "...",
      "totalCents": 150000,
      "currentCents": 50000,
      "d1_30Cents": 60000,
      "d31_60Cents": 30000,
      "d61_plusCents": 10000,
      "currency": "PEN",
      "status": "ok"
    }
  ],
  "kpis": {
    "totalOutstandingCents": 150000,
    "currentTotalCents": 50000,
    "overdueTotalCents": 100000,
    "avgDaysToPay": 45.3
  }
}
```

### 4.4 Payment Calendar Endpoint

```
GET /api/bills/payment-calendar?companyId=<id>[&from=<date>][&to=<date>]
```

**Implementation:** Query bills grouped by due date week. No new tables.

```sql
SELECT
  DATE_TRUNC('week', b.due_date) AS week_start,
  SUM(b.balance_due_cents) AS total_due_cents,
  COUNT(*) AS bill_count,
  json_agg(json_build_object(
    'billId', b.id,
    'billNumber', b.bill_number,
    'vendorName', bp.legal_name,
    'dueDate', b.due_date,
    'balanceDueCents', b.balance_due_cents,
    'currency', b.currency
  ) ORDER BY b.due_date) AS bills
FROM bills b
JOIN business_partners bp ON b.vendor_id = bp.id
WHERE b.company_id = $companyId
  AND b.status IN ('SENT', 'OVERDUE')
  AND b.due_date BETWEEN $from AND $to
GROUP BY DATE_TRUNC('week', b.due_date)
ORDER BY week_start;
```

### 4.5 Batch Payment Runs

```
POST /api/bills/batch-pay
```

**Body:**

```json
{
  "companyId": "string",
  "payments": [{ "billId": "string", "amountCents": 10000, "currency": "PEN" }],
  "actorId": "string?",
  "actorName": "string?"
}
```

**Implementation:**

- Atomic: all payments succeed or all roll back (DB transaction)
- Validate each payment before executing any
- All bills must belong to same `companyId`
- Returns summary of results

**No new tables.** Uses existing `bills.balance_due_cents` and `bills.paid_amount_cents`.

### 4.6 API Contracts Summary (Phase 4)

| Method | Path                          | Description                                       |
| ------ | ----------------------------- | ------------------------------------------------- |
| `GET`  | `/api/bills/aging`            | Real-time AP aging with vendor breakdown + KPIs   |
| `GET`  | `/api/bills/payment-calendar` | Weekly payment calendar with cash flow projection |
| `POST` | `/api/bills/batch-pay`        | Atomic batch payment run                          |

---

## Entity Relationship Diagram (Full, All Phases)

```
┌──────────────────┐       ┌──────────────────────┐
│   companies      │       │   businessPartners    │
│  (core.schema)   │◄──────│ (business-partners)   │
└────────┬─────────┘       └──────────┬───────────┘
         │                            │
         │                    ┌───────┴────────┐
         │                    │ vendorProfiles  │
         │                    │ customerProfiles│
         │                    └────────────────┘
         │
    ┌────┴────────────────────────────────┐
    │                                     │
┌───▼──────────┐                  ┌──────▼──────────┐
│   invoices   │                  │     bills        │
│  (AR side)   │                  │   (AP side)      │
├──────────────┤                  ├──────────────────┤
│ invoice_items│                  │   bill_items     │
│ payments ◄───┤ (invoice only)   │                  │
│ credit_notes │                  │ balance_due_cents │ ← Phase 4
│ debit_notes  │                  │ paid_amount_cents │ ← Phase 4
└──────────────┘                  │ paid_date        │ ← Phase 4
                                  │ detraction_id ◄──┤ ← Phase 4
                                  └──────┬───────────┘
                                         │
                          ┌──────────────┼──────────────┐
                          │              │              │
                   ┌──────▼─────┐ ┌─────▼──────┐ ┌────▼──────────┐
                   │bill_approvals│ │purchase_   │ │  detractions  │
                   │  (Phase 2)  │ │order_bill_ │ │ (accounting)  │
                   ├─────────────┤ │matches     │ ├───────────────┤
                   │approval_rules│ │(Phase 3)   │ │  spot_rates   │
                   └─────────────┘ └────────────┘ │  (Phase 4)    │
                                                  └───────────────┘

                          ┌──────────────────┐
                          │ purchase_orders   │ (Phase 3)
                          ├──────────────────┤
                          │ purchase_order_items│
                          └──────────────────┘
```

---

## Feature Directory Structure

```
apps/api/src/features/
├── billing/
│   ├── bill/                        # Existing — Phase 1 formalizes
│   │   ├── api/
│   │   │   ├── routes.ts            # Existing + Phase 2/4 extensions
│   │   │   └── handlers/
│   │   │       ├── load-scoped-bill.ts
│   │   │       └── load-scoped-bill-approval.ts  # Phase 2
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   │   ├── create-bill.command.ts
│   │   │   │   ├── submit-bill-for-approval.command.ts    # Phase 2
│   │   │   │   ├── approve-bill.command.ts                # Phase 2
│   │   │   │   ├── reject-bill.command.ts                 # Phase 2
│   │   │   │   ├── batch-pay-bills.command.ts             # Phase 4
│   │   │   │   └── apply-payment.command.ts
│   │   │   ├── queries/
│   │   │   │   ├── get-bill-approval.query.ts             # Phase 2
│   │   │   │   ├── get-ap-aging.query.ts                  # Phase 4
│   │   │   │   └── get-payment-calendar.query.ts          # Phase 4
│   │   │   └── services/
│   │   │       ├── workflow-trace.ts          # Existing
│   │   │       ├── approval-engine.ts         # Phase 2
│   │   │       └── detraction-calculator.ts   # Phase 4
│   │   ├── domain/
│   │   │   ├── bill.entity.ts                 # Existing
│   │   │   ├── bill-approval.entity.ts        # Phase 2
│   │   │   ├── bill.repository.interface.ts   # Existing — extended
│   │   │   └── approval-rules.entity.ts       # Phase 2
│   │   └── infrastructure/
│   │       ├── bill.repository.ts             # Existing — extended
│   │       └── bill-approval.repository.ts    # Phase 2
│   └── invoice/                     # Existing
│       └── ...
├── purchasing/                      # Phase 3 — new feature
│   ├── api/
│   │   └── routes.ts
│   ├── application/
│   │   ├── commands/
│   │   │   ├── create-purchase-order.command.ts
│   │   │   ├── issue-purchase-order.command.ts
│   │   │   ├── close-purchase-order.command.ts
│   │   │   └── match-bill-to-po.command.ts
│   │   ├── queries/
│   │   │   ├── list-purchase-orders.query.ts
│   │   │   ├── get-purchase-order.query.ts
│   │   │   └── get-spend-by-vendor.query.ts
│   │   └── services/
│   │       └── po-number-generator.ts
│   ├── domain/
│   │   ├── purchase-order.entity.ts
│   │   ├── purchase-order-item.entity.ts
│   │   └── purchase-order.repository.interface.ts
│   └── infrastructure/
│       └── purchase-order.repository.ts
└── vendors/                         # Existing
    └── ...

apps/web/src/features/
├── bills/
│   ├── components/
│   │   ├── BillApprovalPanel.tsx        # Phase 2
│   │   └── tabs/
│   │       ├── BillsAgingTab.tsx        # Phase 4: connect to backend
│   │       └── PaymentCalendarTab.tsx   # Phase 4: new
│   └── ...
├── purchasing/                          # Phase 3
│   ├── components/
│   │   ├── PurchaseOrderList.tsx
│   │   ├── PurchaseOrderDetail.tsx
│   │   └── SpendTracking.tsx
│   └── ...
```

---

## Migration Plan

### Prerequisite: drenyra-invoice-entity-unification + drenyra-invoice-update-refactor

These must complete before this SDD begins, establishing the unified Invoice/Bill entity shapes.

### Phase 1 Migration (Docs + Tests)

**No database migrations.**

1. Write property-based tests for Invoice lifecycle state machine
2. Write property-based tests for Bill lifecycle state machine
3. Write tenant isolation integration tests
4. Write vendor CRUD tests
5. Update capability map in `docs/architecture/capability-map.md`
6. Update CODEX-MAP.md with new test file references

### Phase 2 Migration

```sql
-- Migration 001: Create approval types and tables
CREATE TYPE bill_approval_status AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

CREATE TABLE bill_approvals (...);
CREATE TABLE approval_rules (...);

-- Migration 002: Extract existing workflow events
-- Run via application migration script:
-- 1. For each bill with [BILL_WORKFLOW] in notes where last event was → SENT:
--    INSERT INTO bill_approvals (bill_id, company_id, status, auto_approved, submitted_at)
--    VALUES (bill.id, bill.company_id, 'APPROVED', false, event.at)
-- 2. Strip [BILL_WORKFLOW] from notes via stripWorkflowEventsFromNotes()
```

**Rollback:** Drop `bill_approvals` and `approval_rules`. Keep `notes` unchanged (migration doesn't destroy the embedded events, it copies them).

### Phase 3 Migration

```sql
-- Migration 003: Create PO types and tables
CREATE TYPE purchase_order_status AS ENUM ('DRAFT', 'ISSUED', 'PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'CLOSED');

CREATE TABLE purchase_orders (...);
CREATE TABLE purchase_order_items (...);
CREATE TABLE purchase_order_bill_matches (...);
```

**Rollback:** Drop all three tables.

### Phase 4 Migration

```sql
-- Migration 004: Extend bills table
ALTER TABLE bills ADD COLUMN balance_due_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bills ADD COLUMN paid_amount_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bills ADD COLUMN paid_date TIMESTAMPTZ;
ALTER TABLE bills ADD COLUMN detraction_id UUID REFERENCES detractions(id);

-- Backfill balance_due_cents for existing unpaid bills
UPDATE bills SET balance_due_cents = total_amount * 100
WHERE status IN ('DRAFT', 'SENT', 'OVERDUE') AND balance_due_cents = 0;

-- Migration 005: Extend detractions
ALTER TABLE detractions ADD COLUMN bill_id UUID REFERENCES bills(id);
ALTER TABLE detractions ADD COLUMN operation_type VARCHAR(50);

-- Migration 006: Create spot_rates table
CREATE TABLE spot_rates (...);
```

**Rollback:** Drop added columns. `spot_rates` can be dropped.

---

## Risks & Mitigations

| Risk                                                 | Impact | Mitigation                                                                                                         |
| ---------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| Embedded workflow trace extraction is lossy          | MEDIUM | Migration copies, doesn't delete. Original `notes` entries preserved during Phase 2.                               |
| `balanceDue` backfill precision mismatch             | HIGH   | Store as cents (integer), not decimal. Use `total_amount * 100` with rounding. Validate with property-based tests. |
| PO number collision under concurrent creation        | LOW    | `UNIQUE(company_id, po_number)` constraint. Retry with next number on conflict.                                    |
| Detraction calculation at registration (not payment) | HIGH   | Immutable after creation. Product decision confirmed. SPOT rate linked by `issueDate`, not `paidDate`.             |
| Batch payment atomicity across many bills            | MEDIUM | Use DB transaction. All-or-nothing semantics. Fail before first mutation if any bill fails validation.             |
| Existing bills without `balanceDue`                  | LOW    | Backfill in migration. Zero for paid/cancelled bills.                                                              |

---

## Test Strategy

### Property-Based Tests (all phases)

```typescript
// Phase 1
test.prop("Bill lifecycle: valid transitions preserve invariants", [arbBillStatus(), arbValidTransition()], ...);
test.prop("Tenant isolation: bill.id from cmp_A is invisible to cmp_B", [arbTenantPair(), arbBillId()], ...);

// Phase 2
test.prop("Approval state machine: approve only from PENDING_REVIEW", [arbApprovalStatus()], ...);
test.prop("Auto-approve threshold: below threshold → auto APPROVED", [arbCents(0, 100000), arbThreshold()], ...);

// Phase 3
test.prop("PO bill matching: received ≤ total always", [arbPO(), arbBill(), arbMatchAmount()], ...);

// Phase 4
test.prop("Aging buckets: sum of buckets = total outstanding", [arbBillSet()], ...);
test.prop("Detraction: amount = total × rate (to 2 decimal places)", [arbAmount(), arbRate(0, 30)], ...);
```

### Integration Tests

- All endpoints with tenant isolation violations
- Session context mismatch detection
- Approval permission guard enforcement
- Batch payment atomicity with partial failures
- Web UI aging tab consuming real backend data (no MOCK_AGING_DATA)

---

## Drizzle Schema Registry (new files)

| File                                                   | Phase | Tables                                                                   |
| ------------------------------------------------------ | ----- | ------------------------------------------------------------------------ |
| `packages/persistence/src/schema/approval.schema.ts`   | 2     | `bill_approvals`, `approval_rules`                                       |
| `packages/persistence/src/schema/purchasing.schema.ts` | 3     | `purchase_orders`, `purchase_order_items`, `purchase_order_bill_matches` |
| `packages/persistence/src/schema/spot.schema.ts`       | 4     | `spot_rates`                                                             |
| `packages/persistence/src/schema/invoicing.schema.ts`  | 4     | `bills` (altered — new columns)                                          |

---

## Success Criteria — Design Validation

Before Phase 2 implementation begins:

- [ ] Phase 1 tests pass with no regressions in existing test suite
- [ ] Property-based tests cover all state transitions for bills and invoices
- [ ] Capability map updated: CAP-AP-03, 04, 05, 07 → ✅ applied

Before Phase 3 implementation begins:

- [ ] Approval state machine tests pass
- [ ] Auto-approve threshold tests pass
- [ ] Workflow trace migration validated on staging data

Before Phase 4 implementation begins:

- [ ] PO lifecycle tests pass
- [ ] Bill matching exceeds-total guard works
- [ ] Spend tracking aggregation matches raw PO data

Final acceptance:

- [ ] `GET /api/bills/aging` returns real data (no mocks), verified against raw bill queries
- [ ] `BillsAgingTab` consumes backend endpoint
- [ ] Detraction obligation is calculated once at bill registration and remains immutable
- [ ] Batch payment rollback verified end-to-end
