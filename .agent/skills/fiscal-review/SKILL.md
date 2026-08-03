---
name: drenyra-fiscal-review
description: "Trigger: review, audit, fiscal, compliance, sunat, tax, code review. Guide AI agents performing fiscal-focused code review on Drenyra changes. This is Drenyra's `review-reliabilit..."
license: MIT
metadata:
  author: arkelythex
  version: "1.0"
---

# Fiscal Review Lens Skill

> **Trigger**: review, audit, fiscal, compliance, sunat, tax, code review
> **Scope**: `project`

## Purpose

Guide AI agents performing fiscal-focused code review on Drenyra changes. This is Drenyra's `review-reliability` lens specialized for fiscal correctness.

## Review Checklist

### Fiscal Correctness

- [ ] IGV calculations use the `Money` value object, not raw numbers
- [ ] Tax rates come from the domain registry, not hardcoded
- [ ] Detracción codes match current SPOT table
- [ ] Document series follow SUNAT authorization rules
- [ ] CDR hashes are stored with SUNAT response codes
- [ ] Decimal rounding uses banker's rounding (not truncation)

### Tenant Isolation

- [ ] Every query scopes by organizationId + companyId
- [ ] Every mutation validates RUC ownership
- [ ] Every API route checks session context for fiscal scope
- [ ] No hardcoded RUCs or company IDs in code

### Audit Trail

- [ ] Fiscal operations log: who, what, when, which RUC, which period
- [ ] Evidence artifacts include confidence scores
- [ ] Reversal paths are documented and testable
- [ ] AI-generated fiscal recommendations are logged before execution

### Error Handling

- [ ] SUNAT API timeouts have retry with backoff
- [ ] SIRE submission failures have clear error messages
- [ ] No silent catch blocks in fiscal code
- [ ] Validation errors expose which fiscal rule was violated

## Severity Levels

| Severity   | Meaning                            | Action                |
| ---------- | ---------------------------------- | --------------------- |
| BLOCKER    | Fiscal correctness violation       | Must fix before merge |
| CRITICAL   | Tenant isolation breach            | Must fix before merge |
| WARNING    | Missing audit detail or suboptimal | Should fix            |
| SUGGESTION | Style or pattern improvement       | Consider              |
