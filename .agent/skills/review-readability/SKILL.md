---
name: drenyra-review-readability
description: "Trigger: review-readability, readability-review, code-style, naming, structure, maintainability. Naming, structure, maintainability, and code style review lens. Run as advisory on every pre-commit and pre-pu..."
license: MIT
metadata:
  author: arkelythex
  version: "1.0"
---

# Review Lens: Readability

> **Trigger**: review-readability, readability-review, code-style, naming, structure, maintainability
> **Scope**: `project`

## Purpose

Naming, structure, maintainability, and code style review lens. Run as advisory on every pre-commit and pre-push. This is the cheapest lens and should run on every change.

## Review Checklist

### Naming

- [ ] Functions/methods are verbs (getName, calculateTotal)
- [ ] Classes/interfaces are nouns (Invoice, FiscalSDDPipeline)
- [ ] Booleans are predicates (isValid, hasAccess, canProcess)
- [ ] No single-letter variables except loop indices
- [ ] Fiscal domain terms use correct Spanish/Tax nomenclature (ruc, igv, detraccion, sunat)

### Structure

- [ ] Functions do one thing (single responsibility)
- [ ] No deep nesting (>3 levels)
- [ ] Early returns preferred over if-else chains
- [ ] Switch statements handle all cases (exhaustive)
- [ ] No commented-out code
- [ ] No dead code (unused variables, functions, imports)

### Comments & Docs

- [ ] Public API functions have JSDoc/TSDoc
- [ ] Complex fiscal logic has inline explanation
- [ ] TODO comments have an associated issue number
- [ ] No stale comments (comment says one thing, code does another)
- [ ] No obvious comments (`// increment i`)

### Conventions

- [ ] Follows project TypeScript conventions (strict mode, no `any`)
- [ ] Imports are organized (external → internal, no barrel cycles)
- [ ] Constants use UPPER_SNAKE_CASE
- [ ] File names match the primary export
- [ ] No production console.log or debug statements

### Testing Readability

- [ ] Test names describe behavior (should reject when RUC is missing)
- [ ] Tests use Arrange-Act-Assert pattern
- [ ] Test data uses meaningful values, not arbitrary numbers
- [ ] Test descriptions are consistent with domain language

## Ledger Format

```json
{
  "id": "READ-001",
  "location": "path/to/file.ts:42",
  "severity": "BLOCKER | CRITICAL | WARNING | SUGGESTION",
  "status": "open | fixed | verified | wont-fix",
  "evidence": "Why it matters",
  "fix": "How to fix it"
}
```
