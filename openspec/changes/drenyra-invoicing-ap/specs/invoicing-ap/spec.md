# Invoicing, Purchases & Accounts Payable Specification

**Capability area:** CAP-AP-01 through CAP-AP-13
**Change:** `drenyra-invoicing-ap`
**Phase:** spec
**Created:** 2026-07-25
**Depends on:** `drenyra-invoice-entity-unification`, `drenyra-invoice-update-refactor`

---

## Purpose

Define the behavioral contract for Drenyra's invoicing, purchases, and accounts payable capability area. This specification formalizes existing AR/AP lifecycles (Phase 1), introduces AP approval workflow with single-approver semantics (Phase 2), adds purchase order integration with bill matching (Phase 3), and delivers real-time AP aging with payment scheduling and detraction integration (Phase 4).

---

## Requirements

### Phase 1 — Formalize Existing AR/AP

#### Requirement: AR Invoice Lifecycle (CAP-AP-03)

The system MUST maintain the complete Accounts Receivable invoice lifecycle with tenant-scoped isolation and immutable audit trail.

##### Scenario: Invoice creation — happy path

- GIVEN an authenticated user with `sensitive-write` security profile
- AND a valid company context for the user's tenant
- WHEN the user creates a new invoice with valid series, correlative, customer, items with SUNAT-compliant tax classification (`GRAVADO`, `EXONERADO`, or `INAFECTO`), and currency (`PEN`, `USD`, or `EUR`)
- THEN the system creates the invoice in `DRAFT` status
- AND the invoice is associated with the caller's `companyId`
- AND all monetary amounts are stored as immutable `Money` value objects
- AND the invoice number is auto-generated from series + correlative (e.g., `F001-00000001`)

##### Scenario: Invoice status transitions

- GIVEN an invoice in `DRAFT` status
- WHEN the user transitions it to `SENT`
- THEN the system records the transition with actor identity and timestamp
- AND the invoice enters `SENT` status

- GIVEN an invoice in `SENT` status
- WHEN the invoice is paid in full
- THEN the system transitions it to `PAID`

- GIVEN an invoice in `SENT` status
- WHEN the due date passes without payment
- THEN the system transitions it to `OVERDUE`

- GIVEN an invoice in `DRAFT` or `SENT` or `OVERDUE` status
- WHEN the user cancels it
- THEN the system transitions it to `CANCELLED`

##### Scenario: Invalid transition rejection

- GIVEN an invoice in `PAID` or `CANCELLED` status
- WHEN the user attempts any status transition
- THEN the system MUST reject with status 400 and code `INVALID_STATUS_TRANSITION`
- AND the invoice status remains unchanged

##### Scenario: Tenant isolation enforcement

- GIVEN an invoice belonging to `companyId: "cmp_A"`
- WHEN a user scoped to `companyId: "cmp_B"` attempts to read, update, or delete it
- THEN the system MUST reject with status 403 and code `TENANT_SCOPE_VIOLATION`

##### Scenario: OSE electronic summary

- GIVEN one or more invoices that have been submitted to SUNAT via OSE
- WHEN an invoice is retrieved by ID
- THEN the response MUST include electronic summary data (`InvoiceElectronicSummary`) when available
- AND the summary MUST contain OSE status, CDR status, and submission timestamps

##### Scenario: DRAFT-only edits

- GIVEN an invoice in `DRAFT` status
- WHEN the user updates invoice fields (items, customer, dates, currency)
- THEN the system applies the update
- AND recalculates subtotal, IGV, and total amounts

- GIVEN an invoice in `SENT`, `PAID`, `OVERDUE`, or `CANCELLED` status
- WHEN the user attempts to modify invoice fields
- THEN the system MUST reject the edit

---

#### Requirement: AP Bill Lifecycle (CAP-AP-04)

The system MUST maintain the Accounts Payable bill lifecycle for received supplier invoices with tenant-scoped isolation, vendor association, and partial payment tracking.

##### Scenario: Bill creation — happy path

