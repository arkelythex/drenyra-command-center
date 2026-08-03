---
name: drenyra-review-risk
description: "Trigger: review-risk, risk-review, security-review, security audit, dependency review. Security, permissions, data exposure/loss, architecture, and dependency review lens for Drenyra code changes. ..."
license: MIT
metadata:
  author: arkelythex
  version: "1.0"
---

# Review Lens: Risk

> **Trigger**: review-risk, risk-review, security-review, security audit, dependency review
> **Scope**: `project`

## Purpose

Security, permissions, data exposure/loss, architecture, and dependency review lens for Drenyra code changes. Run before merging changes that touch auth, security, compliance, fiscal, or payment paths.

## Review Checklist

### Authentication & Authorization

- [ ] Session tokens validated on every protected route
- [ ] RUC-level access control on every fiscal operation
- [ ] Role-based permissions enforced at service boundary
- [ ] No bypass of organization/company scoping

### Data Protection

- [ ] No sensitive data in logs, URLs, or error messages
- [ ] API responses never leak internal IDs, secrets, or tokens
- [ ] Personal data has appropriate access controls
- [ ] Fiscal data protected per SUNAT regulations

### Secrets & Configuration

- [ ] No hardcoded secrets, API keys, or tokens
- [ ] Environment variables follow naming conventions
- [ ] Secrets are injected at runtime, not build time
- [ ] Production credentials never appear in tests

### Dependencies

- [ ] No new dependencies with known CVEs
- [ ] Dependency changes have documented rationale
- [ ] Peer dependency ranges are permissive enough

### Architecture

- [ ] No circular dependencies between packages
- [ ] Domain package stays framework-free
- [ ] Fiscal logic is deterministic and testable
- [ ] Tenant isolation is preserved

## Ledger Format

```json
{
  "id": "RISK-001",
  "location": "path/to/file.ts:42",
  "severity": "BLOCKER | CRITICAL | WARNING | SUGGESTION",
  "status": "open | fixed | verified | wont-fix",
  "evidence": "Why it matters",
  "fix": "How to fix it"
}
```
