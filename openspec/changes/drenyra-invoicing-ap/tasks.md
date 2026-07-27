# SDD Tasks: drenyra-invoicing-ap — Invoicing, Purchases & AP

**Change:** `drenyra-invoicing-ap`
**Phase:** tasks
**Created:** 2026-07-25
**Depends on:** `drenyra-invoice-entity-unification` (prerequisite), `drenyra-invoice-update-refactor` (prerequisite)

---

## Review Workload Forecast

| Field                   | Value                                                                 |
| ----------------------- | --------------------------------------------------------------------- |
| Estimated changed lines | ~2,700 (Phase 1: ~200, Phase 2: ~800, Phase 3: ~1,000, Phase 4: ~700) |
| 400-line budget risk    | High                                                                  |
| Chained PRs recommended | Yes                                                                   |
| Suggested split         | PR 1: Phase 1 → PR 2: Phase 2 → PR 3: Phase 3 → PR 4: Phase 4         |
| Delivery strategy       | auto-chain                                                            |
| Chain strategy          | pending                                                               |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

---

## Prerequisite Gate

Before any Phase 1 task begins:

- [ ] `drenyra-invoice-entity-unification` SDD is archived (completed). <!-- sdd-owner: parent -->
- [ ] `drenyra-invoice-update-refactor` SDD is archived (completed). <!-- sdd-owner: parent -->
- [ ] Full test suite passes on clean `main`. <!-- sdd-owner: parent -->

---

## Phase 1 — Formalize Existing AR/AP (PR #1, ~200 lines)

**Goal:** Documentation + test hardening. Zero schema changes.

### 1.1 Invoice Lifecycle State Machine Tests