- GIVEN an authenticated user with `sensitive-write` security profile
- AND a valid company context for the user's tenant
- WHEN the user creates a new bill with valid vendor ID, bill number, issue date, due date, currency, and line items
- THEN the system creates the bill in `DRAFT` status
- AND the bill is associated with the caller's `companyId`
- AND subtotal, IGV, total, and `balanceDue` are calculated from items

##### Scenario: Bill status transitions

- GIVEN a bill in `DRAFT` status
- WHEN the user transitions it to `SENT`
- THEN the system records the transition with actor identity and timestamp in the embedded workflow trace

- GIVEN a bill in `SENT` status
- WHEN the bill is fully paid
- THEN the system transitions it to `PAID`

- GIVEN a bill in `SENT` status
- WHEN the due date passes without full payment
- THEN the system transitions it to `OVERDUE`

- GIVEN a bill in `DRAFT` or `SENT` or `OVERDUE` status
- WHEN the user cancels it
- THEN the system transitions it to `CANCELLED`

##### Scenario: Payment application against bill

- GIVEN a bill in `SENT` or `OVERDUE` status with `balanceDue > 0`
- WHEN the user applies a payment with amount and currency
- THEN the system reduces `balanceDue` by the paid amount
- AND if `balanceDue` reaches zero the status transitions to `PAID`
- AND the payment event is recorded with actor identity

##### Scenario: Overpayment rejection

- GIVEN a bill with `balanceDue = 500.00`
- WHEN the user attempts to apply a payment of `600.00`
- THEN the system MUST reject with code `PAYMENT_EXCEEDS_BALANCE`

##### Scenario: Payment on wrong status

- GIVEN a bill in `DRAFT`, `PAID`, or `CANCELLED` status
- WHEN the user attempts to apply a payment
- THEN the system MUST reject with code `INVALID_STATUS_FOR_PAYMENT`

##### Scenario: Tenant isolation on bill operations

- GIVEN a bill belonging to `companyId: "cmp_A"`
- WHEN a user scoped to `companyId: "cmp_B"` attempts to read, update, delete, or pay it
- THEN the system MUST reject with status 403 and code `TENANT_SCOPE_VIOLATION`

##### Scenario: Workflow trace audit

- GIVEN a bill that has undergone status transitions
- WHEN the bill is retrieved
- THEN the `workflowEvents` array MUST contain every past transition with `from`, `to`, `actorId`, `actorName`, `reason`, and `at` timestamp
- AND the visible `notes` field MUST exclude raw workflow events

---

#### Requirement: Credit & Debit Notes (CAP-AP-05)

The system MUST support credit and debit notes linked to their originating invoices, with correct tax adjustment semantics.

##### Scenario: Credit note linked to invoice

- GIVEN an existing invoice in `SENT` or `PAID` status
- WHEN the user creates a credit note referencing that invoice with item-level adjustments
- THEN the credit note MUST reduce the invoice's effective total
- AND SUNAT tax document type MUST be correctly set for credit note

##### Scenario: Debit note linked to invoice

- GIVEN an existing invoice in `SENT` or `PAID` status
- WHEN the user creates a debit note referencing that invoice with item-level adjustments
- THEN the debit note MUST increase the invoice's effective total
- AND SUNAT tax document type MUST be correctly set for debit note

##### Scenario: Note rejection on non-billable invoice

- GIVEN an invoice in `DRAFT` or `CANCELLED` status
- WHEN the user attempts to create a credit or debit note referencing it
- THEN the system MUST reject

---

#### Requirement: Vendor/Supplier Management (CAP-AP-07)

The system MUST maintain a vendor registry with RUC-based identification, contact information, and preferred payment method for AP operations.

##### Scenario: Vendor CRUD

- GIVEN an authenticated user scoped to a tenant
- WHEN the user creates a vendor with required fields (RUC, legal name, country)
- THEN the system registers the vendor scoped to the user's `companyId`
- AND the vendor is available for bill association

##### Scenario: RUC uniqueness per tenant

