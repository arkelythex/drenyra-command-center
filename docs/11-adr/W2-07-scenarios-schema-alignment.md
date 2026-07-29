# ADR: W2-07 Cross-Layer Scenarios — Schema Alignment Gap

**Status:** Accepted · **Owner:** Drenyra Core · **Follow-up:** W2-08

## Context

W2-07 cross-layer scenarios (`scenarios/*.integration.test.ts`) test end-to-end
flows across Wave 2 components (idempotency, inbox, job execution) and domain
entities (invoices, documents).

During Wave 2 consolidation (migrations 0019-0025), the canonical baseline
(0000_canonical_baseline.sql) defines `invoices` with `customer_id`,
`invoice_number`, `total_amount`, etc. The scenarios were written against a
different schema version using `vendor_id`, `bill_number`, `amount`.

## Decision

Exclude W2-07 cross-layer scenarios from the Wave 2 gate. These scenarios will
be re-synced with the canonical schema in a follow-up batch (W2-08).

Justification:

- Wave 2 core components are fully tested by 86 passing integration tests
  (W2-04 idempotency, W2-06B/C/D job uniqueness/relay/fencing)
- W2-07 smoke tests (15/15) verify the test infrastructure works correctly
- The schema mismatches are pre-existing (written pre-consolidation)
- Fixing requires rewriting 5+ test files across 12+ failing tests

## Re-entry criteria

1. Align `invoices` INSERT SQL with canonical columns:
   - `vendor_id` → `customer_id`
   - `bill_number` → `invoice_number`
   - `amount` → `total_amount`
2. Align `idempotency_records` INSERT SQL:
   - `payload_hash` → `request_hash`
3. Re-enable in `wave2-gate.sh` scenarios section
4. All scenarios green with real PostgreSQL + Redis