- [ ] RED: Write property-based test skeleton at `packages/domain/__tests__/invoice-lifecycle.property.test.ts` that defines all valid and invalid state transitions per the spec table (DRAFT→SENT, SENT→PAID, SENT→OVERDUE, SENT→CANCELLED, OVERDUE→PAID, OVERDUE→CANCELLED, DRAFT→CANCELLED; PAID and CANCELLED are terminal) using `@fast-check/vitest`. Write an initial `arbInvoiceStatus()` and `arbValidTransition()` arbitrary. Tests must fail initially (no implementation binding yet). <!-- sdd-owner: implementation -->
- [ ] GREEN: Implement `packages/domain/src/invoice-lifecycle.ts` with `InvoiceStatus` enum, `VALID_INVOICE_TRANSITIONS` map, and `canTransitionInvoice(from, to): boolean` pure function. Verify the RED tests pass. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: Add edge cases — transition from PAID to SENT (rejected), transition from CANCELLED to any status (rejected), transition to same status (allowed for idempotency? confirm with spec — spec doesn't mention it, so REJECT). Verify tests still pass. <!-- sdd-owner: implementation -->
- [ ] REFACTOR: Extract transition map into a frozen const. No behavior changes. Confirm tests stay green. <!-- sdd-owner: implementation -->

### 1.2 Bill Lifecycle State Machine Tests

- [ ] RED: Write property-based test skeleton at `packages/domain/__tests__/bill-lifecycle.property.test.ts` mirroring the invoice lifecycle for bills (same allowed transitions). Include `arbBillStatus()` arbitrary. Tests must fail initially. <!-- sdd-owner: implementation -->
- [ ] GREEN: Implement `packages/domain/src/bill-lifecycle.ts` with `BillStatus` enum and `canTransitionBill(from, to): boolean`. Reuse the same transition table as invoices (they share the same lifecycle). Verify RED tests pass. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: Add bill-specific edge case — payment amount check is not tested here (it's a domain rule, not a state machine rule). Confirm test coverage includes all transitions from spec. <!-- sdd-owner: implementation -->

### 1.3 Tenant Isolation Integration Tests — Invoices

- [ ] RED: Write integration test at `apps/api/__tests__/invoices-tenant-isolation.test.ts`. Use `@drenyra/test-utils` builders to seed an invoice for `companyId: "cmp_A"`. Test: (a) GET by ID with `companyId: "cmp_B"` context → 403 `TENANT_SCOPE_VIOLATION`, (b) PATCH status with wrong tenant → 403, (c) DELETE with wrong tenant → 403. Tests must fail against the current API if isolation is missing, pass if already implemented. <!-- sdd-owner: implementation -->
- [ ] GREEN: If tests reveal isolation gaps, implement `companyScopeGuard` middleware on the missing invoice routes in `apps/api/src/features/billing/invoice/api/routes.ts`. Re-run tests to confirm pass. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: Add cross-tenant list query test — `GET /api/invoices?companyId=cmp_B` must not return `cmp_A` invoices. <!-- sdd-owner: implementation -->

### 1.4 Tenant Isolation Integration Tests — Bills

- [ ] RED: Write integration test at `apps/api/__tests__/bills-tenant-isolation.test.ts` mirroring the invoice isolation tests for bills. Use `@drenyra/test-utils` builders. Test read, update, delete, and pay operations across tenant boundaries. <!-- sdd-owner: implementation -->
- [ ] GREEN: If tests reveal isolation gaps, implement `companyScopeGuard` on the missing bill routes in `apps/api/src/features/billing/bill/api/routes.ts`. Re-run tests. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: Add cross-tenant batch scenario — attempt to pay a bill from the wrong tenant. <!-- sdd-owner: implementation -->

### 1.5 Credit & Debit Notes Tests

- [ ] RED: Write test at `packages/domain/__tests__/credit-debit-notes.test.ts` covering: (a) credit note creation linked to a SENT invoice, (b) debit note creation linked to a PAID invoice, (c) note creation rejected on DRAFT invoice, (d) note creation rejected on CANCELLED invoice. Use existing `@drenyra/domain` note entities if available. <!-- sdd-owner: implementation -->
- [ ] GREEN: If the domain layer already has validation, verify tests pass. If not, implement validation logic in `packages/domain/src/credit-debit-notes.ts` exposing `canCreateNoteForInvoice(status): boolean`. <!-- sdd-owner: implementation -->

### 1.6 Vendor CRUD Tests

- [ ] RED: Write integration test at `apps/api/__tests__/vendors-crud.test.ts`. Use `@drenyra/test-utils`. Cover: (a) create vendor with valid RUC → 201, (b) duplicate RUC in same tenant → 409, (c) vendor with no RUC → 400 validation, (d) delete vendor with associated bills → 409 `VENDOR_HAS_BILLS`. Tests must fail if validation is missing. <!-- sdd-owner: implementation -->
- [ ] GREEN: Implement missing validation: duplicate RUC check in `apps/api/src/features/vendors/`, deletion safety check counting `bills WHERE vendor_id = $id`. Re-run tests. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE: Add same-RUC different-tenant test — RUC `"20100000001"` can exist in both `cmp_A` and `cmp_B` (uniqueness is per tenant, confirmed by design). <!-- sdd-owner: implementation -->

### 1.7 Workflow Trace Integrity Tests

- [ ] RED: Write unit test at `apps/api/src/features/billing/bill/application/services/__tests__/workflow-trace.test.ts` (if not already existing) covering: (a) `appendWorkflowEventToNotes` correctly serializes event into notes, (b) `extractWorkflowEventsFromNotes` parses back all events, (c) `stripWorkflowEventsFromNotes` removes all events leaving only visible notes, (d) empty notes → empty events, (e) notes without workflow markers are preserved. <!-- sdd-owner: implementation -->
- [ ] GREEN: If existing `workflow-trace.ts` already has these behaviors, verify the tests pass. If gaps found, fix the implementation in `apps/api/src/features/billing/bill/application/services/workflow-trace.ts`. <!-- sdd-owner: implementation -->

### 1.8 Money Value Object Fiscal Invariants Tests

- [ ] RED: Write property-based test at `packages/domain/__tests__/fiscal-invariants.property.test.ts` covering: (a) `Money` addition is commutative, (b) `Money` multiplication by scalar preserves proportionality, (c) cents conversion is lossless for valid amounts (no floating-point drift), (d) IGV calculation = `amount × 0.18` for `GRAVADO`, `0` for `EXONERADO`/`INAFECTO`, (e) negative amounts are rejected. Use `@fast-check/vitest` with `arbMoney()` arbitrary. <!-- sdd-owner: implementation -->
- [ ] GREEN: If existing `Money` value object already satisfies these, verify tests pass. If any invariant fails, fix the `Money` implementation in `packages/domain/src/`. <!-- sdd-owner: implementation -->

### 1.9 Documentation & Capability Map Update

- [ ] Update `docs/architecture/capability-map.md`: change CAP-AP-03, CAP-AP-04, CAP-AP-05, CAP-AP-07 from `🟡 partial` to `✅ applied`. <!-- sdd-owner: implementation -->
- [ ] Update `CODEX-MAP.md` with new test file references: `packages/domain/__tests__/invoice-lifecycle.property.test.ts`, `packages/domain/__tests__/bill-lifecycle.property.test.ts`, `apps/api/__tests__/invoices-tenant-isolation.test.ts`, `apps/api/__tests__/bills-tenant-isolation.test.ts`, `packages/domain/__tests__/credit-debit-notes.test.ts`, `apps/api/__tests__/vendors-crud.test.ts`, `packages/domain/__tests__/fiscal-invariants.property.test.ts`. <!-- sdd-owner: implementation -->

### Phase 1 Gate

- [ ] `bun test` passes with zero regressions across all existing test files. <!-- sdd-owner: implementation -->
- [ ] `bun lint` passes with no new warnings. <!-- sdd-owner: implementation -->
- [ ] All 7 new test files execute and pass. <!-- sdd-owner: implementation -->

---

## Phase 2 — AP Approval Workflow (PR #2, ~800 lines)

**Goal:** `BillApproval` aggregate, `approval_rules` table, approval API, workflow trace migration.

### 2.1 Drizzle Schema — Enum + New Tables

- [ ] Create `packages/persistence/src/schema/approval.schema.ts` with: `billApprovalStatusEnum` pgEnum (`PENDING_REVIEW`, `APPROVED`, `REJECTED`), `billApprovals` table (columns per design section 2.6: id, billId unique FK, companyId FK, status, approverId FK, approverName, comment, reason, autoApproved, submittedAt, reviewedAt, createdAt, updatedAt; indexes on bill_id and company_id+status), `approvalRules` table (id, companyId unique FK, autoApproveThresholdCents, currency, enabled, createdAt, updatedAt). <!-- sdd-owner: implementation -->
- [ ] Register exports from `approval.schema.ts` in `packages/persistence/src/schema/index.ts` barrel file (add import + export block). <!-- sdd-owner: implementation -->
- [ ] Run `bun run db:generate` to generate the migration. Verify the generated SQL matches the design's DDL (Phase 2 migration). <!-- sdd-owner: implementation -->

### 2.2 BillApproval Domain Entity

- [ ] Create `apps/api/src/features/billing/bill/domain/bill-approval.entity.ts` with `BillApproval` interface/class: fields per design section 2.1, `BillApprovalStatus` enum, factory `createBillApproval(billId, companyId, autoApproved)` returning PENDING_REVIEW or APPROVED, `approve(approverId, approverName, comment?)` method transitioning PENDING_REVIEW → APPROVED (throws on wrong status), `reject(approverId, approverName, reason)` method transitioning PENDING_REVIEW → REJECTED (throws on wrong status). Immutability: status field is readonly after APPROVED/REJECTED. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/billing/bill/domain/approval-rules.entity.ts` with `ApprovalRules` interface and `shouldAutoApprove(rules, billTotalCents): boolean` pure function: if no rules row → returns false (threshold 0), if `rules.enabled === false` → returns false, if `billTotalCents <= rules.autoApproveThresholdCents` → true, else false. <!-- sdd-owner: implementation -->

### 2.3 BillApproval Repository

- [ ] Create `apps/api/src/features/billing/bill/domain/bill-approval.repository.interface.ts` with `IBillApprovalRepository` interface: `findByBillId(billId)`, `save(approval)`, `findApprovalRulesByCompanyId(companyId)`, `saveApprovalRules(rules)`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/billing/bill/infrastructure/bill-approval.repository.ts` implementing `IBillApprovalRepository` using Drizzle ORM against `billApprovals` and `approvalRules` tables with tenant-scoped queries (all queries include `companyId` filter). <!-- sdd-owner: implementation -->

### 2.4 Approval Engine Service

- [ ] Create `apps/api/src/features/billing/bill/application/services/approval-engine.ts` with `ApprovalEngine` class: `submitForApproval(bill, companyId)` — validates bill in DRAFT status, loads `approvalRules`, calls `shouldAutoApprove`, creates `BillApproval`, transitions bill to SENT. `approveBill(approvalId, approverId, approverName, comment?)` — loads approval, validates PENDING_REVIEW, checks `hasPermission("approve:ap-bills")`, calls `approve()`, persists. `rejectBill(approvalId, approverId, approverName, reason)` — loads approval, validates PENDING_REVIEW, checks permission, calls `reject()`, transitions bill back to DRAFT, persists. <!-- sdd-owner: implementation -->

### 2.5 Approval Commands (CQRS)

- [ ] Create `apps/api/src/features/billing/bill/application/commands/submit-bill-for-approval.command.ts`: input `{ billId, companyId, actorId?, actorName? }`, output `{ billId, approvalId, status, autoApproved }`. Validates bill in DRAFT, delegates to `ApprovalEngine.submitForApproval`. Wraps in DB transaction. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/billing/bill/application/commands/approve-bill.command.ts`: input `{ billId, companyId, comment?, actorId?, actorName? }`, output `{ billId, approvalId, status }`. Delegates to `ApprovalEngine.approveBill`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/billing/bill/application/commands/reject-bill.command.ts`: input `{ billId, companyId, reason, actorId?, actorName? }`, output `{ billId, approvalId, status, reason }`. Delegates to `ApprovalEngine.rejectBill`. Transitions bill back to DRAFT. <!-- sdd-owner: implementation -->

### 2.6 Approval Query

- [ ] Create `apps/api/src/features/billing/bill/application/queries/get-bill-approval.query.ts`: input `{ billId, companyId }`, output `{ billId, approval: { id, status, approverName, comment, reason, autoApproved, submittedAt, reviewedAt } }`. Tenant-scoped read. <!-- sdd-owner: implementation -->

### 2.7 Approval API Routes

- [ ] Add to `apps/api/src/features/billing/bill/api/routes.ts` (or create handlers file): `POST /api/bills/:id/submit` — handler calls `submit-bill-for-approval.command.ts`. Middlewares: `companyScopeGuard`, `resolveSessionContext` with `sensitive-write`. <!-- sdd-owner: implementation -->
- [ ] Add `POST /api/bills/:id/approve` — handler calls `approve-bill.command.ts`. Middlewares: `companyScopeGuard`, `resolveSessionContext` with `sensitive-write`, `hasPermission("approve:ap-bills")`. <!-- sdd-owner: implementation -->
- [ ] Add `POST /api/bills/:id/reject` — handler calls `reject-bill.command.ts`. Middlewares: `companyScopeGuard`, `resolveSessionContext` with `sensitive-write`, `hasPermission("approve:ap-bills")`. <!-- sdd-owner: implementation -->
- [ ] Add `GET /api/bills/:id/approval` — handler calls `get-bill-approval.query.ts`. Middleware: `companyScopeGuard`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/billing/bill/api/handlers/load-scoped-bill-approval.ts` with `loadScopedBillApproval` handler that resolves the bill approval scoped to tenant+user. Follow existing `load-scoped-bill.ts` pattern. <!-- sdd-owner: implementation -->

### 2.8 Workflow Trace Migration Script

- [ ] Create migration script at `apps/api/src/features/billing/bill/application/services/__tests__/workflow-trace-migration.integration.test.ts` (or as a run-once migration): for each bill with `[BILL_WORKFLOW]` in `notes` where the most recent transition was `→ SENT`, create a `BillApproval` record with `status=APPROVED, autoApproved=false, submittedAt=event.at`. Strip `[BILL_WORKFLOW]` events from `notes`. Verify: no data loss (original notes content preserved minus workflow markers), correct count of migrated approvals. <!-- sdd-owner: implementation -->
- [ ] For new bills post-Phase 2: ensure `apply-payment.command.ts` and `routes.ts` status transitions use `bill_approvals` table, NOT the embedded workflow trace pattern. Deprecate `appendWorkflowEventToNotes` for bill workflow (keep for backward compat layer in migration). <!-- sdd-owner: implementation -->

### 2.9 Phase 2 Tests

- [ ] RED: Write property-based test at `packages/domain/__tests__/approval-state-machine.property.test.ts`: arbApprovalStatus() × arbApprovalAction() → valid/invalid transitions (APPROVED/REJECTED are terminal, approve only from PENDING_REVIEW, reject only from PENDING_REVIEW). <!-- sdd-owner: implementation -->
- [ ] GREEN: Implement/verify the `BillApproval` entity methods enforce these transitions. Tests pass. <!-- sdd-owner: implementation -->
- [ ] RED: Write property-based test for auto-approve threshold: `arbCents(0, 100000)` × `arbThreshold()` → `shouldAutoApprove` correctly discriminates below/above threshold including edge cases (exactly at threshold → auto-approve, no rules → no auto-approve, disabled rules → no auto-approve). <!-- sdd-owner: implementation -->
- [ ] GREEN: Implement/verify `shouldAutoApprove` logic. Tests pass. <!-- sdd-owner: implementation -->
- [ ] Write integration test at `apps/api/__tests__/approval-workflow.test.ts`: (a) submit bill → approval created PENDING_REVIEW, bill becomes SENT, (b) approve → approval becomes APPROVED, (c) reject → approval becomes REJECTED, bill returns to DRAFT, (d) approve without permission → 403, (e) approve already-approved bill → 400, (f) submit non-DRAFT bill → 400. <!-- sdd-owner: implementation -->

### 2.10 BillApprovalPanel UI (web)

- [ ] Create `apps/web/src/features/bills/components/BillApprovalPanel.tsx` displaying: approval status badge (PENDING_REVIEW/APPROVED/REJECTED), approver name and timestamp, auto-approved indicator, Approve button (with optional comment field), Reject button (with required reason field). Buttons only visible when status=PENDING_REVIEW and user has `approve:ap-bills` permission. <!-- sdd-owner: implementation -->
- [ ] Wire `BillApprovalPanel` into the bill detail view in `apps/web/src/features/bills/`. Fetch approval data from `GET /api/bills/:id/approval`. <!-- sdd-owner: implementation -->

### Phase 2 Gate

- [ ] `bun test` passes with zero regressions. <!-- sdd-owner: implementation -->
- [ ] All approval API endpoints return correct responses per spec. <!-- sdd-owner: implementation -->
- [ ] Migration script verified on staging-like data. <!-- sdd-owner: parent -->
- [ ] `bun run db:generate` produces clean migration. <!-- sdd-owner: implementation -->

---

## Phase 3 — Purchase Order Integration (PR #3, ~1,000 lines)

**Goal:** `PurchaseOrder` aggregate, bill matching, spend tracking.

### 3.1 Drizzle Schema — Purchase Orders

- [ ] Create `packages/persistence/src/schema/purchasing.schema.ts` with: `purchaseOrderStatusEnum` pgEnum (`DRAFT`, `ISSUED`, `PARTIALLY_RECEIVED`, `FULLY_RECEIVED`, `CLOSED`), `purchaseOrders` table (id, companyId FK, vendorId FK, poNumber, issueDate, expectedDate, currency, subtotalCents, igvCents, totalCents, receivedTotalCents default 0, status, notes, createdAt, updatedAt; UNIQUE(company_id, po_number); indexes on company_id+status and vendor_id), `purchaseOrderItems` table (id, purchaseOrderId FK CASCADE, productId FK optional, description, quantity, unitPriceCents, totalCents, createdAt; index on purchase_order_id), `purchaseOrderBillMatches` table (id, purchaseOrderId FK, billId FK, matchedCents, matchedAt; UNIQUE(purchase_order_id, bill_id); indexes on purchase_order_id and bill_id). <!-- sdd-owner: implementation -->
- [ ] Register exports from `purchasing.schema.ts` in `packages/persistence/src/schema/index.ts`. <!-- sdd-owner: implementation -->
- [ ] Run `bun run db:generate` to generate the migration. Verify SQL matches design section 3.3. <!-- sdd-owner: implementation -->

### 3.2 PurchaseOrder Domain Entity

- [ ] Create `apps/api/src/features/purchasing/domain/purchase-order.entity.ts`: `PurchaseOrder` class with fields per design section 3.1, `POStatus` enum, factory `createPurchaseOrder(...)`, methods: `issue()` DRAFT→ISSUED, `matchBill(billTotalCents)` ISSUED/PARTIALLY_RECEIVED → updates `receivedTotalCents` + transitions to PARTIALLY_RECEIVED or FULLY_RECEIVED when `receivedTotalCents >= totalCents`, `close(reason)` ISSUED/FULLY_RECEIVED → CLOSED. Immutability after ISSUED (items, amounts, vendor locked). `canMatchBill(amountCents): boolean` — checks `receivedTotalCents + amountCents <= totalCents` and status is ISSUED/PARTIALLY_RECEIVED. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/purchasing/domain/purchase-order-item.entity.ts`: `POItem` value object with productId?, description, quantity, unitPriceCents, totalCents. Validation: quantity ≥ 1, unitPriceCents ≥ 0, description non-empty. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/purchasing/domain/purchase-order.repository.interface.ts`: `IPurchaseOrderRepository` with `findById(id, companyId)`, `findByCompany(companyId, filters?)`, `save(po)`, `findMatchesByPO(poId)`, `saveMatch(match)`, `getSpendByVendor(companyId, vendorId?)`. <!-- sdd-owner: implementation -->

### 3.3 PO Number Generator

- [ ] Create `apps/api/src/features/purchasing/application/services/po-number-generator.ts`: generates `OC-YYYY-NNNNN` format. Auto-increment per tenant. Uses DB sequence or `MAX(po_number)` + 1 with UNIQUE constraint retry on conflict. <!-- sdd-owner: implementation -->

### 3.4 PurchaseOrder Repository

- [ ] Create `apps/api/src/features/purchasing/infrastructure/purchase-order.repository.ts` implementing `IPurchaseOrderRepository` using Drizzle ORM against `purchaseOrders`, `purchaseOrderItems`, `purchaseOrderBillMatches`. All queries include `companyId` filter. `getSpendByVendor` aggregates `totalCents` (committed) and `receivedTotalCents` (received) grouped by `vendorId`. <!-- sdd-owner: implementation -->

### 3.5 Purchase Order Commands (CQRS)

- [ ] Create `apps/api/src/features/purchasing/application/commands/create-purchase-order.command.ts`: input `{ companyId, vendorId, currency?, expectedDate?, notes?, items }`, output `{ id, poNumber, status: "DRAFT", ... }`. Generates PO number, creates PO in DRAFT, validates items (min 1). <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/purchasing/application/commands/issue-purchase-order.command.ts`: input `{ poId, companyId, actorId?, actorName? }`, output `{ id, status: "ISSUED" }`. Validates PO in DRAFT, calls `po.issue()`, persists. Immutable after issue. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/purchasing/application/commands/close-purchase-order.command.ts`: input `{ poId, companyId, reason?, actorId?, actorName? }`, output `{ id, status: "CLOSED" }`. Validates PO in ISSUED or FULLY_RECEIVED, calls `po.close()`. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/purchasing/application/commands/match-bill-to-po.command.ts`: input `{ poId, billId, companyId }`, output updated PO. Validates bill belongs to same tenant, loads bill total, checks `po.canMatchBill(billTotal)`, creates `purchaseOrderBillMatches` record, recalculates `receivedTotalCents`, transitions PO status if needed. All in DB transaction. <!-- sdd-owner: implementation -->

### 3.6 Purchase Order Queries (CQRS)

- [ ] Create `apps/api/src/features/purchasing/application/queries/list-purchase-orders.query.ts`: input `{ companyId, status?, vendorId? }`, output `{ orders: [...], total }`. Tenant-scoped, optional filters. <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/purchasing/application/queries/get-purchase-order.query.ts`: input `{ poId, companyId }`, output PO with `matchedBills[]` (from `purchaseOrderBillMatches` JOIN `bills`). <!-- sdd-owner: implementation -->
- [ ] Create `apps/api/src/features/purchasing/application/queries/get-spend-by-vendor.query.ts`: input `{ companyId, vendorId? }`, output `{ spend: [{ vendorId, vendorName, committedCents, receivedCents, remainingCents, currency }] }`. Delegates to `IPurchaseOrderRepository.getSpendByVendor`. <!-- sdd-owner: implementation -->

### 3.7 Purchase Order API Routes

- [ ] Create `apps/api/src/features/purchasing/api/routes.ts` with routes: `POST /api/purchase-orders` → 201, `GET /api/purchase-orders` → 200 with pagination, `GET /api/purchase-orders/:id` → 200 with matched bills, `PATCH /api/purchase-orders/:id/status` → 200 (supports ISSUED, CLOSED status transitions), `POST /api/purchase-orders/:id/match-bill` → 200 with updated PO. All routes use `companyScopeGuard` + `resolveSessionContext` with `sensitive-write` on mutations. Register routes in the API router. <!-- sdd-owner: implementation -->

### 3.8 Phase 3 Tests

- [ ] RED: Write property-based test at `packages/domain/__tests__/po-lifecycle.property.test.ts`: arbPOStatus() × arbPOAction() → valid/invalid transitions. PO exceeds total guard: arbMatchAmount() must never violate `receivedTotal + matched <= totalCents`. <!-- sdd-owner: implementation -->
- [ ] GREEN: Implement/verify `PurchaseOrder` entity enforces these rules. Tests pass. <!-- sdd-owner: implementation -->
- [ ] Write integration test at `apps/api/__tests__/purchase-orders.test.ts`: (a) create PO → 201 DRAFT, (b) issue PO → ISSUED, (c) match bill → receivedTotal updates, (d) match bill exceeding total → 400, (e) match bill on DRAFT PO → 400, (f) close PO → CLOSED, (g) tenant isolation → 403. <!-- sdd-owner: implementation -->
- [ ] Write spend tracking integration test: seed POs for 2 vendors with mixed statuses, query `GET /api/purchase-orders/spend`, verify committed/received/remaining math matches raw data. <!-- sdd-owner: implementation -->

### 3.9 Purchase Order UI (web)

- [ ] Create `apps/web/src/features/purchasing/components/PurchaseOrderList.tsx`: table with PO number, vendor, status, total, received, remaining. Filters by status and vendor. <!-- sdd-owner: implementation -->
- [ ] Create `apps/web/src/features/purchasing/components/PurchaseOrderDetail.tsx`: full PO view with items table, matched bills list, status badge, action buttons (Issue, Close, Match Bill). <!-- sdd-owner: implementation -->
- [ ] Create `apps/web/src/features/purchasing/components/SpendTracking.tsx`: vendor-grouped committed vs received bar chart or table. <!-- sdd-owner: implementation -->

### Phase 3 Gate

- [ ] `bun test` passes with zero regressions. <!-- sdd-owner: implementation -->
- [ ] All PO API endpoints return correct responses per spec. <!-- sdd-owner: implementation -->
- [ ] PO→Bill matching tested with partial, full, and overflow scenarios. <!-- sdd-owner: implementation -->

---

## Phase 4 — AP Aging & Payment Scheduling (PR #4, ~700 lines)

**Goal:** Bills table extensions, real-time aging, payment calendar, batch payments, detraction linking, spot_rates.

### 4.1 Drizzle Schema — Bills Table Extensions

- [ ] Extend `packages/persistence/src/schema/invoicing.schema.ts` `bills` table: add `balanceDueCents: integer('balance_due_cents').default(0).notNull()`, `paidAmountCents: integer('paid_amount_cents').default(0).notNull()`, `paidDate: timestamp('paid_date')`, `detractionId: uuid('detraction_id')` referencing `detractions.id`. <!-- sdd-owner: implementation -->
- [ ] Extend `packages/persistence/src/schema/accounting.schema.ts` `detractions` table: add `billId: uuid('bill_id')` referencing `bills.id`, `operationType: varchar('operation_type', { length: 50 })`. <!-- sdd-owner: implementation -->
- [ ] Run `bun run db:generate` to generate the migration. Verify SQL matches design section 4.1 and 4.2. <!-- sdd-owner: implementation -->
- [ ] Write backfill migration: `UPDATE bills SET balance_due_cents = total_amount * 100 WHERE status IN ('DRAFT', 'SENT', 'OVERDUE') AND balance_due_cents = 0`. Verify precision (cents are integers, no rounding error). <!-- sdd-owner: implementation -->

### 4.2 Spot Rates Table

- [ ] Create `packages/persistence/src/schema/spot.schema.ts` with `spotRates` table: id, spotCode varchar(3), description varchar(255), ratePercent numeric(5,2), operationType varchar(50), effectiveFrom date, effectiveUntil date nullable, sunatResolution varchar(50), createdAt. Indexes on spot_code and operation_type. <!-- sdd-owner: implementation -->
- [ ] Register exports in `packages/persistence/src/schema/index.ts`. <!-- sdd-owner: implementation -->
- [ ] Run `bun run db:generate`. <!-- sdd-owner: implementation -->

### 4.3 Detraction Calculator Service

- [ ] Create `apps/api/src/features/billing/bill/application/services/detraction-calculator.ts` with `DetractionCalculator` class: `calculateAtRegistration(bill, companyId)` — looks up `spot_rates WHERE operation_type = bill.operationType AND effective_from <= bill.issueDate AND (effective_until IS NULL OR effective_until >= bill.issueDate)`, if match found computes `detractionAmount = bill.totalAmount × (rate.ratePercent / 100)`, creates `detractions` record linked to `bill.id`, returns `{ rate, amount, spotCode }`. If no match → returns null. Calculation is performed ONCE at bill creation; result is immutable. <!-- sdd-owner: implementation -->
- [ ] Integrate `DetractionCalculator` into `create-bill.command.ts` (or the bill creation flow) — after bill is persisted, call `calculateAtRegistration` and link detraction to bill. <!-- sdd-owner: implementation -->

### 4.4 AP Aging Query

- [ ] Create `apps/api/src/features/billing/bill/application/queries/get-ap-aging.query.ts` implementing the SQL aggregation from design section 4.3: `SELECT vendor_id, SUM(CASE WHEN due_date > $asOf THEN balance_due_cents ELSE 0 END) AS current_cents, ... GROUP BY vendor_id`. Input: `{ companyId, asOf?, vendorId? }`. Output: `{ aging: [{ vendorId, vendorName, totalCents, currentCents, d1_30Cents, d31_60Cents, d61_plusCents, currency, status }], kpis: { totalOutstandingCents, currentTotalCents, overdueTotalCents, avgDaysToPay } }`. Status derived from thresholds: `ok` if 80%+ current, `warning` if 50-80%, `critical` if <50%. `avgDaysToPay` computed from paid bills: `AVG(paid_date - issue_date)`. <!-- sdd-owner: implementation -->

### 4.5 Payment Calendar Query

- [ ] Create `apps/api/src/features/billing/bill/application/queries/get-payment-calendar.query.ts` implementing SQL from design section 4.4: `DATE_TRUNC('week', due_date) AS week_start, SUM(balance_due_cents), COUNT(*), json_agg(...)`. Input: `{ companyId, from?, to? }` (from defaults to now, to defaults to now+90d). Output: `{ weeks: [{ weekStart, totalDueCents, billCount, bills: [...] }], projectedCashOutflow: [{ date, totalDueCents, billCount }] }`. Bills sorted by priority: overdue first, then by due date. <!-- sdd-owner: implementation -->

### 4.6 Batch Payment Command

- [ ] Create `apps/api/src/features/billing/bill/application/commands/batch-pay-bills.command.ts`: input `{ companyId, payments: [{ billId, amountCents, currency }], actorId?, actorName? }`. Implementation: (a) validate all bills belong to `companyId` (reject cross-tenant), (b) pre-validate each payment: bill exists, status is SENT/OVERDUE, amount ≤ balanceDue, (c) execute all payments in a single DB transaction — if any fails, rollback all, (d) for each bill: decrement `balanceDueCents`, increment `paidAmountCents`, if `balanceDueCents` reaches 0 → status → PAID and set `paidDate`, (e) return `{ processed: N, failed: 0, results: [...] }` or `{ processed: 0, failed: N, error: { billId, code } }` on failure. <!-- sdd-owner: implementation -->

### 4.7 Phase 4 API Routes

- [ ] Add `GET /api/bills/aging` to `apps/api/src/features/billing/bill/api/routes.ts`: handler calls `get-ap-aging.query.ts`, query params `companyId` (required), `asOf` (optional), `vendorId` (optional). Middleware: `companyScopeGuard`. <!-- sdd-owner: implementation -->
- [ ] Add `GET /api/bills/payment-calendar` to routes: handler calls `get-payment-calendar.query.ts`, query params `companyId` (required), `from` (optional), `to` (optional). Middleware: `companyScopeGuard`. <!-- sdd-owner: implementation -->
- [ ] Add `POST /api/bills/batch-pay` to routes: handler calls `batch-pay-bills.command.ts`, body validated per spec. Middlewares: `companyScopeGuard`, `resolveSessionContext` with `sensitive-write`. <!-- sdd-owner: implementation -->

### 4.8 Phase 4 Tests

- [ ] RED: Write property-based test at `packages/domain/__tests__/aging-buckets.property.test.ts`: `arbBillSet()` → sum of all bucket amounts equals `totalOutstanding`, no negative buckets, bills in PAID/CANCELLED status contribute zero. <!-- sdd-owner: implementation -->
- [ ] GREEN: Implement/verify the aging query satisfies these invariants. Tests pass. <!-- sdd-owner: implementation -->
- [ ] RED: Write property-based test for detractions: `arbAmount() × arbRate(0, 30)` → `detractionAmount = Math.round(amount × rate / 100)` with cents precision. Verifies immutability: recalculating after payment yields the same value. <!-- sdd-owner: implementation -->
- [ ] GREEN: Implement/verify `DetractionCalculator` logic. Tests pass. <!-- sdd-owner: implementation -->
- [ ] Write integration test at `apps/api/__tests__/ap-aging.test.ts`: seed bills in various aging buckets, query endpoint, verify bucket totals match raw SQL, verify KPIs compute correctly, verify `asOf` parameter shifts buckets, verify empty tenant returns zeros. <!-- sdd-owner: implementation -->
- [ ] Write integration test at `apps/api/__tests__/payment-calendar.test.ts`: seed bills with various due dates, query calendar, verify weekly grouping, verify bill ordering, verify cash flow projection. <!-- sdd-owner: implementation -->
- [ ] Write integration test at `apps/api/__tests__/batch-payment.test.ts`: (a) batch pay 2 bills successfully, (b) batch pay with one exceeding balance → full rollback, (c) batch pay cross-tenant → rejection, (d) batch pay with all bills from same vendor. <!-- sdd-owner: implementation -->
- [ ] Write integration test at `apps/api/__tests__/detraction-integration.test.ts`: (a) create bill with operation type matching a spot rate → detraction created and linked, (b) create bill with non-matching operation → no detraction, (c) verify detraction amount unchanged after payment, (d) verify spot rate lookup uses issueDate, not current date. <!-- sdd-owner: implementation -->

### 4.9 Web UI — Aging Tab Rewire

- [ ] Replace hardcoded `MOCK_AGING_DATA` in `apps/web/src/features/bills/components/tabs/BillsAgingTab.tsx` with a fetch to `GET /api/bills/aging?companyId=<current>` (using existing `useCompanyId` or context hook). Display real backend data. Remove the mock data constant. <!-- sdd-owner: implementation -->
- [ ] Create `apps/web/src/features/bills/components/tabs/PaymentCalendarTab.tsx`: new tab component fetching `GET /api/bills/payment-calendar`. Display week-by-week groups with bill cards, due dates, and totals. Highlight overdue weeks in red, current week in amber, future weeks in green. <!-- sdd-owner: implementation -->
- [ ] Wire `PaymentCalendarTab` into `apps/web/src/features/bills/components/BillsBoard.tsx` tabs. <!-- sdd-owner: implementation -->

### Phase 4 Gate

- [ ] `bun test` passes with zero regressions. <!-- sdd-owner: implementation -->
- [ ] `GET /api/bills/aging` returns real data matching raw bill queries (verified by integration test). <!-- sdd-owner: implementation -->
- [ ] `BillsAgingTab` renders live backend data without mock fallback. <!-- sdd-owner: implementation -->
- [ ] Batch payment rollback verified end-to-end. <!-- sdd-owner: implementation -->
- [ ] Detraction obligation immutable after bill creation. <!-- sdd-owner: implementation -->

---

## Final Acceptance (Cross-Phase)

- [ ] `bun test` full suite passes with zero regressions across all 4 phases. <!-- sdd-owner: parent -->
- [ ] `bun lint` passes with no new warnings. <!-- sdd-owner: parent -->
- [ ] `bun run db:generate` produces clean, ordered migrations for Phase 2+3+4. <!-- sdd-owner: parent -->
- [ ] All new API endpoints follow existing conventions: tenant isolation, session context, error shape. <!-- sdd-owner: parent -->
- [ ] Capability map updated: CAP-AP-06 `◌` → `✅ applied`, CAP-AP-08 `◌` → `✅ applied`, CAP-AP-09 `◌` → `✅ applied`, CAP-AP-11 `◌` → `✅ applied`. <!-- sdd-owner: parent -->
- [ ] CODEX-MAP.md updated with all new source and test files. <!-- sdd-owner: parent -->
- [ ] Feature flag `UNIFIED_AP_ENABLED` gates Phase 4 endpoints. <!-- sdd-owner: implementation -->
- [ ] Bounded review completed for each PR batch before merge. <!-- sdd-owner: parent -->