- GIVEN a tenant with an existing vendor having `RUC: "20100000001"`
- WHEN the user attempts to create another vendor with the same RUC in the same tenant
- THEN the system MUST reject with a duplicate error

##### Scenario: Vendor deletion safety

- GIVEN a vendor with at least one associated bill
- WHEN the user attempts to delete the vendor
- THEN the system MUST reject with code `VENDOR_HAS_BILLS`
- AND list the count of associated bills

---

### Phase 2 — AP Approval Workflow (CAP-AP-09)

#### Requirement: BillApproval Entity

The system MUST introduce a `BillApproval` entity that models the approval lifecycle of a received bill before payment, with single-approver semantics per the product decision.

##### Scenario: Bill submitted for approval

- GIVEN a bill in `DRAFT` status
- WHEN an authorized user submits the bill for approval
- THEN the system creates a `BillApproval` record with status `PENDING_REVIEW`
- AND the bill enters a workflow-locked state
- AND the bill's status transitions to `SENT` (awaiting approval review)

##### Scenario: Single approver review — approve

- GIVEN a bill with a `BillApproval` in `PENDING_REVIEW` status
- WHEN the designated approver (any user with `approve:ap-bills` permission) reviews and approves
- THEN the `BillApproval` transitions to `APPROVED`
- AND the approval records the approver's identity, timestamp, and optional comment
- AND the bill is unlocked for payment

##### Scenario: Single approver review — reject

- GIVEN a bill with a `BillApproval` in `PENDING_REVIEW` status
- WHEN the designated approver rejects with a reason
- THEN the `BillApproval` transitions to `REJECTED`
- AND the rejection records the approver's identity, timestamp, and reason
- AND the bill returns to `DRAFT` status for correction

##### Scenario: Approval by non-authorized user

- GIVEN a bill with a `BillApproval` in `PENDING_REVIEW` status
- WHEN a user without `approve:ap-bills` permission attempts to approve or reject
- THEN the system MUST reject with status 403 and code `INSUFFICIENT_PERMISSION`

##### Scenario: Approval on un-submitted bill

- GIVEN a bill without a `BillApproval` record
- WHEN a user attempts to approve or reject
- THEN the system MUST reject with code `APPROVAL_NOT_PENDING`

##### Scenario: Approval audit trail

- GIVEN a bill that has gone through the approval workflow
- WHEN the approval history is queried
- THEN the response MUST contain the complete `BillApproval` timeline: submission, review action, approver, timestamp, and any rejection reason
- AND the timeline MUST be immutable after creation

---

#### Requirement: Approval Rules Configuration

The system MUST support configurable approval rules per tenant, with default auto-approve for bills below a configurable threshold.

##### Scenario: Threshold-based auto-approval

- GIVEN a tenant with `approval_rules.auto_approve_threshold = 1000.00 PEN`
- WHEN a bill with `totalAmount <= 1000.00` is submitted for approval
- THEN the system auto-approves it immediately
- AND the approval record shows `APPROVED` with `auto_approved: true`

##### Scenario: Threshold requires manual approval

- GIVEN a tenant with `approval_rules.auto_approve_threshold = 1000.00 PEN`
- WHEN a bill with `totalAmount > 1000.00` is submitted
- THEN the system creates a `BillApproval` in `PENDING_REVIEW`
- AND the bill awaits manual approval

##### Scenario: Default threshold when not configured

- GIVEN a tenant with no `approval_rules` record
- WHEN any bill is submitted for approval
- THEN the system applies a default threshold of `0.00` (all bills require manual approval)

---

#### Requirement: Approval API Contracts

The system MUST expose approval endpoints that follow the existing bill route conventions with tenant-scoped access and session context validation.

##### Approval endpoints

| Method | Path                      | Purpose                  |
| ------ | ------------------------- | ------------------------ |
| `POST` | `/api/bills/:id/submit`   | Submit bill for approval |
| `POST` | `/api/bills/:id/approve`  | Approve pending bill     |
| `POST` | `/api/bills/:id/reject`   | Reject pending bill      |
| `GET`  | `/api/bills/:id/approval` | Get approval history     |

