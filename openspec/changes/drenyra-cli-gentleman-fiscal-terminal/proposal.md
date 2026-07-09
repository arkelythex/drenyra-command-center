# Drenyra CLI Gentleman Fiscal Terminal

**Date:** 2026-07-08
**Author:** el Gentleman
**Parent:** `drenyra-north-star-philosophy`
**Surface:** `apps/cli/`
**Related plans:** `drenyra-s5-go-cli-alignment`, `drenyra-p1-fiscal-terminal`
**Review budget:** 400 changed lines per PR

## Problem

Drenyra CLI already has a strong Go foundation: Cobra commands, Bubble Tea TUI, execution engine, fiscal context flags, workflow catalog, local memory, and agent routing. Existing plans cover Go/TS alignment and a fiscal terminal upgrade, but the CLI needs a clearer world-class philosophy.

The CLI should not be a thin wrapper around APIs. It should become the terminal-native fiscal operator for Drenyra: fast, safe, explainable, scriptable, and aligned with the web command center.

## Product inspiration

Drenyra CLI should learn from:

- Pi CLI: harness discipline, tools, subagents, memory-aware workflows, and review gates.
- OpenCode: terminal-native developer flow, fast iteration, and ergonomic command execution.
- Codex CLI: repo/task awareness, precise execution, and verification loops.
- Gentleman philosophy: SDD, explicit artifacts, review workload protection, teaching, and human control.

## Vision

```text
Drenyra CLI = Gentleman Fiscal Terminal

Fast shell commands + guided TUI + fiscal context + agentic execution gates
```

The CLI should make fiscal operations feel powerful without becoming dangerous. It should help operators close periods, inspect fiscal work, run workflows, and coordinate agents while preserving company/RUC/period scope and audit trails.

## Goals

1. Upgrade CLI product philosophy beyond a command collection.
2. Align P1 Fiscal Terminal and S5 Go CLI Pattern Alignment under one terminal north star.
3. Define safe agentic CLI execution rules.
4. Document CLI/web shared fiscal context semantics.
5. Prepare implementation slices that stay under 400 changed lines per PR.

## Non-goals

- No Go implementation in this planning change.
- No CLI command removal without migration plan.
- No unsupervised fiscal mutation.
- No dependency on a single AI provider or closed vendor behavior.

## Required CLI principles

### 1. Terminal-native first

Commands must work in scripts, CI, and headless execution before visual TUI polish.

### 2. TUI for cognition, not decoration

Bubble Tea screens should reduce cognitive load for multi-step workflows: status, evidence, approvals, and next action.

### 3. Fiscal context is mandatory

Commands that inspect or mutate fiscal data must carry explicit organization/company/RUC/period scope.

### 4. Agentic actions are gated

Agents can prepare, explain, compare, and recommend. Fiscal mutations require approval policy and audit output.

### 5. Local continuity matters

The CLI should preserve safe local context: recent runs, selected fiscal period, workflow history, and evidence references.

### 6. Web parity where it matters

The CLI and web do not need identical UI, but they must share semantics for evidence, approvals, fiscal work items, and audit trails.

## Candidate flagship CLI workflows

| Workflow                            | CLI value                                                    | Safety requirement                         |
| ----------------------------------- | ------------------------------------------------------------ | ------------------------------------------ |
| `drenyra doctor`                    | Validate local environment, config, memory, API reachability | No mutation                                |
| `drenyra work inspect`              | Inspect a fiscal case from terminal                          | Explicit scope headers                     |
| `drenyra workflow run close-period` | Guided monthly close                                         | Approval gates and evidence capture        |
| `drenyra exec --json`               | CI/scriptable fiscal operation                               | Structured output and deterministic errors |
| TUI fiscal terminal                 | Operator cockpit                                             | Visible context, agent pane, reversal path |

## Success metrics

- Operators can inspect and resume fiscal work without opening the web app.
- CLI output is scriptable and human-readable.
- Risky actions cannot execute without scope and approval.
- CLI docs explain when to use shell commands versus TUI.
- P1 and S5 implementation tasks can be reviewed in slices below 400 lines.

## Dependencies

- Parent north star plan.
- Existing `apps/cli/MAP.md` architecture.
- Existing P1 and S5 plans.
- Fiscal/security rules from `AGENTS.md`.
