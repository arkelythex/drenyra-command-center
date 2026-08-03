---
name: drenyra-drenyra-testing
description: "Trigger: test, vitest, playwright, compliance-repro, sire-repro, testing. Drenyra testing conventions for vitest (unit/integration), playwright (E2E), and compliance verification."
license: MIT
metadata:
  author: arkelythex
  version: "1.0"
---

# Drenyra Testing Skill

> **Trigger**: test, vitest, playwright, compliance-repro, sire-repro, testing
> **Scope**: `project`

## Purpose

Drenyra testing conventions for vitest (unit/integration), playwright (E2E), and compliance verification.

## Test Conventions

### Vitest (Unit/Integration)

- Use `vitest run` for CI, `vitest` for watch mode
- Test files co-located in `__tests__/` per package
- Test names describe behavior: `should reject when RUC is missing`
- Use Arrange-Act-Assert pattern
- Mock external API calls (SUNAT, SIRE) at the boundary

### Playwright (E2E)

- Page Object pattern for reusable selectors
- Fiscal flows test with realistic test RUCs
- Never use production credentials

### Compliance Verification

```bash
bun run compliance:sire-gate    # Pre-merge compliance check
bun run compliance:sire-repro   # Reproduce SIRE-specific scenario
```

## Test Commands

```bash
# Single package
cd packages/<name> && npx vitest run

# All packages (from root)
bun run test

# Type checking
bun run typecheck

# Full CI suite
bun run test && bun run typecheck && bun run lint:all
```