##### Scenario: Submit bill for approval

- GIVEN an authenticated user with `sensitive-write` profile and valid session context
- AND a bill in `DRAFT` status belonging to the user's tenant
- WHEN `POST /api/bills/:id/submit` is called
- THEN the system creates a `BillApproval` and returns `{ billId, approvalId, status: "PENDING_REVIEW" }`
- AND the response status is 200

##### Scenario: Approve pending bill

- GIVEN a bill with `BillApproval.status = "PENDING_REVIEW"`
- WHEN `POST /api/bills/:id/approve` is called with optional `{ comment }` body
- THEN the system transitions to `APPROVED` and returns `{ billId, approvalId, status: "APPROVED" }`

##### Scenario: Reject pending bill

- GIVEN a bill with `BillApproval.status = "PENDING_REVIEW"`
- WHEN `POST /api/bills/:id/reject` is called with required `{ reason }` body
- THEN the system transitions to `REJECTED` and returns `{ billId, approvalId, status: "REJECTED", reason }`
- AND the bill returns to `DRAFT` status

##### Scenario: Actor identity mismatch rejection

- GIVEN any approval mutation endpoint
- WHEN `body.actorId` is provided but does not match the resolved session's `legacyUserId`
- THEN the system MUST reject with status 403 and code `AUTH_CONTEXT_MISMATCH`

---

### Phase 3 — Purchase Order Integration (CAP-AP-06)

#### Requirement: PurchaseOrder Entity

The system MUST introduce a `PurchaseOrder` aggregate root with a lifecycle of `DRAFT → ISSUED → PARTIALLY_RECEIVED → FULLY_RECEIVED → CLOSED`, tenant-scoped isolation, vendor association, and line-item tracking.

##### PurchaseOrder fields

| Field           | Type                    | Required | Description                                      |
| --------------- | ----------------------- | -------- | ------------------------------------------------ |
| `id`            | UUID                    | yes      | Unique identifier                                |
| `companyId`     | UUID                    | yes      | Tenant scope                                     |
| `vendorId`      | UUID                    | yes      | Supplier reference                               |
| `poNumber`      | string                  | yes      | Human-readable PO number (e.g., `OC-2026-00001`) |
| `issueDate`     | date                    | yes      | Date PO was issued                               |
| `expectedDate`  | date                    | no       | Expected delivery date                           |
| `currency`      | `PEN` \| `USD` \| `EUR` | yes      | Purchase currency                                |
| `items`         | `POItem[]`              | yes      | Line items (min 1)                               |
| `subtotal`      | Money                   | yes      | Sum of line totals before IGV                    |
| `igvAmount`     | Money                   | yes      | Calculated IGV                                   |
| `totalAmount`   | Money                   | yes      | subtotal + igvAmount                             |
| `receivedTotal` | Money                   | yes      | Sum of matched bill amounts                      |
| `status`        | POStatus                | yes      | Lifecycle state                                  |
| `notes`         | string                  | no       | Internal notes                                   |
| `createdAt`     | datetime                | yes      | Creation timestamp                               |
| `updatedAt`     | datetime                | yes      | Last modification timestamp                      |

##### Scenario: PO creation

- GIVEN an authenticated user scoped to a tenant
- WHEN the user creates a new purchase order with valid vendor, items, and currency
- THEN the system creates the PO in `DRAFT` status
- AND `receivedTotal` is initialized to `0.00`
- AND `poNumber` is auto-generated using the tenant's series configuration

##### Scenario: PO issuance

- GIVEN a PO in `DRAFT` status
- WHEN the user issues it
- THEN the status transitions to `ISSUED`
- AND the PO becomes immutable (no further edits to items, amounts, or vendor)

##### Scenario: Bill matching — partial receipt

- GIVEN a PO in `ISSUED` status with `totalAmount = 1000.00`
- WHEN a bill is associated with this PO and the bill total is `600.00`
- THEN the PO's `receivedTotal` becomes `600.00`
- AND the PO status transitions to `PARTIALLY_RECEIVED`

