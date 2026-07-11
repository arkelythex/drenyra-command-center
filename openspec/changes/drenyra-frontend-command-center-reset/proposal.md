<!-- markdownlint-disable MD013 -->

# Drenyra Frontend Command Center Reset

**Date:** 2026-07-09  
**Author:** el Gentleman  
**Surface:** `apps/web/`, `packages/ui/`  
**Artifact store:** OpenSpec  
**Execution mode:** auto with gates  
**Delivery preference:** single PR default, hard review budget 600 changed lines per PR  
**Parent philosophy:** `drenyra-web-agentic-accounting-philosophy`

## Executive summary

Replace the legacy SaaS/ERP-style frontend direction with an agentic-first **Accounting Command Center** for Peruvian/LATAM accounting operations.

This is not a cosmetic redesign. The reset must remove duplicate/low-value legacy surfaces, collapse route sprawl into accounting outcomes, and rebuild the primary experience around supervised missions, evidence, fiscal risk, approval, and reversibility.

## Problem

The current web app has strong agentic foundations, but it also carries legacy SaaS shape:

- many route-level modules that behave like disconnected ERP pages;
- multiple AI/chat/command-center concepts that can fragment the product model;
- dashboard-first information architecture instead of work/inbox-first operations;
- demo/mock/data-rich surfaces mixed with production-facing accounting workflows;
- shared UI patterns that still expose older React/Tailwind conventions in places;
- high risk of visual polish hiding fiscal scope, evidence, SUNAT/UBL/SIRE constraints, approval state, or reversal path.

Evidence from the current repo map and CodeGraph:

- `apps/web` has 47 route files and ~40 feature modules.
- The app already declares the target model as left navigation + central fiscal workspace + right evidence/approval inspector in `apps/web/MAP.md`.
- Existing foundations include `apps/web/src/components/agentic-shell/AgenticLayout/*`, `apps/web/src/components/agentic/*`, `apps/web/src/features/artifacts/*`, `apps/web/src/features/cierre-mensual/*`, `apps/web/src/features/reconciliations/*`, `apps/web/src/features/approval-hub/*`, and `apps/web/src/features/inbox/*`.
- Legacy/transition candidates include generic dashboard-first routes, broad module routes, neural/chat/demo surfaces, duplicate command-center/cognitive-hub concepts, mock/demo banking data, and traditional `MainLayout` navigation.

## Product direction

Drenyra Web must become:

> The accounting command center where Drenyra prepares, validates, explains, and documents; the accountant decides.

The mental model maps Codex-style agentic development to accounting operations:

| Codex model   | Drenyra model                                         |
| ------------- | ----------------------------------------------------- |
| Repositories  | Companies / clients / RUC scopes                      |
| Issues        | Accounting tasks / pending obligations                |
| Pull requests | Proposed accounting changes                           |
| Tests         | Fiscal validations and controls                       |
| CI/CD         | Monthly close, SUNAT/SIRE readiness, declarations     |
| Code diff     | Accounting diff / document diff / reconciliation diff |
| Worktrees     | Parallel agent missions by company and period         |
| Skills        | Accounting, fiscal, and client-specific rules         |
| Code review   | Accountant review and approval                        |
| Merge         | Approval, posting, export, or archival with evidence  |

## Goals

1. Define a reset plan that makes the web app an Accounting Command Center, not a dashboard with AI decoration.
2. Retire or quarantine frontend legacy routes, duplicated modules, mock/demo-only UI, and unused visual experiments.
3. Establish a new information architecture: Accounting Inbox, Mission Workspace, Evidence Inspector, Agent Timeline, Client 360, and Fiscal Risk Layer.
4. Preserve fiscal correctness, tenant/company/RUC scoping, audit trails, approval gates, and reversible workflows.
5. Standardize frontend architecture on React 19, TypeScript strictness, Tailwind 4 token discipline, TanStack Router/Query, Zustand/XState only where justified, and package boundary hygiene.
6. Produce reviewable migration slices with explicit acceptance criteria and verification commands.

