---
name: drenyra-chained-pr
description: "Trigger: chained-pr, chained pr, stacked prs, split pr, large pr, oversized. Split oversized changes into chained PRs that protect review focus. Run when review workload forecast recommen..."
license: MIT
metadata:
  author: arkelythex
  version: "1.0"
---

# Chained PR Skill

> **Trigger**: chained-pr, chained pr, stacked prs, split pr, large pr, oversized
> **Scope**: `project`

## Purpose

Split oversized changes into chained PRs that protect review focus. Run when review workload forecast recommends chained PRs (exceeds 400 lines or touches critical subsystems).

## When to Chain

| Condition                           | Action                   |
| ----------------------------------- | ------------------------ |
| Change exceeds 400 lines            | Chain recommended        |
| Touches fiscal/sunat/compliance     | Chain or 4R review       |
| Touches auth/security               | Chain or 4R review       |
| Mixed concerns (refactor + feature) | Chain by concern         |
| Mechanical refactor ≤600 lines      | Exception OK (single PR) |

## Chain Strategies

### Stacked-to-Main

Each PR merges to main in order. Fast iteration, fix on the go.

```
PR #1: schema + migration → main
PR #2: API + tests → main
PR #3: frontend + docs → main
```

### Feature-Branch Chain

Target a tracker branch. Each child PR targets its immediate parent.

```
main ← tracker-branch ← PR #1 ← PR #2 ← PR #3
```

Only the tracker merges to main.

## Chain Convention

1. Each PR is independently reviewable
2. Each PR has passing tests
3. Each PR declares its dependency: "Depends on #N"
4. The PR body includes a delivery strategy section
5. The PR body includes review workload forecast

## PR Body Template

```markdown
## Summary

[What this PR does]

## Delivery Strategy

[ask-on-risk | auto-chain | single-pr | exception-ok]

## Review Workload

- Estimated lines: N
- Files changed: N
- Hot paths: [yes/no]
- Estimated review time: N min

## Review Path

Start with: [file or module to start with]

## Dependencies

- Depends on: #N (if chained)
- Blocks: #N (if chained)
```