##### Scenario: Bill matching — full receipt

- GIVEN a PO in `PARTIALLY_RECEIVED` status with `totalAmount = 1000.00` and `receivedTotal = 600.00`
- WHEN an additional bill of `400.00` is matched
- THEN `receivedTotal` becomes `1000.00`
- AND the PO status transitions to `FULLY_RECEIVED`

##### Scenario: PO closure

- GIVEN a PO in `FULLY_RECEIVED` or `ISSUED` status
- WHEN the user closes it with a reason
- THEN the status transitions to `CLOSED`
- AND no further bills can be matched

##### Scenario: Bill matching exceeds PO total

- GIVEN a PO with `totalAmount = 1000.00` and `receivedTotal = 800.00`
- WHEN a user attempts to match a bill of `300.00`
- THEN the system MUST reject with code `PO_EXCEEDS_TOTAL`
- AND the PO status and `receivedTotal` remain unchanged

##### Scenario: Bill matching on non-issued PO

- GIVEN a PO in `DRAFT` or `CLOSED` status
- WHEN a user attempts to match a bill against it
- THEN the system MUST reject with code `PO_NOT_ISSUABLE`

---

#### Requirement: Purchase Order API Contracts

| Method  | Path                                  | Purpose                 |
| ------- | ------------------------------------- | ----------------------- |
| `POST`  | `/api/purchase-orders`                | Create PO               |
| `GET`   | `/api/purchase-orders`                | List POs (with filters) |
| `GET`   | `/api/purchase-orders/:id`            | Get PO by ID            |
| `PATCH` | `/api/purchase-orders/:id/status`     | Transition PO status    |
| `POST`  | `/api/purchase-orders/:id/match-bill` | Match a bill to this PO |

##### Scenario: Create purchase order

- GIVEN `POST /api/purchase-orders` with valid body
- WHEN the PO is created
- THEN the response status is 201 and returns the PO with `status: "DRAFT"`

##### Scenario: Match bill to purchase order

- GIVEN `POST /api/purchase-orders/:id/match-bill` with `{ billId }` body
- WHEN the bill exists, belongs to the same tenant, and the match does not exceed the PO total
- THEN the system links the bill to the PO
- AND recalculates `receivedTotal`
- AND returns updated PO

##### Scenario: Tenant isolation on PO operations

- GIVEN a PO belonging to `companyId: "cmp_A"`
- WHEN a user scoped to `companyId: "cmp_B"` attempts any operation on it
- THEN the system MUST reject with status 403 and code `TENANT_SCOPE_VIOLATION`

---

#### Requirement: Spend Tracking

The system MUST expose spend tracking aggregated by vendor and purchase order, enabling comparison of committed vs. received spend.

##### Scenario: Spend by vendor query

- GIVEN multiple POs for a vendor, some fully received and some partially received
- WHEN the user queries spend by vendor
- THEN the response MUST contain `{ committed, received, remaining }` amounts per vendor
- AND each amount MUST be in the vendor's primary currency with exchange-rate context

##### Scenario: Spend by PO detail

- GIVEN a PO with matched bills
- WHEN the user queries the PO detail
- THEN the response MUST include `matchedBills: [{ billId, billNumber, amount, matchedAt }]`
- AND `receivedTotal` MUST equal the sum of matched bill amounts

---

### Phase 4 — AP Aging & Payment Scheduling (CAP-AP-08, CAP-AP-11)

#### Requirement: Real-Time AP Aging

The system MUST replace hardcoded `MOCK_AGING_DATA` with a backend aggregation endpoint that computes real-time AP aging buckets per vendor aggregated from actual bill data.

##### Scenario: Aging query — happy path

- GIVEN bills in various states (current, 1-30 days overdue, 31-60 days overdue, 61+ days overdue)
- WHEN the user queries `GET /api/bills/aging?companyId=<id>`
- THEN the response MUST contain a vendor-grouped breakdown with:
  - `vendorId`, `vendorName`
  - `total` (sum of all outstanding balances)
  - `current` (balance for bills not yet due)
  - `d1_30` (1-30 days past due)
  - `d31_60` (31-60 days past due)
  - `d61_plus` (61+ days past due)
  - `status` (`ok`, `warning`, or `critical` based on configurable thresholds)
