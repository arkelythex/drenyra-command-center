# Drenyra Orchestrator Skill

> **Trigger**: orchestrator, delegation, work-routing, review-lens, harness, drenyra-harness
> **Scope**: `project`

## Purpose

Guide AI agents working with the Drenyra orchestrator — the delegation router, skills resolver, memory contract, review lenses, and work routing ladder.

## Core Concepts

### Work Routing Ladder

| Route               | When                                 | Example                           |
| ------------------- | ------------------------------------ | --------------------------------- |
| `inline-direct`     | Small, mechanical, known context     | Typo fix, 1-file edit             |
| `simple-delegation` | Needs exploration or multi-file work | 4+ file read, 2+ file write       |
| `sdd`               | Large, ambiguous, architectural      | New feature, cross-cutting change |

### Delegation Triggers

| Rule             | Threshold                     | Action               |
| ---------------- | ----------------------------- | -------------------- |
| 4-file-rule      | 4+ files to understand        | Delegate scout       |
| multi-file-write | 2+ files to write             | Delegate worker      |
| pr-rule          | Git commit/push/PR            | Fresh review lens    |
| incident-rule    | Tooling/worktree incident     | Fresh audit          |
| long-session     | 20+ calls, 5+ reads, 2+ edits | Pause and delegate   |
| fresh-review     | Review/audit task             | Fresh-context review |

### Review Lens Selection

| Context                         | Lenses                          |
| ------------------------------- | ------------------------------- |
| Pre-commit                      | `review-readability` (advisory) |
| Pre-push                        | `review-readability` (advisory) |
| Pre-PR (hot path or >400 lines) | Full 4R (blocking)              |
| Pre-PR (small change)           | `review-readability`            |
| Post-SDD design/apply           | `judgment-day`                  |

### Memory Contract

| Role         | Read                                | Write                       |
| ------------ | ----------------------------------- | --------------------------- |
| Orchestrator | Searches Engram, passes context     | —                           |
| Subagent     | Reads orchestrator-provided context | Saves discoveries to Engram |

### Skills Resolution

The orchestrator reads `.atl/skill-registry.md`, matches task context against triggers, and passes `SKILL.md` paths to subagents.

## Usage Patterns

```typescript
import { determineRoute } from '@drenyra/orchestrator'

const route = determineRoute({
  filesToUnderstand: 4,
  filesToWrite: 2,
  isGitWorkflowEvent: false,
  // ...
})
// → { route: 'simple-delegation', recommendedSubagent: 'worker' }
```
