---
name: drenyra-work-unit-commits
description: "Trigger: commit, work-unit, commit-splitting, reviewable, conventional-commit. Plan commits as reviewable work units that isolate meaningful changes, keep tests passing, and respect fiscal ..."
license: MIT
metadata:
  author: arkelythex
  version: "1.0"
---

# Work-Unit Commits Skill

> **Trigger**: commit, work-unit, commit-splitting, reviewable, conventional-commit
> **Scope**: `project`

## Purpose

Plan commits as reviewable work units that isolate meaningful changes, keep tests passing, and respect fiscal safety.

## Rules

### 1. One Logical Change Per Commit

Each commit represents one atomic, reviewable change:

```
✅ Good: "feat(api): add IGV calculation endpoint"
✅ Good: "fix(fiscal): correct detraccion rate for service code 023"
✅ Good: "test(compliance): add SIRE repro test for period 2026-07"
❌ Bad: "fix stuff" (vague, multiple concerns)
❌ Bad: "wip" (incomplete, untestable)
```

### 2. Keep Tests Passing

Every commit must leave the tree in a working state:

- `bun run typecheck && bun run test` should pass
- If breaking changes are staged, include migration + test in the same commit

### 3. Isolate Fiscal Changes

Fiscal/SUNAT/Compliance changes get their own commit with evidence:

```
feat(compliance): add SIRE gate for periodic reports
- Validate RUC scope before SIRE submission
- Log CDR hash and SUNAT response code
- Add integration test for submission flow
```

### 4. Conventional Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types: feat, fix, refactor, test, docs, chore, perf, security
Scopes: fiscal, sunat, compliance, api, web, cli, domain, pipeline

### 5. Commit Body

- Explain WHY (not what — the diff shows what)
- Mention fiscal/safety implications
- Reference issue/PR number when applicable