- AND each bucket amount MUST be the sum of `balanceDue` for bills in that bucket

##### Scenario: Aging KPIs

- GIVEN the aging query result
- THEN the response MUST include summary KPIs:
  - `totalOutstanding` — sum of all unpaid bill balances
  - `currentTotal` — sum of not-yet-due balances
  - `overdueTotal` — sum of past-due balances
  - `avgDaysToPay` — average days between issue and payment for paid bills

##### Scenario: Aging with no bills

- GIVEN a tenant with no unpaid bills
- WHEN the aging endpoint is queried
- THEN the response MUST return empty vendor breakdown with zero-value KPIs
- AND the response MUST NOT error

##### Scenario: Tenant isolation on aging

- GIVEN `GET /api/bills/aging?companyId=cmp_A`
- WHEN bills exist for both `cmp_A` and `cmp_B`
- THEN only `cmp_A` bills contribute to the aging data

##### Scenario: Aging filter by date range

- GIVEN `GET /api/bills/aging?companyId=<id>&asOf=2026-07-31`
- WHEN the aging is computed
- THEN aging buckets are calculated relative to the `asOf` date, not `now()`

---

#### Requirement: Payment Calendar

The system MUST provide an internal payment calendar that lists unpaid bills by due date with projected cash flow impact, without generating bank payment files.

##### Scenario: Payment calendar query

- GIVEN unpaid bills with varying due dates
- WHEN `GET /api/bills/payment-calendar?companyId=<id>[&from][&to]` is queried
- THEN the response MUST contain bills grouped by due date week
- AND each week group MUST include `{ weekStart, totalDue, billCount, bills: [...] }`
- AND bills within the group MUST be sorted by priority (overdue first, then by due date)

##### Scenario: Payment calendar cash flow projection

- GIVEN the payment calendar for the next 30 days
- THEN the response MUST include a `projectedCashOutflow` array with daily aggregates
- AND each day entry MUST contain `{ date, totalDue, billCount }`

##### Scenario: Payment calendar empty range

- GIVEN a date range with no due bills
- WHEN the calendar is queried
- THEN the response MUST return empty week groups with zero totals
- AND MUST NOT error

---

#### Requirement: Batch Payment Runs

The system MUST support batch payment runs that apply payments to multiple bills in a single operation.

##### Scenario: Batch payment — happy path

- GIVEN multiple unpaid bills for the same vendor
- WHEN `POST /api/bills/batch-pay` is called with `{ payments: [{ billId, amount, currency }] }`
- THEN the system applies each payment atomically (all succeed or all roll back)
- AND returns `{ processed, failed, results: [{ billId, newStatus, newBalance }] }`

##### Scenario: Batch payment — partial failure

- GIVEN a batch with 3 bills where 1 exceeds its balance
- WHEN the batch is submitted
- THEN the entire batch MUST roll back
- AND the response MUST indicate the failing bill with code `PAYMENT_EXCEEDS_BALANCE`

##### Scenario: Batch payment — cross-tenant rejection

- GIVEN a batch where one bill belongs to a different tenant
- WHEN the batch is submitted
- THEN the system MUST reject the entire batch with code `TENANT_SCOPE_VIOLATION`

---

#### Requirement: Detraction Integration on AP (CAP-AP-11)

The system MUST calculate SUNAT detraction (SPOT) obligations at bill registration time and link them to the AP bill flow, reusing existing SPOT rate tables.

##### Scenario: Detraction calculated at bill registration

- GIVEN a bill with items subject to detraction (operation type triggers SPOT obligation)
- WHEN the bill is created and the operation type matches a configured SPOT rate
- THEN the system calculates the detraction amount: `totalAmount × spotRate%`
- AND stores the detraction obligation linked to the bill
- AND the bill detail response includes `detraction: { rate, amount, spotCode }`

