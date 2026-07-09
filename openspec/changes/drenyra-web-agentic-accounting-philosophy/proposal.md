# Drenyra Web Agentic Accounting Philosophy

**Date:** 2026-07-08
**Author:** el Gentleman
**Parent:** `drenyra-north-star-philosophy`
**Surface:** `apps/web/`
**Review budget:** 400 changed lines per PR

## Problem

The web app already has a broad accounting surface, command-center concepts, agentic UI pieces, and many fiscal modules. The risk is fragmentation: many screens can exist without a coherent product philosophy that makes Drenyra feel like the best accounting operating system in the world.

The target is not another dashboard. The target is an agentic fiscal command center where accounting work becomes easier to understand, faster to execute, and safer to audit.

## Product inspiration

Drenyra Web should learn from:

- Codex-style task focus: the system understands the active work and keeps context visible.
- Cursor 3.0-style contextual collaboration: edit, explain, review, and execute from one focused workspace.
- Digits AI accounting-style clarity: modern financial insights, automation, and visual confidence.
- Global accounting leaders: trust, reconciliation, period close, reporting, controls, and auditability.
- Gentleman philosophy: reduce cognitive load, teach the user, require explicit evidence, and keep work reviewable.

## Proposed web experience model

```text
Drenyra Web = Agentic Fiscal Command Center

Left: navigation by outcome and command
Center: fiscal workspace / accounting artifact / workflow
Right: evidence, agent reasoning, approvals, and next actions
```

The web app should make the user feel they are supervising a fiscal operations room, not clicking through disconnected ERP pages.

## Goals

1. Define the web app product philosophy as a formal SDD plan.
2. Establish UX principles for accounting workflows, agents, evidence, and approvals.
3. Align existing frontend plans with the north star.
4. Identify flagship workflows that demonstrate best-in-class agentic accounting.

## Non-goals

- No React implementation in this planning change.
- No new route or component creation yet.
- No replacement of existing frontend plans without review.
- No fiscal computation changes.

## Required web principles

### 1. Outcome-first navigation

Navigation should prioritize business outcomes: close period, reconcile bank, resolve tax risk, review invoices, prepare SIRE, prove compliance.

### 2. Evidence beside every action

Agent recommendations, diffs, reconciliations, and approvals must show their source evidence near the decision point.

### 3. Progressive disclosure for complexity

The first screen should answer "what needs attention?" Details expand only when needed: source rows, fiscal rule, audit trail, reversal impact.

### 4. Agent is an operator, not decoration

The agent should explain, compare, prepare, and execute allowed tasks with approval gates. It should not be a generic chat widget bolted onto accounting screens.

### 5. Review queue as a product surface

Risky accounting changes should naturally flow into review queues, accounting diffs, and approvals.

### 6. Fiscal confidence model

Each workflow should communicate confidence, completeness, blocked reasons, and unresolved risks.

## Candidate flagship workflows

| Workflow                 | Why it matters                         | Agentic differentiator                                  |
| ------------------------ | -------------------------------------- | ------------------------------------------------------- |
| Monthly close            | High business value and recurring pain | Guided close, discrepancy detection, evidence checklist |
| SIRE preparation         | Peru-specific fiscal correctness       | SUNAT-ready validation and explainable corrections      |
| Bank reconciliation      | Universal accounting pain              | Suggested matches with evidence and confidence          |
| Invoice lifecycle review | Daily operator flow                    | Accounting diff, risk flags, approval/reversal path     |

## Success metrics

- A new user understands what needs attention within 60 seconds.
- Every high-risk action has visible evidence and approval state.
- Agentic workflows reduce steps without hiding fiscal reasoning.
- Web documentation points to the same philosophy used by CLI and AGENTS guidance.

## Dependencies

- Parent north star plan.
- Existing frontend plans F1–F6, AM1–AM4, DS1–DS5.
- Existing fiscal/security rules from `AGENTS.md`.
