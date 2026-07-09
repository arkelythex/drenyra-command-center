# Drenyra North Star Philosophy

**Date:** 2026-07-08
**Author:** el Gentleman
**Change type:** Product and architecture direction
**Artifact store:** OpenSpec
**Execution mode:** automatic
**Review budget:** 400 changed lines per PR
**PR strategy:** auto-forecast

## Problem

Drenyra already has many implementation plans, but the product ambition is larger than isolated features: the web app should compete with the strongest AI-native accounting products, while the CLI should become a world-class fiscal terminal. Without a written north star, teams can build locally correct pieces that do not converge into one exceptional product.

## Vision

Drenyra is the national-grade fiscal intelligence platform for Peru: an agentic accounting operating system where every fiscal action is explainable, auditable, reversible, tenant-scoped, and assisted by agents under human control.

The platform should learn from:

- Codex-style focused execution and repository/context awareness.
- Cursor-style product speed, editability, and contextual workflows.
- Digits-style modern accounting clarity and automated insights.
- Global best-in-class accounting products for trust, reconciliation, reporting, and compliance.
- Pi/OpenCode/Codex CLI discipline for terminal workflows.
- Gentleman philosophy: SDD, review empathy, teaching, explicit artifacts, and controlled agentic execution.

This is inspiration, not cloning. Drenyra must convert those references into fiscal-safe principles and measurable acceptance criteria.

## Goals

1. Define a single product philosophy for Drenyra web, CLI, agents, and documentation.
2. Establish non-negotiable agentic accounting principles.
3. Make fiscal correctness, auditability, and human control product features, not backend details.
4. Align existing OpenSpec plans under a coherent north star.
5. Create child plans for web, CLI, and documentation alignment.

## Non-goals

- No UI redesign implementation in this change.
- No CLI code implementation in this change.
- No fiscal rule changes.
- No external product copying or trademark-dependent positioning.

## Proposed change set

This parent change coordinates three child plans:

| Child plan                                  | Purpose                                                                                | Estimated PRs | Estimated lines |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | ------------: | --------------: |
| `drenyra-web-agentic-accounting-philosophy` | Turn the web app into a best-in-class agentic accounting command center                |             3 |            ~900 |
| `drenyra-cli-gentleman-fiscal-terminal`     | Upgrade CLI philosophy beyond P1 into a Pi/OpenCode/Codex-grade fiscal terminal        |             3 |            ~800 |
| `drenyra-philosophy-docs-alignment`         | Update docs, maps, and AGENTS guidance so the philosophy becomes an operating contract |             2 |            ~350 |

## Product principles

### 1. Fiscal truth before agent speed

Agents may accelerate work, but cannot bypass SUNAT, UBL, SIRE, IGV, detracciones, retenciones, tenant scope, approval gates, or audit trails.

### 2. Explain every recommendation

Every agentic suggestion must expose source data, confidence, affected fiscal period, scope, and reversal path.

### 3. Human approval is a first-class workflow

High-risk accounting actions require explicit human approval, review queues, and evidence capture.

### 4. Accounting workflows should feel modern, not magical

The product should reduce cognitive load with progressive disclosure, command surfaces, reconciliation views, and guided next steps. It must avoid opaque "AI says so" interactions.

### 5. CLI and web are two surfaces of the same fiscal operating system

The web app is the visual command center. The CLI is the terminal-grade fiscal operator. Both share fiscal context, evidence, approvals, and auditability.

### 6. Gentleman discipline applies to product delivery

Every substantial change should go through SDD artifacts, small reviewable PRs, explicit verification, and documentation updates.

## Success metrics

- Every major product plan references the north star or its child philosophy plans.
- Web and CLI MAP files explain their intended experience model.
- New agentic workflows include source evidence, approval policy, and audit trail requirements.
- PRs over 400 changed lines are split or explicitly justified.
- Product docs make it clear what Drenyra will not automate without human control.

## Risks

- The philosophy may become aspirational prose if not connected to acceptance criteria.
- Existing plans may duplicate or conflict with the new child plans.
- Teams may over-index on AI surface polish while under-investing in fiscal correctness.

## Dependencies

- Existing OpenSpec master index.
- Existing `AGENTS.md`, `CODEX-MAP.md`, `apps/web/MAP.md`, and `apps/cli/MAP.md`.
- Existing fiscal/security non-negotiables.