##### Scenario: Detraction on non-SPOT operation

- GIVEN a bill with an operation type not subject to detraction
- WHEN the bill is created
- THEN no detraction obligation is created
- AND the bill detail response shows `detraction: null`

##### Scenario: Detraction timing — at registration, not payment

- GIVEN a bill created with a detraction obligation of `100.00`
- WHEN a payment is applied against the bill
- THEN the detraction amount MUST NOT be recalculated
- AND the detraction obligation remains at `100.00` as calculated at registration time

##### Scenario: Spot rate table lookup

- GIVEN a bill with operation type `"CONSTRUCCION"`
- WHEN the bill is created
- THEN the system MUST look up the SPOT rate from the configured `spot_rates` table
- AND use the rate effective on the bill's `issueDate`

---

#### Requirement: AP Aging & Payment API Contracts

| Method | Path                          | Purpose                                    |
| ------ | ----------------------------- | ------------------------------------------ |
| `GET`  | `/api/bills/aging`            | Real-time AP aging with vendor breakdown   |
| `GET`  | `/api/bills/payment-calendar` | Payment calendar with cash flow projection |
| `POST` | `/api/bills/batch-pay`        | Batch payment run                          |

##### Scenario: Aging endpoint — query params

`GET /api/bills/aging` accepts:

- `companyId` (required): tenant scope
- `asOf` (optional, ISO date): aging cutoff date; defaults to `now()`
- `vendorId` (optional): filter to a single vendor

##### Scenario: Payment calendar endpoint — query params

`GET /api/bills/payment-calendar` accepts:

- `companyId` (required): tenant scope
- `from` (optional, ISO date): start of range; defaults to `now()`
- `to` (optional, ISO date): end of range; defaults to `now() + 90 days`

##### Scenario: Batch payment endpoint — body

`POST /api/bills/batch-pay` accepts:

```json
{
  "companyId": "string (required)",
  "payments": [
    { "billId": "string", "amount": "string", "currency": "PEN|USD|EUR" }
  ]
}
```

---

## API Contract Summary

| Phase | Method   | Path                                  | Purpose                  |
| ----- | -------- | ------------------------------------- | ------------------------ |
| 1     | `POST`   | `/api/bills`                          | Create bill              |
| 1     | `GET`    | `/api/bills`                          | List bills               |
| 1     | `GET`    | `/api/bills/:id`                      | Get bill                 |
| 1     | `PATCH`  | `/api/bills/:id/status`               | Update bill status       |
| 1     | `DELETE` | `/api/bills/:id`                      | Delete DRAFT bill        |
| 1     | `POST`   | `/api/bills/:id/pay`                  | Apply payment to bill    |
| 1     | `POST`   | `/api/invoices`                       | Create invoice           |
| 1     | `GET`    | `/api/invoices`                       | List invoices            |
| 1     | `GET`    | `/api/invoices/:id`                   | Get invoice              |
| 1     | `PATCH`  | `/api/invoices/:id/status`            | Update invoice status    |
| 1     | `DELETE` | `/api/invoices/:id`                   | Delete DRAFT invoice     |
| 1     | `POST`   | `/api/vendors`                        | Create vendor            |
| 1     | `GET`    | `/api/vendors`                        | List vendors             |
| 1     | `GET`    | `/api/vendors/:id`                    | Get vendor               |
| 1     | `PATCH`  | `/api/vendors/:id`                    | Update vendor            |
| 1     | `DELETE` | `/api/vendors/:id`                    | Delete vendor            |
| 2     | `POST`   | `/api/bills/:id/submit`               | Submit bill for approval |
| 2     | `POST`   | `/api/bills/:id/approve`              | Approve pending bill     |
| 2     | `POST`   | `/api/bills/:id/reject`               | Reject pending bill      |
| 2     | `GET`    | `/api/bills/:id/approval`             | Get approval history     |
| 3     | `POST`   | `/api/purchase-orders`                | Create PO                |
| 3     | `GET`    | `/api/purchase-orders`                | List POs                 |
| 3     | `GET`    | `/api/purchase-orders/:id`            | Get PO                   |
| 3     | `PATCH`  | `/api/purchase-orders/:id/status`     | Transition PO status     |
| 3     | `POST`   | `/api/purchase-orders/:id/match-bill` | Match bill to PO         |
| 4     | `GET`    | `/api/bills/aging`                    | Real-time AP aging       |
| 4     | `GET`    | `/api/bills/payment-calendar`         | Payment calendar         |
| 4     | `POST`   | `/api/bills/batch-pay`                | Batch payment run        |

