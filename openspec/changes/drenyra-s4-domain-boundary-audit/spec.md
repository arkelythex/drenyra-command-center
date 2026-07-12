# Specification — S4: Domain Package Boundary Audit

## Context Update (2026-07-11)

Six of nine suspect directories have already been removed:

- ai/ ✅ removed
- agents/ ✅ removed
- fiscal-agentic-ledger/ ✅ removed
- platform/ ✅ removed
- roi/ ✅ removed
- services/roi/ ✅ removed (only roi service remains)

## Remaining audit scope

### 1. packages/domain/src/fiscal-memory/ (6 files)

Verify contents are pure domain contracts (interfaces/types), not implementations.
If implementations exist, move to infrastructure.

### 2. packages/domain/src/fiscal-ontology/ (3 files)

Verify contents are pure fiscal ontology types (domain vocabulary).
These are likely valid domain contracts.

### 3. packages/domain/src/types/ (5 files)

Product-surface types migrated from packages/core.
Evaluate: are these domain types or application/shared types?

### 4. packages/domain/src/services/

Contains: igv-calculator, pcge-catalog, TaxCalculator, tax-regime, roi
Evaluate each: pure domain logic vs application service.

## Acceptance criteria

- All remaining directories classified as domain-pure or moved
- architecture:check-boundaries CI check added
- packages/domain/README.md documents boundaries