## Non-goals

- No backend fiscal behavior changes in this reset plan.
- No SUNAT submission automation without a separate compliance SDD.
- No unsupervised mutation of invoices, journals, taxes, SIRE, payments, or period close.
- No broad rewrite that removes existing working flows before replacement acceptance is proven.
- No generic chatbot-first UI.
- No visual clone of Codex or Digits; only the mental model and quality bar transfer.

## Proposed SDD suite

This umbrella change coordinates several implementation changes. Each child change should remain independently reviewable.

| Child | Name                                                    | Purpose                                                                                                             | Primary paths                                                                                                                          |
| ----- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| FE0   | Frontend Inventory and Retirement Map                   | Classify keep/replace/quarantine/delete across routes, features, components, stores, mocks, and tests.              | `apps/web/src/routes`, `apps/web/src/features`, `apps/web/src/components`, `packages/ui/src`                                           |
| FE1   | Command Center Shell Reset                              | Promote agentic three-panel shell as the default app layout and demote legacy module navigation.                    | `apps/web/src/routes/__root.tsx`, `apps/web/src/components/agentic-shell`, `apps/web/src/components/layout`                            |
| FE2   | Accounting Inbox Home                                   | Replace dashboard-first home with an inbox of blockers, due dates, agent suggestions, active missions, and risk.    | `apps/web/src/routes/index.tsx`, `apps/web/src/routes/dashboard.tsx`, `apps/web/src/features/inbox`, `apps/web/src/features/dashboard` |
| FE3   | Mission Workspace and Agent Timeline                    | Model accounting work as missions with transparent progress, evidence, confidence, approval, and blocked states.    | `apps/web/src/features/cierre-mensual`, `apps/web/src/components/agentic`, `apps/web/src/features/artifacts`                           |
| FE4   | Evidence Inspector and Fiscal Risk Layer                | Make every recommendation explainable through source documents, validations, diff, policy gates, and reversal path. | `apps/web/src/features/artifacts`, `apps/web/src/components/layout/FiscalInspector.tsx`, `apps/web/src/components/agentic-shell`       |
| FE5   | Client 360 and Accounting Skills                        | Consolidate company/client context, RUC, period, rules, skills, and client-specific accounting policies.            | `apps/web/src/routes/firm`, `apps/web/src/features/firm`, `apps/web/src/features/settings`, future `skills` feature                    |
| FE6   | Performance, Accessibility, and Design System Hardening | Remove legacy UI debt and enforce React 19, Tailwind 4, accessibility, test, and bundle budgets.                    | `apps/web/src/lib/design-tokens`, `apps/web/src/components/ui`, `packages/ui/src`, `vite.config.ts`                                    |

## Success metrics

- A user can identify the next safest accounting action in under 60 seconds.
- Every high-risk recommendation shows company, RUC, fiscal period, evidence, confidence explanation, approval state, and reversal path.
- Legacy routes are either removed, hidden behind command/search compatibility, or replaced by mission-based workflows.
- No new fiscal mutation can execute without explicit human approval and audit metadata.
- Review slices stay below the selected 600-line budget or document an explicit exception.
- `apps/web` passes typecheck, lint, tests, build, bundle check, and class name guard for touched areas.

## Dependencies

- Existing plans: `drenyra-web-agentic-accounting-philosophy`, `drenyra-agentic-shell`, `drenyra-thread-system`, `drenyra-accounting-diff`, `drenyra-evidence-vault-2`, `drenyra-am1-eliminate-duplicates`, `drenyra-am4-sidebar-reduction`, `drenyra-c1-css-modernization`, `drenyra-p2-performance`, `drenyra-p2b-perf-extended`, `drenyra-l1-legacy-cleanup`.
- Product guardrails: `docs/products/drenyra-product-philosophy.md`, `apps/web/MAP.md`, root `AGENTS.md`.
- Tooling guardrails: Bun, Vite, TanStack Router, TanStack Query, React 19 Compiler, Tailwind 4, Vitest, ESLint, bundle/classname checks.
