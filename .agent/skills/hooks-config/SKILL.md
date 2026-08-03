---
name: drenyra-hooks-config
description: "Trigger: hooks, pre-commit, pre-push, pre-pr, git-hooks, commit-hooks. Configure and understand Drenyra's pre-commit/pre-push/pre-PR hook gates. These hooks ensure review quality be..."
license: MIT
metadata:
  author: arkelythex
  version: "1.0"
---

# Hooks Configuration Skill

> **Trigger**: hooks, pre-commit, pre-push, pre-pr, git-hooks, commit-hooks
> **Scope**: `project`

## Purpose

Configure and understand Drenyra's pre-commit/pre-push/pre-PR hook gates. These hooks ensure review quality before code enters the main branch.

## Hook Behaviors

| Event                 | Lens                                                 | Blocking       |
| --------------------- | ---------------------------------------------------- | -------------- |
| Pre-commit            | review-readability                                   | No (advisory)  |
| Pre-push              | review-readability                                   | No (advisory)  |
| Pre-PR (hot path)     | Full 4R (risk, resilience, readability, reliability) | Yes (blocking) |
| Pre-PR (>400 lines)   | Full 4R                                              | Yes (blocking) |
| Pre-PR (small)        | review-readability                                   | No (advisory)  |
| Post-SDD design/apply | judgment-day                                         | Yes (blocking) |

## Hot Paths (block pre-PR)

Changes matching these paths trigger blocking 4R review:

- `**/auth/**` — Authentication and authorization
- `**/security/**` — Security boundaries
- `**/fiscal/**` — Fiscal logic (SUNAT, SIRE, IGV)
- `**/sunat/**` — SUNAT integration
- `**/payments/**` — Payment processing
- `**/compliance/**` — Compliance pipeline

## Config Location

The orchestrator config lives in:

- `openspec/config.yaml` (project-wide)
- `.agent/settings.json` (agent-specific overrides)
- `packages/drenyra-orchestrator/src/config.ts` (defaults)

## What Happens When Blocked

If pre-PR blocks (hot path or >400 lines):

1. The orchestrator selects the Full 4R lens set
2. Fresh-context review agents run on the diff
3. Findings are persisted to `openspec/changes/{change}/review-ledger.md`
4. Only BLOCKER/CRITICAL findings must be fixed before retry
5. After fixes, a scoped re-review validates the fix-touched lines
6. If clean, the PR gate passes

Note: pre-commit and pre-push are advisory only. They never block.