---

## Cross-Cutting Requirements

#### Requirement: Tenant Isolation (all phases)

Every endpoint and domain operation MUST enforce tenant isolation. A user scoped to `companyId: X` MUST NOT access, modify, or delete resources belonging to `companyId: Y`.

#### Requirement: Session Context Validation (all phases)

Every write operation (`sensitive-write` profile) MUST resolve session context via `resolveSessionContext` and validate that `body.actorId` (when provided) matches the resolved `legacyUserId`.

#### Requirement: Immutable Audit Trail (all phases)

Every status transition, approval action, payment, and PO lifecycle event MUST be recorded immutably with actor identity and timestamp. Audit trail entries MUST NOT be modifiable after creation.

#### Requirement: Fiscal Correctness (all phases)

All monetary calculations MUST use `Money` value objects from `@drenyra/domain`. IGV calculation MUST follow SUNAT rules (18% for `GRAVADO`, 0% otherwise). Property-based tests MUST verify fiscal invariants.

---

## Acceptance Criteria

### Phase 1 Acceptance

- [ ] Invoice lifecycle DRAFT → SENT → PAID/OVERDUE → CANCELLED is documented and covered by property-based tests
- [ ] Bill lifecycle DRAFT → SENT → PAID/OVERDUE → CANCELLED is documented and covered by property-based tests
- [ ] Tenant isolation is verified for all bill and invoice endpoints
- [ ] Credit/debit note linking and tax semantics are tested
- [ ] Vendor CRUD with RUC uniqueness per tenant is tested
- [ ] Existing test files pass without modification (no regression)
- [ ] Capability map is updated: CAP-AP-03, CAP-AP-04, CAP-AP-05, CAP-AP-07 from `🟡 partial` to `✅ applied`

### Phase 2 Acceptance

- [ ] `BillApproval` entity with PENDING_REVIEW → APPROVED / REJECTED lifecycle
- [ ] Approval API: submit, approve, reject endpoints with session context validation
- [ ] Configurable `approval_rules` with `auto_approve_threshold` per tenant
- [ ] Auto-approval for bills below threshold
- [ ] Immutable approval audit trail
- [ ] `hasPermission("approve:ap-bills")` guard on approve/reject endpoints
- [ ] Property-based tests for approval state machine

### Phase 3 Acceptance

- [ ] `PurchaseOrder` entity with DRAFT → ISSUED → PARTIALLY_RECEIVED → FULLY_RECEIVED → CLOSED lifecycle
- [ ] PO CRUD API with tenant isolation
- [ ] Bill-to-PO matching with `receivedTotal` tracking
- [ ] PO exceeds total guard
- [ ] Spend tracking by vendor with committed vs. received aggregation
- [ ] PO audit trail

### Phase 4 Acceptance

- [ ] `GET /api/bills/aging` returns real-time vendor-grouped aging buckets (no mocks)
- [ ] Aging KPIs: totalOutstanding, currentTotal, overdueTotal, avgDaysToPay
- [ ] `GET /api/bills/payment-calendar` with weekly grouping and cash flow projection
- [ ] `POST /api/bills/batch-pay` with atomic all-or-nothing semantics
- [ ] Detraction obligation calculated at bill registration using SPOT rate table
- [ ] Detraction timing verified: at registration, not at payment
- [ ] Web UI `BillsAgingTab` consumes backend endpoint instead of `MOCK_AGING_DATA`
- [ ] Payment calendar UI wired to backend
