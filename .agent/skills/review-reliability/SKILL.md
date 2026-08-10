---
name: drenyra-review-reliability
description: "Trigger: review-reliability, reliability-review, behavior, tests, determinism, regression. Behavior, state, tests, determinism, and regression review lens. Run on any change that affects application be..."
license: MIT
metadata:
  author: arkelythex
  version: "1.0"
---

# Review Lens: Reliability

> **Trigger**: review-reliability, reliability-review, behavior, tests, determinism, regression
> **Scope**: `project`

## Purpose

Behavior, state, tests, determinism, and regression review lens. Run on any change that affects application behavior, adds tests, or refactors existing logic.

## Review Checklist

### Behavioral Correctness

- [ ] Logic handles edge cases (empty lists, null values, missing data)
- [ ] Fiscal calculations are deterministic (same input → same output)
- [ ] No floating-point operations on monetary values
- [ ] IGV/tax calculations tested at boundary values
- [ ] Date range queries handle timezone boundaries correctly

### Test Coverage

- [ ] New business logic has unit tests
- [ ] Edge cases are tested (not just happy path)
- [ ] Tests use realistic fiscal data (RUCs, periods, amounts)
- [ ] No flaky tests (no timeouts, no network in unit tests)
- [ ] Test cleanup restores state (no test pollution)
- [ ] Compliance tests run SIRE reprocessing verification (script aún no implementado)

### Determinism

- [ ] No reliance on implicit ordering (sets, object keys, undefined behavior)
- [ ] UUIDs/IDs are deterministic in tests (use seed or mock)
- [ ] Date/time operations use explicit timezone
- [ ] Random behavior is mocked or seeded in tests

### Regression Prevention

- [ ] No removal of existing parameter without deprecation path
- [ ] Public contract changes accompanied by migration guide
- [ ] Breaking changes have a major version bump or explicit marker
- [ ] Database schema changes have rollback migration

### Performance

- [ ] No N+1 queries in data access code
- [ ] Batch operations have pagination or chunking
- [ ] No synchronous heavy computation in request handlers
- [ ] Cache invalidation strategy documented for fiscal data

## Ledger Format

```json
{
  "id": "REL-001",
  "location": "path/to/file.ts:42",
  "severity": "BLOCKER | CRITICAL | WARNING | SUGGESTION",
  "status": "open | fixed | verified | wont-fix",
  "evidence": "Why it matters",
  "fix": "How to fix it"
}
```
