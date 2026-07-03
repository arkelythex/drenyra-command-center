# Tasks: Fiscal Agent 24/7 — Autonomous Recurring Fiscal Worker

**Change**: fiscal-agent-247  
**Status**: tasks  
**Date**: 2026-07-03  

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 800–1,200 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 (core pipeline) → PR2 (API + scheduler) |

## Task List

### PR1: Core Pipeline (infrastructure + application)

| # | Task | Files | Dependencies |
|---|------|-------|-------------|
| 1.1 | Types + Step interface | `packages/application/src/use-cases/fiscal-agent/types.ts` | — |
| 1.2 | StepContext + StepResult | `packages/application/src/use-cases/fiscal-agent/context.ts` | 1.1 |
| 1.3 | Collector step | `packages/infrastructure/src/agents/fiscal-agent/collector.step.ts` | 1.2 |
| 1.4 | Categorizer step | `packages/infrastructure/src/agents/fiscal-agent/categorizer.step.ts` | 1.2 |
| 1.5 | Calculator step | `packages/infrastructure/src/agents/fiscal-agent/calculator.step.ts` | 1.2 |
| 1.6 | Reconciler step | `packages/infrastructure/src/agents/fiscal-agent/reconciler.step.ts` | 1.2 |
| 1.7 | Reporter step | `packages/infrastructure/src/agents/fiscal-agent/reporter.step.ts` | 1.2 |
| 1.8 | Learner step | `packages/infrastructure/src/agents/fiscal-agent/learner.step.ts` | 1.2 |
| 1.9 | Barrel + exports | `packages/infrastructure/src/agents/fiscal-agent/index.ts` | 1.3–1.8 |
| 1.10 | FiscalNightlyRunUseCase | `packages/application/src/use-cases/fiscal-agent/fiscal-nightly-run.use-case.ts` | 1.3–1.9 |
| 1.11 | Queue (BullMQ) | `packages/infrastructure/src/queues/fiscal-agent.queue.ts` | 1.10 |
| 1.12 | CorrectionUseCase | `packages/application/src/use-cases/fiscal-agent/correction.use-case.ts` | 1.8 |

### PR2: API + Scheduler

| # | Task | Files | Dependencies |
|---|------|-------|-------------|
| 2.1 | Report routes | `apps/api/src/features/fiscal-agent/routes/report.route.ts` | 1.10 |
| 2.2 | Correction route | `apps/api/src/features/fiscal-agent/routes/correction.route.ts` | 1.12 |
| 2.3 | Route index | `apps/api/src/features/fiscal-agent/routes/index.ts` | 2.1, 2.2 |
| 2.4 | Scheduler | `apps/api/src/features/fiscal-agent/scheduler.ts` | 1.11 |
| 2.5 | Barrel exports | application + infrastructure + api | 2.3, 2.4 |
| 2.6 | Tests | Per step + integration | 1.3–1.12 |

## Acceptance Checklist

- [ ] Worker runs nightly via BullMQ repeatable job
- [ ] All 5 steps execute in sequence
- [ ] Exceptions appear in review queue
- [ ] User corrections persist and affect future runs
- [ ] FAL audit trail for every step
- [ ] Manual trigger via API
- [ ] All tests pass
