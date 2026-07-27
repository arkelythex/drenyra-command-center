# SDD Tasks: Observability & Operations — Production Reliability

**Change:** drenyara-observability-ops
**Created:** 2026-07-26
**Status:** Tasks
**Predecessors:** spec.md, design.md

---

## Review Workload Forecast

| Field                   | Value                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------- |
| Estimated changed lines | ~4,550 (92–140 files across 11 PRs)                                                   |
| 400-line budget risk    | High                                                                                  |
| Chained PRs recommended | Yes                                                                                   |
| Suggested split         | PR1.1 → PR1.2 → PR1.3 → PR1.4 → PR2.1 → PR2.2 → PR2.3 → PR2.4 → PR3.1 → PR3.2 → PR3.3 |
| Delivery strategy       | ask-on-risk                                                                           |
| Chain strategy          | pending                                                                               |

```text
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High
```

---

## Phase 1 — Ops Foundation (PRs 1.1–1.4)

### PR 1.1: OpenTelemetry SDK + Elysia Tracing Middleware

**Goal:** `@drenyra/ops` package scaffold, OTel SDK (provider, exporter, sampler), Elysia tracing middleware, and `/health/doctor` reports OTEL status. No business spans yet.

**Dependencies:** None (builds on CAP-FOUND-07 OTEL readiness env vars).

---

#### Task 1.1.1 — Scaffold @drenyra/ops package

- [ ] Create `packages/ops/package.json` with `@drenyra/ops` name, dependencies (`@opentelemetry/api`, `@opentelemetry/sdk-trace-base`, `@opentelemetry/exporter-trace-otlp-http`, `@opentelemetry/core`), and vitest devDependency.
- [ ] Create `packages/ops/tsconfig.json` extending the monorepo base config.
- [ ] Create `packages/ops/src/index.ts` exporting public surface (`tracingMiddleware`, `createTracerProvider`, `startBusinessSpan`, `getActiveTraceId`).
- [ ] Register `@drenyra/ops` in root `package.json` workspaces if not auto-detected, and add a `build` script entry in `packages/ops/package.json`.
- **Files:** `packages/ops/package.json`, `packages/ops/tsconfig.json`, `packages/ops/src/index.ts`
- **Estimated lines:** ~60
- **Acceptance:** `bun run build` in `packages/ops/` compiles without errors. `@drenyra/ops` importable from other workspace packages.

<!-- sdd-owner: implementation -->

#### Task 1.1.2 — Write RED: TracerProvider smoke test

- [ ] Write a vitest test at `packages/ops/src/tracing/__tests__/sdk.smoke.test.ts` that verifies: (a) `createTracerProvider()` returns a `TracerProvider` with the correct service name from `OTEL_SERVICE_NAME` env, (b) export is configured when `OTEL_EXPORTER_OTLP_ENDPOINT` is set, (c) no crash when env vars are missing.
- **Files:** `packages/ops/src/tracing/__tests__/sdk.smoke.test.ts`
- **Estimated lines:** ~40
- **Acceptance:** Test fails (RED) — `createTracerProvider` does not exist yet.

<!-- sdd-owner: implementation -->

#### Task 1.1.3 — Write RED: Tracing middleware contract test

- [ ] Write a vitest test at `packages/ops/src/tracing/__tests__/middleware.test.ts` that: (a) creates a minimal Elysia app with `tracingMiddleware`, (b) makes a request and asserts `X-Trace-Id` response header is present, (c) asserts the trace ID is a valid W3C format (`/^[0-9a-f]{32}$/`), (d) asserts the header is absent when middleware is not registered.
- **Files:** `packages/ops/src/tracing/__tests__/middleware.test.ts`
- **Estimated lines:** ~60
- **Acceptance:** Test fails (RED) — `tracingMiddleware` does not exist yet.

<!-- sdd-owner: implementation -->

#### Task 1.1.4 — Write RED: Sampler tests

- [ ] Write a vitest test at `packages/ops/src/tracing/__tests__/sampler.test.ts` that verifies: (a) `AlwaysOnSampler` is used in `development`/`staging` environments, (b) `ParentBasedSampler` with `TraceIdRatioBasedSampler(0.1)` is used in `production`, (c) the `DeferredSpanProcessor` records spans regardless of sampling decision, (d) error spans are always included in export regardless of base sampling rate.
- **Files:** `packages/ops/src/tracing/__tests__/sampler.test.ts`
- **Estimated lines:** ~80
- **Acceptance:** Test fails (RED) — sampler and `DeferredSpanProcessor` do not exist yet.

<!-- sdd-owner: implementation -->

#### Task 1.1.5 — GREEN: Implement TracerProvider + OTel SDK setup

- [ ] Implement `packages/ops/src/tracing/sdk.ts` with `createTracerProvider()`: reads `DRENYRA_ENABLE_OTEL`, `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SAMPLING_BASE_RATE` env vars; creates `WebTracerProvider`; registers `BatchSpanProcessor` with `OTLPTraceExporter`; sets global `propagation` with `W3CTraceContextPropagator`.
- [ ] Implement `packages/ops/src/tracing/sampler.ts` with `createSampler()` per AD-1 design: dev/staging → `AlwaysOnSampler`, production → `ParentBasedSampler({ root: TraceIdRatioBasedSampler(0.1) })`.
- [ ] Implement `packages/ops/src/tracing/sampler.ts` with `DeferredSpanProcessor` class: buffers all spans in-memory (max 10k), at export time includes all ERROR spans + sampled non-error spans. Implement `onStart`, `onEnd`, `shutdown`, `forceFlush`.
- [ ] Run 1.1.2 and 1.1.4 tests — must pass (GREEN).
- **Files:** `packages/ops/src/tracing/sdk.ts`, `packages/ops/src/tracing/sampler.ts`
- **Estimated lines:** ~180
- **Acceptance:** All tracer and sampler tests pass.

<!-- sdd-owner: implementation -->

#### Task 1.1.6 — GREEN: Implement Elysia tracing middleware

- [ ] Implement `packages/ops/src/tracing/middleware.ts` with `tracingMiddleware(app: Elysia): Elysia`: extracts or creates W3C trace context from `traceparent` request header; creates an HTTP span on `onRequest` with attributes `http.method`, `http.url`, `http.route`; ends span on `onAfterResponse` with `http.status_code`; sets `X-Trace-Id` response header; handles errors on `onError` with `SpanStatusCode.ERROR`.
- [ ] Implement `packages/ops/src/tracing/propagation.ts` with helpers: `extractTraceContext(headers: Record<string, string>): TraceContext | null`, `injectTraceContext(headers: Headers): void`.
- [ ] Implement `packages/ops/src/index.ts` public exports.
- [ ] Run 1.1.3 tests — must pass (GREEN).
- **Files:** `packages/ops/src/tracing/middleware.ts`, `packages/ops/src/tracing/propagation.ts`
- **Estimated lines:** ~150
- **Acceptance:** Middleware contract tests pass. Manual `curl` against a test Elysia app shows `X-Trace-Id` header.

<!-- sdd-owner: implementation -->

#### Task 1.1.7 — TRIANGULATE: Edge case tests for middleware

- [ ] Add tests at `packages/ops/src/tracing/__tests__/middleware.test.ts` for: (a) inbound `traceparent` header → span becomes child of parent trace, (b) malformed `traceparent` → new root span created, (c) missing `traceparent` → new root span created, (d) concurrent requests get unique `traceId` values, (e) middleware propagates `traceId` through `onError` when request throws.
- **Files:** `packages/ops/src/tracing/__tests__/middleware.test.ts`
- **Estimated lines:** ~70
- **Acceptance:** All edge case tests pass.

<!-- sdd-owner: implementation -->

#### Task 1.1.8 — REFACTOR: Extract span attribute constants

- [ ] Create `packages/ops/src/tracing/attributes.ts` with `SEMANTIC_ATTRIBUTES` constants for `HTTP_METHOD`, `HTTP_URL`, `HTTP_ROUTE`, `HTTP_STATUS_CODE`, `HTTP_TRACE_ID`, `SERVICE_NAME`.
- [ ] Update `middleware.ts` and `sdk.ts` to use constants instead of string literals.
- [ ] Verify all tests still pass.
- **Files:** `packages/ops/src/tracing/attributes.ts`, `packages/ops/src/tracing/middleware.ts`
- **Estimated lines:** ~40
- **Acceptance:** Tests pass. No string literal attribute keys remain.

<!-- sdd-owner: implementation -->

#### Task 1.1.9 — Integrate tracing middleware into app-core

- [ ] In `apps/api/src/app-core.ts`, import `tracingMiddleware` from `@drenyra/ops` and register it via `.use(tracingMiddleware)` BEFORE `requestLogger` and `metricsMiddleware` per design contract.
- [ ] Add `traceId` to the error response body in the existing global error handler. Read the active span's `traceId` via `trace.getActiveSpan()?.spanContext().traceId` or fall back to `'unknown'`.
- [ ] Add `trace_id` to Pino log child context in the request logger: read active trace ID and merge into log metadata.
- [ ] Extend the existing `/health/doctor` endpoint (or its OTEL readiness section) to report `otel: { enabled: boolean, exporter: string, sampling: string }`.
- **Files:** `apps/api/src/app-core.ts`, `apps/api/src/shared/errors/global-error-handler.ts` (approximate path — discover exact), `apps/api/src/shared/middleware/request-logger.ts`, `apps/api/src/features/health/`
- **Estimated lines:** ~80
- **Acceptance:** Starting the API logs a line with `trace_id`. Error responses include `traceId`. `/health/doctor` reports OTEL status.

<!-- sdd-owner: implementation -->

#### Task 1.1.10 — Verify PR 1.1

- [ ] Run `bun run typecheck` across the monorepo (or `packages/ops` + `apps/api` minimum).
- [ ] Run `bun run test` in `packages/ops/` — all tests must pass.
- [ ] Manual smoke: start API, hit any endpoint, confirm `X-Trace-Id` in response and `trace_id` in log output.
- **Estimated lines:** 0 (verification only)
- **Acceptance:** All gates pass. PR 1.1 ready for review.

<!-- sdd-owner: parent -->

---

### PR 1.2: Manual Business Spans + Trace Context Propagation

**Goal:** Manual spans for `fiscal.calculate`, `sunat.submit`, `ai.completion`. DB tracing wrapper. Trace context propagation from API → Data Engine. Trace IDs in FE telemetry.

**Dependencies:** PR 1.1 (tracing middleware + SDK).

---

#### Task 1.2.1 — Write RED: Business span smoke tests

- [ ] Write vitest test at `packages/ops/src/tracing/__tests__/spans.test.ts` that verifies: (a) `startBusinessSpan('fiscal.calculate', {...})` creates a span with the given name, (b) span attributes are set correctly on creation, (c) `endSpan` records the span in the active provider, (d) `getActiveTraceId()` returns the current trace ID when inside an active span.
- **Files:** `packages/ops/src/tracing/__tests__/spans.test.ts`
- **Estimated lines:** ~60
- **Acceptance:** Test fails (RED) — span helpers do not exist.

<!-- sdd-owner: implementation -->

#### Task 1.2.2 — Write RED: DB tracing wrapper test

- [ ] Write vitest test at `packages/ops/src/tracing/__tests__/db-tracing.test.ts` that uses a mocked Drizzle instance: (a) `wrapDbWithTracing(mockDb)` returns an object that mirrors the original's shape, (b) intercepted `select()`, `insert()`, `update()`, `delete()` calls create child DB spans, (c) DB spans have attributes `db.system`, `db.operation`, `db.table` when inferable, (d) errors in DB calls set span status to ERROR.
- **Files:** `packages/ops/src/tracing/__tests__/db-tracing.test.ts`
- **Estimated lines:** ~80
- **Acceptance:** Test fails (RED).

<!-- sdd-owner: implementation -->

#### Task 1.2.3 — GREEN: Implement business span helpers

- [ ] Implement `packages/ops/src/tracing/spans/fiscal.ts` with `fiscalCalculateSpan(attrs)` and `fiscalCalculateEnd(span, result)`.
- [ ] Implement `packages/ops/src/tracing/spans/sunat.ts` with `sunatSubmitSpan(attrs)` and `sunatSubmitEnd(span, statusCode, durationMs)`.
- [ ] Implement `packages/ops/src/tracing/spans/ai.ts` with `aiCompletionSpan(attrs)` and `aiCompletionEnd(span, tokens, cost)`.
- [ ] Export all span helpers from `packages/ops/src/tracing/spans/index.ts`.
- [ ] Run 1.2.1 tests — must pass (GREEN).
- **Files:** `packages/ops/src/tracing/spans/fiscal.ts`, `packages/ops/src/tracing/spans/sunat.ts`, `packages/ops/src/tracing/spans/ai.ts`, `packages/ops/src/tracing/spans/index.ts`
- **Estimated lines:** ~120
- **Acceptance:** Business span tests pass. Spans include the attributes from spec (document.type, document.amount, sunat.endpoint, sunat.status_code, model, tokens, cost).

<!-- sdd-owner: implementation -->

#### Task 1.2.4 — GREEN: Implement DB tracing wrapper

- [ ] Implement `packages/ops/src/tracing/db-tracing.ts` with `wrapDbWithTracing<T extends DrizzleDB>(db: T): T`. Use a Proxy that intercepts `select`, `insert`, `update`, `delete` and wraps each in a child span. Span name: `db.<operation>.<table>` or `db.query` when table is not inferable.
- [ ] Run 1.2.2 tests — must pass (GREEN).
- **Files:** `packages/ops/src/tracing/db-tracing.ts`
- **Estimated lines:** ~100
- **Acceptance:** DB tracing tests pass. Wrapped DB transparently passes through all original Drizzle methods.

<!-- sdd-owner: implementation -->

#### Task 1.2.5 — Wire manual spans into API business logic

- [ ] In the fiscal calculation code path (discover exact files — likely in `apps/api/src/features/fiscal/`), wrap the calculation logic with `fiscalCalculateSpan` / `fiscalCalculateEnd`.
- [ ] In the SUNAT submission code path (discover exact files — likely in the Data Engine integration layer), wrap the outbound HTTP call with `sunatSubmitSpan` / `sunatSubmitEnd`.
- [ ] In the AI swarm orchestrator code path, wrap AI completion calls with `aiCompletionSpan` / `aiCompletionEnd`.
- [ ] Add `traceparent` header propagation to the Data Engine HTTP client (discover exact adapter file) using `injectTraceContext` from propagation helpers.
- [ ] Wire `wrapDbWithTracing` into the DB singleton used by the API — replace the raw Drizzle instance.
- **Files:** Multiple — discover exact paths via CodeGraph
- **Estimated lines:** ~80
- **Acceptance:** Manual trace verification: a fiscal report request produces spans for `fiscal.calculate` and `sunat.submit` in the OTel collector.

<!-- sdd-owner: implementation -->

#### Task 1.2.6 — TRIANGULATE: Test trace context propagation to Data Engine

- [ ] Write integration test at `packages/ops/src/tracing/__tests__/propagation.integration.test.ts`: create a span, inject context into headers via `injectTraceContext`, assert headers contain valid `traceparent`. Then extract via `extractTraceContext`, assert the traceId matches.
- **Files:** `packages/ops/src/tracing/__tests__/propagation.integration.test.ts`
- **Estimated lines:** ~50
- **Acceptance:** Round-trip test passes.

<!-- sdd-owner: implementation -->

#### Task 1.2.7 — Connect FE telemetry to trace ID

- [ ] In the frontend telemetry code (discover exact path — likely `apps/web/src/shared/telemetry/`), capture `X-Trace-Id` from API response headers and attach it to error events.
- [ ] Verify that API responses already carry `X-Trace-Id` (regression check from PR 1.1).
- **Files:** Discover exact paths
- **Estimated lines:** ~30
- **Acceptance:** FE error events in telemetry carry `traceId` matching the API request. Manual verification via browser DevTools.

<!-- sdd-owner: implementation -->

#### Task 1.2.8 — Verify PR 1.2

- [ ] Run `bun run typecheck` on affected packages.
- [ ] Run `bun run test` in `packages/ops/` — all tests pass.
- [ ] Manual smoke: trigger a fiscal endpoint, verify spans appear in OTel collector.
- **Estimated lines:** 0
- **Acceptance:** PR 1.2 ready for review.

<!-- sdd-owner: parent -->

---

### PR 1.3: Operations Dashboards — Queries + API + UI

**Goal:** Ops dashboard queries (health, analytics, resources, business) extending `dashboardRoutes`. Frontend components in `apps/web/src/features/ops-dashboard/`.

**Dependencies:** PR 1.1 (tracing middleware in app-core for trace IDs in metrics).

---

#### Task 1.3.1 — Write RED: Dashboard query contract tests

- [ ] Write vitest tests at `packages/ops/src/dashboard/__tests__/queries.test.ts` (create dir) for each query module:
  - `health.test.ts`: mocks health check data, asserts `getAggregatedHealth()` returns per-service status + uptime.
  - `analytics.test.ts`: mocks prom-client metrics, asserts `getRequestAnalytics(window)` returns RPM, p50/p95/p99, error rate.
  - `resources.test.ts`: mocks prom-client metrics + config, asserts `getResourceUtilization()` returns CPU, memory, DB pool %, AI tokens.
  - `business.test.ts`: mocks DB + prom-client metrics, asserts `getBusinessMetrics()` returns active companies, docs/hour, AI cost/day.
- **Files:** `packages/ops/src/dashboard/__tests__/health.test.ts`, `analytics.test.ts`, `resources.test.ts`, `business.test.ts`
- **Estimated lines:** ~160 (4 test files × ~40)
- **Acceptance:** All 4 test files fail (RED).

<!-- sdd-owner: implementation -->

#### Task 1.3.2 — GREEN: Implement ops dashboard query functions

- [ ] Implement `packages/ops/src/dashboard/queries/health.ts` with `getAggregatedHealth()`: reads from in-process health checks or the existing health module, returns `{ services: Record<string, { status, uptime_30d }>, activeIncidents: number }`.
- [ ] Implement `packages/ops/src/dashboard/queries/analytics.ts` with `getRequestAnalytics(window)`: reads prom-client registry via `register.getMetricsAsJSON()`, computes RPM, latency percentiles, error rate.
- [ ] Implement `packages/ops/src/dashboard/queries/resources.ts` with `getResourceUtilization()`: reads process metrics + DB pool metrics + AI token counters from prom-client.
- [ ] Implement `packages/ops/src/dashboard/queries/business.ts` with `getBusinessMetrics()`: active companies from company table, documents/hour from prom metrics, AI cost/day from prom metrics.
- [ ] Run 1.3.1 tests — must pass (GREEN).
- **Files:** `packages/ops/src/dashboard/queries/health.ts`, `analytics.ts`, `resources.ts`, `business.ts`
- **Estimated lines:** ~250
- **Acceptance:** All query tests pass.

<!-- sdd-owner: implementation -->

#### Task 1.3.3 — GREEN: Implement ops dashboard API routes

- [ ] Extend `apps/api/src/features/dashboard/` with a new file `api/ops-dashboard.routes.ts` registering Elysia routes:
  - `GET /api/dashboard/ops/health` → calls `getAggregatedHealth()`
  - `GET /api/dashboard/ops/analytics?window=1h|6h|24h|7d` → calls `getRequestAnalytics(window)`
  - `GET /api/dashboard/ops/resources` → calls `getResourceUtilization()`
  - `GET /api/dashboard/ops/business` → calls `getBusinessMetrics()`
- [ ] Use Elysia schema validation (Zod 4) for query params. Add admin auth guard.
- [ ] Wire into the main Elysia app via the existing dashboard feature index.
- **Files:** `apps/api/src/features/dashboard/api/ops-dashboard.routes.ts`
- **Estimated lines:** ~100
- **Acceptance:** `GET /api/dashboard/ops/health` returns valid JSON with services and activeIncidents.

<!-- sdd-owner: implementation -->

#### Task 1.3.4 — TRIANGULATE: Edge case tests for dashboard queries

- [ ] Add tests: (a) empty metrics registry → queries return zeros, not crash, (b) invalid window param → validation error, (c) missing permission → 401/403, (d) large metric cardinality → response within 500ms.
- **Files:** `packages/ops/src/dashboard/__tests__/*.test.ts`
- **Estimated lines:** ~60
- **Acceptance:** All edge cases handled correctly.

<!-- sdd-owner: implementation -->

#### Task 1.3.5 — RED: Frontend ops dashboard component tests

- [ ] Write vitest + React Testing Library tests at `apps/web/src/features/ops-dashboard/__tests__/` for each page component:
  - `SystemHealth.test.tsx`: renders service status cards, loading state, error state.
  - `RequestAnalytics.test.tsx`: renders latency chart with time-range selector.
  - `ResourceUtilization.test.tsx`: renders CPU/memory/DB-pool gauges.
  - `BusinessMetrics.test.tsx`: renders company count, docs/hour, AI cost.
- **Files:** `apps/web/src/features/ops-dashboard/__tests__/SystemHealth.test.tsx`, `RequestAnalytics.test.tsx`, `ResourceUtilization.test.tsx`, `BusinessMetrics.test.tsx`
- **Estimated lines:** ~160
- **Acceptance:** Tests fail (RED) — components do not exist.

<!-- sdd-owner: implementation -->

#### Task 1.3.6 — GREEN: Implement ops dashboard UI components

- [ ] Create `apps/web/src/features/ops-dashboard/` feature directory with:
  - `pages/SystemHealth.tsx` — renders `ServiceStatusCard` for each service.
  - `pages/RequestAnalytics.tsx` — latency chart (use existing chart lib), time-range selector.
  - `pages/ResourceUtilization.tsx` — CPU/memory/DB pool/AI token gauges.
  - `pages/BusinessMetrics.tsx` — company count, docs/hour, AI cost/day cards.
  - `components/ServiceStatusCard.tsx` — status indicator (healthy/degraded/down), uptime %.
  - `components/LatencyChart.tsx` — P50/P95/P99 line chart.
  - `components/BurnRateGauge.tsx` — gauge component (reused later for SLO).
- [ ] Use existing design system (Glass & Steel tokens, Tailwind 4). Use React 19 + TanStack Router.
- [ ] Wire into the admin panel navigation.
- [ ] Run 1.3.5 tests — must pass (GREEN).
- **Files:** `apps/web/src/features/ops-dashboard/pages/SystemHealth.tsx`, `RequestAnalytics.tsx`, `ResourceUtilization.tsx`, `BusinessMetrics.tsx`, `apps/web/src/features/ops-dashboard/components/ServiceStatusCard.tsx`, `LatencyChart.tsx`, `BurnRateGauge.tsx`
- **Estimated lines:** ~350
- **Acceptance:** UI tests pass. Dashboard pages render with mock API data.

<!-- sdd-owner: implementation -->

#### Task 1.3.7 — REFACTOR: Extract shared chart primitives

- [ ] If chart primitives (line chart, gauge) are reusable beyond ops-dashboard, extract to `apps/web/src/shared/components/charts/`.
- [ ] Ensure ops-dashboard components import from extracted path.
- [ ] Run all tests.
- **Estimated lines:** ~30
- **Acceptance:** Tests pass. No duplication with existing dashboard chart code.

<!-- sdd-owner: implementation -->

#### Task 1.3.8 — Verify PR 1.3

- [ ] Run `bun run typecheck` on affected packages.
- [ ] Run `bun run test` in `packages/ops/` and `apps/web/`.
- [ ] Manual smoke: admin panel → ops dashboard → all sections load with live data.
- **Estimated lines:** 0
- **Acceptance:** PR 1.3 ready for review.

<!-- sdd-owner: parent -->

---

### PR 1.4: Alerting Engine — Rules, Notifiers, Alert Lifecycle

**Goal:** Alert rule evaluator (in-process cron), 5 initial rules, severity classifier, notification router, Discord/PagerDuty/Email notifiers, `alerts` DB table.

**Dependencies:** PR 1.3 (prom-client metrics must be collected for rules to evaluate).

---

#### Task 1.4.1 — Write RED: Alert rule evaluator tests

- [ ] Write vitest test at `packages/ops/src/alerting/__tests__/engine.test.ts`: (a) mock `AlertContext` with known metric values, (b) register a test rule that fires when `errors > 10`, (c) assert evaluator fires alert when condition met, (d) assert evaluator does NOT fire when condition not met, (e) assert `debounceMinutes` prevents re-firing within window.
- **Files:** `packages/ops/src/alerting/__tests__/engine.test.ts`
- **Estimated lines:** ~80
- **Acceptance:** Test fails (RED).

<!-- sdd-owner: implementation -->

#### Task 1.4.2 — Write RED: Individual alert rule tests

- [ ] Write vitest tests at `packages/ops/src/alerting/__tests__/rules.test.ts` for each of the 5 initial rules from design:
  - `api-error-rate-spike`: error rate >5% sustained 5min → CRITICAL
  - `db-pool-exhaustion`: pool usage >90% sustained 2min → CRITICAL
  - `p95-latency-degradation`: P95 >2x baseline sustained 10min → WARNING
  - `health-check-failure`: 3 consecutive failures → CRITICAL
  - `cert-expiry`: <30 days → WARNING
  - Also assert: transient spike (3min, not 5min) → no fire.
- **Files:** `packages/ops/src/alerting/__tests__/rules.test.ts`
- **Estimated lines:** ~140
- **Acceptance:** All rule tests fail (RED).

<!-- sdd-owner: implementation -->

#### Task 1.4.3 — Write RED: Notification router tests

- [ ] Write vitest test at `packages/ops/src/alerting/__tests__/router.test.ts`: (a) CRITICAL alert → routes to PagerDuty + Discord, (b) WARNING → routes to Discord only, (c) INFO → routes to email digest only, (d) notifier failure in one channel does NOT block other channels, (e) all notifiers receive the correct `FiredAlert` payload.
- **Files:** `packages/ops/src/alerting/__tests__/router.test.ts`
- **Estimated lines:** ~80
- **Acceptance:** Test fails (RED).

<!-- sdd-owner: implementation -->

#### Task 1.4.4 — Write RED: Alert state machine tests

- [ ] Write vitest test at `packages/ops/src/alerting/__tests__/state.test.ts`: (a) alert transitions: null → FIRING → ACKNOWLEDGED → RESOLVED, (b) FIRING → SUPPRESSED during maintenance window, (c) invalid transitions throw (e.g., RESOLVED → FIRING without new evaluation), (d) acknowledgment records `acknowledgedBy` and `acknowledgedAt`.
- **Files:** `packages/ops/src/alerting/__tests__/state.test.ts`
- **Estimated lines:** ~70
- **Acceptance:** Test fails (RED).

<!-- sdd-owner: implementation -->

#### Task 1.4.5 — GREEN: Implement alert rule types and DSL

- [ ] Implement `packages/ops/src/alerting/types.ts` with `AlertRule`, `AlertContext`, `MetricSnapshot`, `AlertResult` interfaces per design AD-2.
- [ ] Implement `MetricSnapshot` range/current helpers that read from prom-client registry JSON.
- **Files:** `packages/ops/src/alerting/types.ts`
- **Estimated lines:** ~70
- **Acceptance:** Types compile. Exported from package index.

<!-- sdd-owner: implementation -->

#### Task 1.4.6 — GREEN: Implement alert engine (evaluator + classifier)

- [ ] Implement `packages/ops/src/alerting/engine.ts` with `AlertRuleEvaluator` class: accepts array of `AlertRule`, runs `evaluate` on each every `ALERT_EVALUATION_INTERVAL_SECONDS` (default 30s), uses Bun-native `setInterval`. Reads metrics from prom-client register via `register.getMetricsAsJSON()`.
- [ ] Implement `packages/ops/src/alerting/classifier.ts` with `SeverityClassifier`: maps rule severity + context to final severity. Allows override via admin API later.
- [ ] Run 1.4.1 tests — must pass (GREEN).
- **Files:** `packages/ops/src/alerting/engine.ts`, `packages/ops/src/alerting/classifier.ts`
- **Estimated lines:** ~150
- **Acceptance:** Engine tests pass. Evaluator fires and debounces correctly.

<!-- sdd-owner: implementation -->

#### Task 1.4.7 — GREEN: Implement 5 initial alert rules

- [ ] Implement each rule file per design AD-2 structure:
  - `packages/ops/src/alerting/rules/api-error-rate.ts`
  - `packages/ops/src/alerting/rules/db-pool-exhaustion.ts`
  - `packages/ops/src/alerting/rules/p95-latency.ts`
  - `packages/ops/src/alerting/rules/health-check.ts`
  - `packages/ops/src/alerting/rules/cert-expiry.ts`
- [ ] Each rule exports a const `AlertRule` with `id`, `name`, `description`, `severity`, `evaluate(ctx)`, and `debounceMinutes`.
- [ ] Register all rules in `packages/ops/src/alerting/rules/index.ts`.
- [ ] Run 1.4.2 tests — must pass (GREEN).
- **Files:** `packages/ops/src/alerting/rules/api-error-rate.ts`, `db-pool-exhaustion.ts`, `p95-latency.ts`, `health-check.ts`, `cert-expiry.ts`, `index.ts`
- **Estimated lines:** ~200
- **Acceptance:** All rule tests pass with correct fire/not-fire behavior.

<!-- sdd-owner: implementation -->

#### Task 1.4.8 — GREEN: Implement notification router + notifiers

- [ ] Implement `packages/ops/src/alerting/router.ts` with `NotificationRouter`: maps severity → channel list per design AD-3 routing table. Dispatches `send()` to each channel in parallel via `Promise.allSettled`. Logs notifier failures but does not throw.
- [ ] Implement `packages/ops/src/alerting/notifiers/discord.ts`: posts to `ALERT_DISCORD_WEBHOOK_URL` with embed format (severity-colored border, alert details, acknowledgment instructions).
- [ ] Implement `packages/ops/src/alerting/notifiers/pagerduty.ts`: posts to PagerDuty Events API v2. Trigger/dedupe/resolve lifecycle mapped to alert state. Graceful fallback on network error.
- [ ] Implement `packages/ops/src/alerting/notifiers/email.ts` and `email-digest.ts`: email sends single alert; digest batches INFO alerts. Uses existing `@drenyra/infrastructure` email adapter.
- [ ] Run 1.4.3 tests — must pass (GREEN).
- **Files:** `packages/ops/src/alerting/router.ts`, `packages/ops/src/alerting/notifiers/discord.ts`, `pagerduty.ts`, `email.ts`, `email-digest.ts`
- **Estimated lines:** ~250
- **Acceptance:** Router tests pass. Mocked HTTP clients verify correct webhook/Duty/PagerDuty payloads.

<!-- sdd-owner: implementation -->

#### Task 1.4.9 — GREEN: Implement alert state machine

- [ ] Implement `packages/ops/src/alerting/state.ts` with `AlertStateMachine`: manages transitions `FIRING → ACKNOWLEDGED → RESOLVED` and `FIRING → SUPPRESSED`. Validates transitions. Persists state to `alerts` DB table via Drizzle.
- [ ] Run 1.4.4 tests — must pass (GREEN).
- **Files:** `packages/ops/src/alerting/state.ts`
- **Estimated lines:** ~100
- **Acceptance:** State machine tests pass. Invalid transitions rejected.

<!-- sdd-owner: implementation -->

#### Task 1.4.10 — GREEN: Create alerts DB table migration

- [ ] Add `alerts` table schema to `packages/persistence/src/schema/ops.ts` following the exact design from AD-5: columns `id`, `ruleId`, `ruleName`, `severity`, `status`, `message`, `value` (jsonb), `service`, `traceId`, `acknowledgedBy`, `acknowledgedAt`, `resolvedAt`, `suppressed`, `suppressReason`, `createdAt`.
- [ ] Generate and apply a Drizzle migration. Ensure the migration is additive (no existing table changes).
- [ ] Export `alerts` from the persistence schema barrel.
- **Files:** `packages/persistence/src/schema/ops.ts`, migration file
- **Estimated lines:** ~40 schema + migration
- **Acceptance:** `alerts` table exists in dev DB. Drizzle queries work.

<!-- sdd-owner: implementation -->

#### Task 1.4.11 — GREEN: Wire alert engine into app-core

- [ ] In `apps/api/src/app-core.ts`, start the `AlertRuleEvaluator` with all 5 rules on server startup. Register under a lifecycle hook.
- [ ] Wire the `NotificationRouter` with Discord/PagerDuty/email config from env vars.
- [ ] Wire `AlertStateMachine` to persist state using the project's DB singleton.
- [ ] Add maintenance window flag check (`ALERT_MAINTENANCE_WINDOW_ENABLED`) — when true, all alerts are evaluated but notifications suppressed and alerts marked `SUPPRESSED`.
- **Files:** `apps/api/src/app-core.ts`
- **Estimated lines:** ~60
- **Acceptance:** API starts without errors. Alert cron runs. Manual test: trigger a metric condition and verify alert appears in DB.

<!-- sdd-owner: implementation -->

#### Task 1.4.12 — GREEN: Implement alert management API

- [ ] Create `apps/api/src/features/alerts/` feature with CQRS pattern:
  - `routes.ts`: `GET /api/alerts` (paginated, filterable by status/severity), `GET /api/alerts/:id`, `POST /api/alerts/:id/acknowledge`, `POST /api/alerts/:id/resolve`.
  - `application/queries/get-alerts.ts`, `get-alert.ts`
  - `application/commands/acknowledge-alert.ts`, `resolve-alert.ts`
- [ ] Add admin auth guard.
- **Files:** `apps/api/src/features/alerts/index.ts`, `routes.ts`, `application/queries/get-alerts.ts`, `get-alert.ts`, `application/commands/acknowledge-alert.ts`, `resolve-alert.ts`
- **Estimated lines:** ~180
- **Acceptance:** CRUD operations work. Acknowledged alerts updated in DB.

<!-- sdd-owner: implementation -->

#### Task 1.4.13 — GREEN: Implement alert timeline in dashboard

- [ ] Add `packages/ops/src/dashboard/queries/alerts.ts` with `getRecentAlerts(limit, status?)` query.
- [ ] Add `GET /api/dashboard/ops/alerts` route to ops-dashboard routes.
- [ ] Implement `apps/web/src/features/ops-dashboard/pages/AlertTimeline.tsx` — renders 50 most recent alerts, filterable by acknowledged/unacknowledged, each shows severity badge + timestamp + status.
- [ ] Implement `apps/web/src/features/ops-dashboard/components/AlertBadge.tsx` — severity-colored badge (red=CRITICAL, yellow=WARNING, blue=INFO).
- **Files:** `packages/ops/src/dashboard/queries/alerts.ts`, `apps/api/src/features/dashboard/api/ops-dashboard.routes.ts` (extend), `apps/web/src/features/ops-dashboard/pages/AlertTimeline.tsx`, `apps/web/src/features/ops-dashboard/components/AlertBadge.tsx`
- **Estimated lines:** ~120
- **Acceptance:** Alert timeline renders with mock data. Filter by status works.

<!-- sdd-owner: implementation -->

#### Task 1.4.14 — TRIANGULATE: Alert engine integration test

- [ ] Write integration test at `packages/ops/src/alerting/__tests__/integration.test.ts`: (a) start evaluator with mock metrics showing error spike, (b) assert alert record created in test DB, (c) assert notification router called with correct channels, (d) assert debounce prevents duplicate, (e) acknowledge the alert, assert state transition.
- **Files:** `packages/ops/src/alerting/__tests__/integration.test.ts`
- **Estimated lines:** ~80
- **Acceptance:** Integration test passes without flakiness.

<!-- sdd-owner: implementation -->

#### Task 1.4.15 — Verify PR 1.4

- [ ] Run `bun run typecheck` across affected packages.
- [ ] Run `bun run test` in `packages/ops/` and `apps/api/src/features/alerts/`.
- [ ] Manual smoke: (a) trigger a metric condition manually via `/metrics` manipulation or a test endpoint, (b) verify alert fires in Discord/webhook, (c) acknowledge via API, (d) resolve via API.
- **Estimated lines:** 0
- **Acceptance:** PR 1.4 ready for review. Phase 1 gate met: traces visible in collector, alerts fire to Discord, ops dashboard shows live data.

<!-- sdd-owner: parent -->

---

## Phase 2 — Incident Response (PRs 2.1–2.4)

### PR 2.1: Runbook Engine + Initial Runbook Library

**Goal:** Runbook YAML definitions (4 files), runbook execution engine, runbook registry.

**Dependencies:** PR 1.4 (alert engine must be functional — runbooks are triggered from alerts).

---

#### Task 2.1.1 — Write RED: Runbook registry + engine tests

- [ ] Write vitest test at `packages/ops/src/runbooks/__tests__/engine.test.ts`: (a) load a valid runbook YAML → parses correctly with all fields, (b) load invalid YAML → validation error, no crash, (c) step execution: mark complete → next step displayed, skip → next step displayed, custom observation recorded, (d) escalation timeout fires after configured `escalation.after`, (e) multiple runbooks can be loaded simultaneously.
- **Files:** `packages/ops/src/runbooks/__tests__/engine.test.ts`
- **Estimated lines:** ~100
- **Acceptance:** Test fails (RED).

<!-- sdd-owner: implementation -->

#### Task 2.1.2 — GREEN: Implement runbook engine + registry

- [ ] Implement `packages/ops/src/runbooks/registry.ts` with `RunbookRegistry`: loads YAML files from `runbooks/` directory, validates structure (incident id, severity, diagnosis steps with commands + expected outputs, mitigation actions with commands, escalation timeout + target), caches loaded runbooks.
- [ ] Implement `packages/ops/src/runbooks/engine.ts` with `RunbookEngine`: accepts a runbook ID, starts an execution session, returns current step, accepts step resolution (complete/skip/observation), auto-escalates on timeout, logs session events.
- [ ] Run 2.1.1 tests — must pass (GREEN).
- **Files:** `packages/ops/src/runbooks/registry.ts`, `packages/ops/src/runbooks/engine.ts`
- **Estimated lines:** ~200
- **Acceptance:** Engine tests pass.

<!-- sdd-owner: implementation -->

#### Task 2.1.3 — GREEN: Create 4 initial runbook YAML files

- [ ] Create `runbooks/api-high-error-rate.yaml` with diagnosis steps: check recent deploys, check error logs, check DB pool, check upstream (SUNAT/AI). Mitigation: rollback deploy, restart API, scale DB pool. Escalation: 15min → engineering lead.
- [ ] Create `runbooks/db-pool-exhaustion.yaml` with diagnosis: `pg_stat_activity`, recent deploys, connection-leaking queries. Mitigation: restart API, terminate idle connections, increase pool max.
- [ ] Create `runbooks/ai-swarm-degraded.yaml` with diagnosis: AI gateway status, token usage spike, model latency. Mitigation: fallback model, reduce concurrency, circuit-break.
- [ ] Create `runbooks/sunat-unreachable.yaml` with diagnosis: SUNAT status page, network connectivity, cert validity. Mitigation: retry with backoff, queue documents, notify tenants.
- **Files:** `runbooks/api-high-error-rate.yaml`, `runbooks/db-pool-exhaustion.yaml`, `runbooks/ai-swarm-degraded.yaml`, `runbooks/sunat-unreachable.yaml`
- **Estimated lines:** ~160 (4 × ~40)
- **Acceptance:** Registry loads all 4 runbooks without validation errors.

<!-- sdd-owner: implementation -->

#### Task 2.1.4 — GREEN: Implement runbook API

- [ ] Create `apps/api/src/features/incidents/` runbook-related routes: `GET /api/runbooks` (list), `GET /api/runbooks/:id` (detail), `POST /api/runbooks/:id/start` (begin execution session), `POST /api/runbooks/:id/steps/:stepIndex/resolve` (complete/skip/observe a step).
- **Files:** `apps/api/src/features/incidents/routes.ts` (extend or create runbook-specific routes)
- **Estimated lines:** ~100
- **Acceptance:** List all 4 runbooks. Start an execution session for "api-high-error-rate".

<!-- sdd-owner: implementation -->

#### Task 2.1.5 — Verify PR 2.1

- [ ] Run `bun run typecheck` on affected packages.
- [ ] Run `bun run test` in `packages/ops/src/runbooks/`.
- **Estimated lines:** 0
- **Acceptance:** PR 2.1 ready for review.

<!-- sdd-owner: parent -->

---

### PR 2.2: On-Call Management — Rotations, Escalation, Discord Bot

**Goal:** `on_call_rotations` + `on_call_handoffs` DB tables, rotation API, escalation engine, Discord bot (`/ack`), handoff protocol.

**Dependencies:** PR 2.1 (incidents feature exists), PR 1.4 (alert engine + Discord notifier).

---

#### Task 2.2.1 — Write RED: Rotation management tests

- [ ] Write vitest test at `packages/ops/src/oncall/__tests__/rotation.test.ts`: (a) create weekly rotation with 3 members, (b) advance rotation → next member becomes current, handoff recorded, (c) biweekly rotation advances only after 14 days, (d) follow-the-sun advances every 8 hours, (e) manual advance via API works.
- **Files:** `packages/ops/src/oncall/__tests__/rotation.test.ts`
- **Estimated lines:** ~80
- **Acceptance:** Test fails (RED).

<!-- sdd-owner: implementation -->

#### Task 2.2.2 — Write RED: Escalation policy tests

- [ ] Write vitest test at `packages/ops/src/oncall/__tests__/escalation.test.ts`: (a) level1 timeout (5min) → notifies level2, (b) level2 timeout (15min) → notifies level3, (c) acknowledgment resets escalation chain, (d) no escalation for non-CRITICAL alerts.
- **Files:** `packages/ops/src/oncall/__tests__/escalation.test.ts`
- **Estimated lines:** ~80
- **Acceptance:** Test fails (RED).

<!-- sdd-owner: implementation -->

#### Task 2.2.3 — GREEN: Create on-call DB tables migration

- [ ] Add `onCallRotations` and `onCallHandoffs` tables to `packages/persistence/src/schema/ops.ts` per design AD-5.
- [ ] Generate and apply Drizzle migration.
- **Files:** `packages/persistence/src/schema/ops.ts`, migration file
- **Estimated lines:** ~50
- **Acceptance:** Tables exist. Queries work.

<!-- sdd-owner: implementation -->

#### Task 2.2.4 — GREEN: Implement rotation management logic

- [ ] Implement `packages/ops/src/oncall/rotation.ts` with: `createRotation`, `getRotations`, `advanceRotation`, `getCurrentOnCall`. Rotation advancement finds next member index, records handoff in `onCallHandoffs`, updates `currentMember` + `nextHandoffAt`.
- [ ] Implement `packages/ops/src/oncall/handoff.ts` with `generateHandoffSummary`: queries unacknowledged alerts, active incidents, pending P0/P1 action items, outgoing engineer notes. Returns structured summary for Discord posting.
- [ ] Run 2.2.1 tests — must pass (GREEN).
- **Files:** `packages/ops/src/oncall/rotation.ts`, `packages/ops/src/oncall/handoff.ts`
- **Estimated lines:** ~180
- **Acceptance:** Rotation tests pass.

<!-- sdd-owner: implementation -->

#### Task 2.2.5 — GREEN: Implement escalation engine

- [ ] Implement `packages/ops/src/oncall/escalation.ts` with `EscalationEngine`: tracks unacknowledged CRITICAL alerts, applies escalation policy levels with timeouts, notifies next level via `NotificationRouter` or direct Discord DM, resets on acknowledgment.
- [ ] Run 2.2.2 tests — must pass (GREEN).
- **Files:** `packages/ops/src/oncall/escalation.ts`
- **Estimated lines:** ~120
- **Acceptance:** Escalation tests pass.

<!-- sdd-owner: implementation -->

#### Task 2.2.6 — GREEN: Implement Discord bot integration

- [ ] Implement `packages/ops/src/oncall/discord-bot.ts`: listens for `/ack <alert-id>` slash command via Discord Interactions API, calls alert acknowledgment API, responds with confirmation. Uses `ONCALL_DISCORD_BOT_TOKEN` env var.
- [ ] Post handoff summaries to the configured Discord channel on rotation advancement.
- **Files:** `packages/ops/src/oncall/discord-bot.ts`
- **Estimated lines:** ~150
- **Acceptance:** Discord bot responds to `/ack` command. Handoff notification posts to channel.

<!-- sdd-owner: implementation -->

#### Task 2.2.7 — GREEN: Implement on-call management API

- [ ] Create `apps/api/src/features/oncall/` feature with CQRS pattern:
  - `routes.ts`: `GET /api/oncall/rotations`, `POST /api/oncall/rotations`, `PUT /api/oncall/rotations/:id`, `POST /api/oncall/rotations/:id/advance`, `GET /api/oncall/current`.
  - `application/queries/get-rotations.ts`, `get-current-oncall.ts`
  - `application/commands/create-rotation.ts`, `update-rotation.ts`, `advance-rotation.ts`
- [ ] Add admin auth guard.
- **Files:** `apps/api/src/features/oncall/index.ts`, `routes.ts`, `application/queries/get-rotations.ts`, `get-current-oncall.ts`, `application/commands/create-rotation.ts`, `update-rotation.ts`, `advance-rotation.ts`
- **Estimated lines:** ~200
- **Acceptance:** CRUD works. Advance triggers handoff + Discord notification.

<!-- sdd-owner: implementation -->

#### Task 2.2.8 — GREEN: Implement on-call calendar UI

- [ ] Implement `apps/web/src/features/oncall/` with rotation calendar view, current on-call display, rotation management admin panel.
- **Files:** `apps/web/src/features/oncall/`
- **Estimated lines:** ~150
- **Acceptance:** UI renders rotation schedule. Admin can create/advance rotations.

<!-- sdd-owner: implementation -->

#### Task 2.2.9 — Wire on-call + escalation into app-core

- [ ] Start the daily rotation advancement cron (daily at 00:01 UTC) in `app-core.ts`.
- [ ] Start the escalation engine in `app-core.ts` — polls unacknowledged alerts every minute.
- **Files:** `apps/api/src/app-core.ts`
- **Estimated lines:** ~40
- **Acceptance:** Cron starts without error. Handoff fires at scheduled time.

<!-- sdd-owner: implementation -->

#### Task 2.2.10 — Verify PR 2.2

- [ ] Run `bun run typecheck`.
- [ ] Run `bun run test` in `packages/ops/src/oncall/`.
- **Estimated lines:** 0
- **Acceptance:** PR 2.2 ready for review.

<!-- sdd-owner: parent -->

---

### PR 2.3: SLI/SLO Tracking + Error Budget

**Goal:** `sli_definitions` + `sli_measurements` DB tables, 5 SLI definitions, SLO tracker, error budget computation, budget alerts, SLO dashboard.

**Dependencies:** PR 1.4 (prom-client metrics for SLI computation), PR 1.3 (dashboard infrastructure).

---

#### Task 2.3.1 — Write RED: SLI computation tests

- [ ] Write vitest test at `packages/ops/src/slo/__tests__/indicators.test.ts` for each of 5 SLIs:
  - API availability: `(total - 5xx) / total * 100`
  - API latency P95 for fiscal endpoints: compute from prom-client histogram
  - Data Engine availability: same formula
  - AI swarm availability: same formula
  - Health check pass rate: `passed / total * 100`
- [ ] Each test provides known input metrics and asserts expected compliance percentage.
- **Files:** `packages/ops/src/slo/__tests__/indicators.test.ts`
- **Estimated lines:** ~100
- **Acceptance:** Test fails (RED).

<!-- sdd-owner: implementation -->

#### Task 2.3.2 — Write RED: Error budget tests

- [ ] Write vitest test at `packages/ops/src/slo/__tests__/budget.test.ts`: (a) given 99.9% SLO → monthly error budget = 43.2min, (b) 21.6min downtime → 50% consumed, (c) 43.2min → 100% consumed, (d) burn rate alert at 50%/80%/100% thresholds per env var config.
- **Files:** `packages/ops/src/slo/__tests__/budget.test.ts`
- **Estimated lines:** ~70
- **Acceptance:** Test fails (RED).

<!-- sdd-owner: implementation -->

#### Task 2.3.3 — GREEN: Create SLI/SLO DB tables migration

- [ ] Add `sliDefinitions` and `sliMeasurements` tables to `packages/persistence/src/schema/ops.ts` per design AD-5.
- [ ] Generate and apply Drizzle migration.
- **Files:** `packages/persistence/src/schema/ops.ts`, migration file
- **Estimated lines:** ~40
- **Acceptance:** Tables exist.

<!-- sdd-owner: implementation -->

#### Task 2.3.4 — GREEN: Implement SLI computation functions

- [ ] Implement `packages/ops/src/slo/indicators.ts` with `computeApiAvailability()`, `computeApiLatencyP95()`, `computeDataEngineAvailability()`, `computeAiSwarmAvailability()`, `computeHealthCheckPassRate()`.
- [ ] Each function reads from prom-client registry (in-process) and returns a compliance percentage.
- [ ] Run 2.3.1 tests — must pass (GREEN).
- **Files:** `packages/ops/src/slo/indicators.ts`
- **Estimated lines:** ~150
- **Acceptance:** All SLI computation tests pass.

<!-- sdd-owner: implementation -->

#### Task 2.3.5 — GREEN: Implement SLO tracker + error budget

- [ ] Implement `packages/ops/src/slo/tracker.ts` with `SloTracker`: loads SLI definitions from DB, computes compliance for each SLI, persists measurements to `sliMeasurements`, returns compliance status.
- [ ] Implement `packages/ops/src/slo/budget.ts` with `ErrorBudgetCalculator`: accepts SLO target + current downtime → computes budget consumed %, burn rate. Supports `SLO_ERROR_BUDGET_ALERT_THRESHOLDS` env var for alerting at configured points.
- [ ] Run 2.3.2 tests — must pass (GREEN).
- **Files:** `packages/ops/src/slo/tracker.ts`, `packages/ops/src/slo/budget.ts`
- **Estimated lines:** ~180
- **Acceptance:** Budget tests pass. Burn rate computed correctly.

<!-- sdd-owner: implementation -->

#### Task 2.3.6 — GREEN: Seed 5 default SLI definitions

- [ ] Create a migration or seed script that inserts the 5 default SLI definitions: API availability (99.9%), API latency P95 (<500ms), Data Engine availability (99.9%), AI swarm availability (99.5%), Health check pass rate (99.9%).
- **Files:** Seed file or migration
- **Estimated lines:** ~40
- **Acceptance:** SLI definitions exist in DB after migration.

<!-- sdd-owner: implementation -->

#### Task 2.3.7 — GREEN: Implement SLO dashboard queries + API

- [ ] Implement `packages/ops/src/dashboard/queries/slo.ts` with `getSloCompliance()`: returns each SLI's compliance for 7d, 30d, 90d windows, current error budget %, burn rate.
- [ ] Add `GET /api/dashboard/ops/slo` route to ops-dashboard routes.
- [ ] Implement `apps/web/src/features/ops-dashboard/pages/SloDashboard.tsx`: compliance table with per-SLI rows, red highlighting for SLIs below target, burn rate chart.
- **Files:** `packages/ops/src/dashboard/queries/slo.ts`, ops-dashboard routes (extend), `apps/web/src/features/ops-dashboard/pages/SloDashboard.tsx`
- **Estimated lines:** ~150
- **Acceptance:** SLO dashboard renders with computed compliance data.

<!-- sdd-owner: implementation -->

#### Task 2.3.8 — GREEN: Wire SLI measurement cron + budget alerts

- [ ] In `app-core.ts`, start a daily cron that runs `SloTracker.computeAll()` and persists measurements.
- [ ] Add budget consumption alert rule: when error budget consumption crosses a configured threshold (50%, 80%, 100%), fire a WARNING (50%) or CRITICAL (80%, 100%) alert through the existing alert engine.
- **Files:** `apps/api/src/app-core.ts`, optionally a new alert rule
- **Estimated lines:** ~50
- **Acceptance:** Daily SLI measurements appear in DB. Budget alerts fire at thresholds.

<!-- sdd-owner: implementation -->

#### Task 2.3.9 — Verify PR 2.3

- [ ] Run `bun run typecheck`.
- [ ] Run `bun run test` in `packages/ops/src/slo/`.
- **Estimated lines:** 0
- **Acceptance:** PR 2.3 ready for review.

<!-- sdd-owner: parent -->

---

### PR 2.4: Post-Mortem Automation + Incident Lifecycle

**Goal:** `incidents`, `incidentEvents`, `postMortems`, `postMortemActions` DB tables, incident API, post-mortem template, auto-timeline generator, action item tracker.

**Dependencies:** PR 2.1 (runbook engine — incidents link to runbooks), PR 1.4 (alert engine — incidents link to alerts).

---

#### Task 2.4.1 — Write RED: Incident lifecycle tests

- [ ] Write vitest test at `packages/ops/src/postmortem/__tests__/incident.test.ts`: (a) incident created with severity, status=OPEN, (b) transition: OPEN → INVESTIGATING → MITIGATING → RESOLVED → CLOSED, (c) invalid transition rejected, (d) resolution sets `resolvedAt` and computes `durationSeconds`, (e) responders array stored.
- **Files:** `packages/ops/src/postmortem/__tests__/incident.test.ts`
- **Estimated lines:** ~70
- **Acceptance:** Test fails (RED).

<!-- sdd-owner: implementation -->

#### Task 2.4.2 — Write RED: Post-mortem timeline auto-generation tests

- [ ] Write vitest test at `packages/ops/src/postmortem/__tests__/timeline.test.ts`: provide correlated alert, deploy, and health check events → assert generated timeline has entries in chronological order, each with `timestamp`, `eventType`, `source`, `description`. Assert manual events can be merged in correct order.
- **Files:** `packages/ops/src/postmortem/__tests__/timeline.test.ts`
- **Estimated lines:** ~80
- **Acceptance:** Test fails (RED).

<!-- sdd-owner: implementation -->

#### Task 2.4.3 — Write RED: Post-mortem template tests

- [ ] Write vitest test at `packages/ops/src/postmortem/__tests__/template.test.ts`: given incident data + timeline + root cause → generated markdown has sections: metadata, timeline, root cause, impact assessment, action items. Assert action items are extracted as structured `postMortemActions` records.
- **Files:** `packages/ops/src/postmortem/__tests__/template.test.ts`
- **Estimated lines:** ~60
- **Acceptance:** Test fails (RED).

<!-- sdd-owner: implementation -->

#### Task 2.4.4 — GREEN: Create incident + post-mortem DB tables migration

- [ ] Add `incidents`, `incidentEvents`, `postMortems`, `postMortemActions` tables to `packages/persistence/src/schema/ops.ts` per design AD-5.
- [ ] Generate and apply Drizzle migration.
- **Files:** `packages/persistence/src/schema/ops.ts`, migration file
- **Estimated lines:** ~80
- **Acceptance:** Tables exist.

<!-- sdd-owner: implementation -->

#### Task 2.4.5 — GREEN: Implement incident lifecycle API

- [ ] Create `apps/api/src/features/incidents/` feature with CQRS pattern:
  - `routes.ts`: `GET /api/incidents` (paginated, filterable), `GET /api/incidents/:id`, `POST /api/incidents`, `PUT /api/incidents/:id` (status transitions), `POST /api/incidents/:id/resolve`.
  - `application/queries/get-incidents.ts`, `get-incident.ts`
  - `application/commands/create-incident.ts`, `update-incident.ts`, `resolve-incident.ts`
- [ ] Incident creation auto-populates `detectedBy` (`alert` if linked to alert, `manual` otherwise).
- [ ] On resolution, compute `durationSeconds` from `startedAt`.
- [ ] Run 2.4.1 tests — must pass (GREEN).
- **Files:** `apps/api/src/features/incidents/index.ts`, `routes.ts`, `application/queries/*`, `application/commands/*`
- **Estimated lines:** ~200
- **Acceptance:** Incident lifecycle tests pass.

<!-- sdd-owner: implementation -->

#### Task 2.4.6 — GREEN: Implement auto-timeline builder

- [ ] Implement `packages/ops/src/postmortem/timeline.ts` with `buildTimeline(incidentId)`: queries `incidentEvents` table plus correlated data: alert events from `alerts` table matching the incident's time window, deploy events (discover existing deploy log source), health check failures during the window. Merges all events chronologically. Allows manual event insertion.
- [ ] Run 2.4.2 tests — must pass (GREEN).
- **Files:** `packages/ops/src/postmortem/timeline.ts`
- **Estimated lines:** ~120
- **Acceptance:** Timeline auto-generation tests pass.

<!-- sdd-owner: implementation -->

#### Task 2.4.7 — GREEN: Implement post-mortem template + action item tracker

- [ ] Implement `packages/ops/src/postmortem/template.ts` with `generatePostMortem(incidentId)`: fetches incident data, timeline, accepts root cause + impact text. Generates markdown per design spec (metadata, timeline, root cause, impact, action items). Saves to `postmortems/{year}/{month}/{incident-id}-{slug}.md`.
- [ ] Implement `packages/ops/src/postmortem/actions.ts` with `ActionItemTracker`: extracts P0/P1/P2 action items from post-mortem, tracks status (open → in_progress → completed → wont_fix), overdue P0 items generate weekly reminder.
- [ ] Run 2.4.3 tests — must pass (GREEN).
- **Files:** `packages/ops/src/postmortem/template.ts`, `packages/ops/src/postmortem/actions.ts`
- **Estimated lines:** ~180
- **Acceptance:** Post-mortem template tests pass. Generated markdown has all required sections.

<!-- sdd-owner: implementation -->

#### Task 2.4.8 — GREEN: Implement incident management UI

- [ ] Implement `apps/web/src/features/incidents/` with: incident list (filterable by status/severity), incident detail with timeline, create/edit/resolve forms, post-mortem generation trigger, action item tracker view.
- **Files:** `apps/web/src/features/incidents/`
- **Estimated lines:** ~250
- **Acceptance:** UI renders incidents. Post-mortem generation produces markdown file.

<!-- sdd-owner: implementation -->

#### Task 2.4.9 — GREEN: Wire incident creation from alert engine

- [ ] In the alert engine (or a new alert → incident bridge), when a CRITICAL alert fires and is acknowledged, auto-create an incident linked to the alert. Populate `detectedBy: 'alert'` and `alertId`.
- [ ] Add `incidentEvents` entry for the alert firing event.
- **Files:** `packages/ops/src/alerting/engine.ts` (extend)
- **Estimated lines:** ~50
- **Acceptance:** Acknowledging a CRITICAL alert creates an incident with linked alert.

<!-- sdd-owner: implementation -->

#### Task 2.4.10 — Verify PR 2.4

- [ ] Run `bun run typecheck`.
- [ ] Run `bun run test` in `packages/ops/src/postmortem/` and `apps/api/src/features/incidents/`.
- **Estimated lines:** 0
- **Acceptance:** PR 2.4 ready for review. Phase 2 gate met: runbook-guided diagnosis works, on-call rotations advance, SLO dashboard shows compliance, post-mortems auto-generate.

<!-- sdd-owner: parent -->

---

## Phase 3 — Support & Reliability (PRs 3.1–3.3)

### PR 3.1: Support Portal — Status Page + Tenant Dashboard + Tickets

**Goal:** `supportTickets`, `supportTicketComments`, `incident_subscriptions` DB tables, public status page API, tenant dashboard API, ticket CRUD API, support portal UI, incident subscription with email.

**Dependencies:** PR 2.4 (incidents exist for status page), PR 1.3 (dashboard infrastructure for tenant metrics).

---

#### Task 3.1.1 — Write RED: Public status page tests

- [ ] Write vitest test at `apps/api/src/features/support/__tests__/public-status.test.ts`: (a) `GET /api/public/status` returns services status, overall status, active incidents, (b) no auth required, (c) incident history from trailing 90 days returned, (d) all data is aggregate only (no internal metrics, no tenant-specific data).
- **Files:** `apps/api/src/features/support/__tests__/public-status.test.ts`
- **Estimated lines:** ~60
- **Acceptance:** Test fails (RED).

<!-- sdd-owner: implementation -->

#### Task 3.1.2 — Write RED: Tenant dashboard + ticket tests

- [ ] Write vitest tests at `apps/api/src/features/support/__tests__/`:
  - `tenant-dashboard.test.ts`: authenticated tenant with RUC `20123456789` sees only their docs processed, API usage, error rate, support tickets. Assert cross-tenant isolation.
  - `tickets.test.ts`: create ticket → status open, tenant can list own tickets, filter by status, cannot see other tenants' tickets.
- **Files:** `apps/api/src/features/support/__tests__/tenant-dashboard.test.ts`, `tickets.test.ts`
- **Estimated lines:** ~100
- **Acceptance:** Tests fail (RED).

<!-- sdd-owner: implementation -->

#### Task 3.1.3 — GREEN: Create support + subscription DB tables migration

- [ ] Add `supportTickets`, `supportTicketComments`, and an `incidentSubscriptions` table (subscriptions per tenant per service) to `packages/persistence/src/schema/ops.ts`.
- [ ] Generate and apply Drizzle migration.
- **Files:** `packages/persistence/src/schema/ops.ts`, migration file
- **Estimated lines:** ~50
- **Acceptance:** Tables exist.

<!-- sdd-owner: implementation -->

#### Task 3.1.4 — GREEN: Implement public status page API

- [ ] Create `apps/api/src/features/support/public-routes.ts` with `GET /api/public/status`: reads alert/incident data from DB, aggregates into public-friendly format (service status, active incidents with summaries, overall system banner). Cached for 60s. Rate-limited.
- [ ] Run 3.1.1 tests — must pass (GREEN).
- **Files:** `apps/api/src/features/support/public-routes.ts`
- **Estimated lines:** ~80
- **Acceptance:** Public status API returns correct data. No auth. No internal metrics leaked.

<!-- sdd-owner: implementation -->

#### Task 3.1.5 — GREEN: Implement tenant dashboard API

- [ ] Create `apps/api/src/features/support/` with `routes.ts` for tenant dashboard: `GET /api/dashboard/ops/tenant` (authenticated, RUC-scoped). Returns: fiscal documents processed (filtered by RUC), API usage (prom-client metrics filtered by RUC label), error rate, open support tickets.
- [ ] Use existing `companyScopeGuard` middleware for RUC isolation.
- [ ] Run 3.1.2 tenant dashboard tests — must pass (GREEN).
- **Files:** `apps/api/src/features/support/routes.ts`, `application/queries/get-tenant-dashboard.ts`
- **Estimated lines:** ~80
- **Acceptance:** Tenant dashboard tests pass. Cross-tenant isolation verified.

<!-- sdd-owner: implementation -->

#### Task 3.1.6 — GREEN: Implement support ticket API

- [ ] Add ticket routes to `apps/api/src/features/support/routes.ts`: `POST /api/support/tickets`, `GET /api/support/tickets`, `GET /api/support/tickets/:id`, `PUT /api/support/tickets/:id` (status updates, comments). Ticket creation sends confirmation.
- [ ] Add `application/queries/get-tickets.ts`, `application/commands/create-ticket.ts`, `update-ticket.ts`.
- [ ] Run 3.1.2 ticket tests — must pass (GREEN).
- **Files:** `apps/api/src/features/support/routes.ts` (extend), `application/queries/get-tickets.ts`, `application/commands/create-ticket.ts`, `update-ticket.ts`
- **Estimated lines:** ~150
- **Acceptance:** Ticket CRUD works. Tenant isolation enforced.

<!-- sdd-owner: implementation -->

#### Task 3.1.7 — GREEN: Implement incident subscription

- [ ] Add incident subscription routes: `POST /api/support/subscriptions` (tenant subscribes to a service), `GET /api/support/subscriptions`, `DELETE /api/support/subscriptions/:id`.
- [ ] In the alert engine, when a CRITICAL incident is created for a service, query subscribed tenants and send email notifications via existing `@drenyra/infrastructure` email adapter.
- [ ] Send resolution notification when incident is resolved.
- **Files:** `apps/api/src/features/support/routes.ts` (extend), `packages/ops/src/alerting/engine.ts` (extend)
- **Estimated lines:** ~80
- **Acceptance:** Tenant receives email on CRITICAL incident for subscribed service. Resolution email sent on closure.

<!-- sdd-owner: implementation -->

#### Task 3.1.8 — GREEN: Implement support portal UI

- [ ] Implement `apps/web/src/features/support-portal/` with:
  - Public status page (no auth): service status indicators, incident history, maintenance calendar.
  - Tenant dashboard (authenticated): own metrics, support ticket list, ticket creation form, ticket detail with comments, subscription management.
- **Files:** `apps/web/src/features/support-portal/`
- **Estimated lines:** ~300
- **Acceptance:** Public status page renders without auth. Tenant dashboard shows RUC-scoped data.

<!-- sdd-owner: implementation -->

#### Task 3.1.9 — Verify PR 3.1

- [ ] Run `bun run typecheck`.
- [ ] Run `bun run test` in `apps/api/src/features/support/`.
- [ ] Manual smoke: visit public status page, authenticate as tenant, file a ticket, subscribe to incident alerts.
- **Estimated lines:** 0
- **Acceptance:** PR 3.1 ready for review.

<!-- sdd-owner: parent -->

---

### PR 3.2: Disaster Recovery Testing — Scripts + Runner + Dashboard

**Goal:** 4 DR shell scripts, TypeScript DR orchestrator (`runner.ts`), Bun-native cron scheduler, DR dashboard, `drTests` DB table.

**Dependencies:** PR 2.4 (incidents exist — DR failures create P1 incidents). No hard dependency on PR 3.1.

---

#### Task 3.2.1 — Write RED: DR runner tests

- [ ] Write vitest test at `packages/ops/src/dr/__tests__/runner.test.ts`: (a) mock script execution → runner captures output, (b) successful script → status 'passed', metrics recorded, (c) failing script → status 'failed', error recorded, P1 incident created when `failureCreatesIncident: true`, (d) timeout kills script and records failure, (e) run ID generated and unique.
- **Files:** `packages/ops/src/dr/__tests__/runner.test.ts`
- **Estimated lines:** ~80
- **Acceptance:** Test fails (RED).

<!-- sdd-owner: implementation -->

#### Task 3.2.2 — GREEN: Create DR tests DB table migration

- [ ] Add `drTests` table to `packages/persistence/src/schema/ops.ts` per design AD-5.
- [ ] Generate and apply Drizzle migration.
- **Files:** `packages/persistence/src/schema/ops.ts`, migration file
- **Estimated lines:** ~30
- **Acceptance:** Table exists.

<!-- sdd-owner: implementation -->

#### Task 3.2.3 — GREEN: Implement DR runner

- [ ] Implement `packages/ops/src/dr/runner.ts` with `runDrScenario(scenario)`: creates run ID, inserts `running` record, executes shell script via `Bun.spawn` with timeout, parses output, updates record with result + metrics + duration. On failure, calls `createP1Incident()` if `failureCreatesIncident` is true.
- [ ] Implement `packages/ops/src/dr/scheduler.ts` with Bun-native cron: reads `DR_SCHEDULE_DB_RESTORE` and `DR_SCHEDULE_FULL_STACK` env vars, schedules scenario execution. Supports manual trigger via API.
- [ ] Run 3.2.1 tests — must pass (GREEN).
- **Files:** `packages/ops/src/dr/runner.ts`, `packages/ops/src/dr/scheduler.ts`
- **Estimated lines:** ~150
- **Acceptance:** DR runner tests pass.

<!-- sdd-owner: implementation -->

#### Task 3.2.4 — GREEN: Create 4 DR test shell scripts

- [ ] Create `scripts/ops/dr/db-restore.sh`: restores latest production backup to sandbox DB (`DR_SANDBOX_DB_URL`), runs row count + checksum validation on critical tables, outputs JSON result with metrics.
- [ ] Create `scripts/ops/dr/service-failover.sh`: stops API in staging, verifies health check routing redirects, restores API, validates operational within 5 minutes.
- [ ] Create `scripts/ops/dr/config-recovery.sh`: backs up current config/secrets, restores from backup, validates config integrity.
- [ ] Create `scripts/ops/dr/full-stack-recovery.sh`: orchestrates full restore to staging: DB restore + service restart + health validation + smoke test.
- [ ] Create `scripts/ops/dr/report.sh`: helper that posts results to the ops API for DB recording.
- **Files:** `scripts/ops/dr/db-restore.sh`, `service-failover.sh`, `config-recovery.sh`, `full-stack-recovery.sh`, `report.sh`
- **Estimated lines:** ~200
- **Acceptance:** Each script runs independently and outputs structured JSON. Manual test: `bash scripts/ops/dr/db-restore.sh` succeeds.

<!-- sdd-owner: implementation -->

#### Task 3.2.5 — GREEN: Implement DR dashboard + API

- [ ] Add `GET /api/dashboard/ops/dr` route returning: last run date per scenario, last result (pass/fail), pass rate over 90 days, next scheduled run.
- [ ] Implement `apps/web/src/features/ops-dashboard/pages/DrDashboard.tsx` (or extend existing ops dashboard) with DR test history table and pass/fail visualization.
- **Files:** `apps/api/src/features/dashboard/api/ops-dashboard.routes.ts` (extend), UI files
- **Estimated lines:** ~100
- **Acceptance:** DR dashboard renders test history. Next scheduled run visible.

<!-- sdd-owner: implementation -->

#### Task 3.2.6 — GREEN: Wire DR scheduler into app-core + manual trigger API

- [ ] Start the DR scheduler cron in `app-core.ts`.
- [ ] Add `POST /api/ops/dr/trigger` admin endpoint for manual DR scenario execution.
- **Files:** `apps/api/src/app-core.ts`, new route
- **Estimated lines:** ~40
- **Acceptance:** Scheduler runs. Manual trigger works and records results.

<!-- sdd-owner: implementation -->

#### Task 3.2.7 — TRIANGULATE: DR runner edge case tests

- [ ] Add tests: (a) script that hangs infinitely → killed by timeout, (b) script that outputs invalid JSON → error recorded but not a crash, (c) concurrent scenario run prevented (same scenario, overlapping runs), (d) sandbox DB unavailable → graceful failure, no P1 incident (environment issue, not code issue).
- **Files:** `packages/ops/src/dr/__tests__/runner.test.ts`
- **Estimated lines:** ~60
- **Acceptance:** All edge cases handled gracefully.

<!-- sdd-owner: implementation -->

#### Task 3.2.8 — Verify PR 3.2

- [ ] Run `bun run typecheck`.
- [ ] Run `bun run test` in `packages/ops/src/dr/`.
- [ ] Manual smoke: run `db-restore.sh`, verify result in DR dashboard.
- **Estimated lines:** 0
- **Acceptance:** PR 3.2 ready for review.

<!-- sdd-owner: parent -->

---

### PR 3.3: Feature Flags — Store, Evaluator, Admin API + UI

**Goal:** `featureFlags` + `featureFlagAudit` DB tables, in-memory cached store, percentage + tenant-targeted evaluation, CRUD admin API, audit log, flag expiry checker, admin UI.

**Dependencies:** None hard (self-contained feature flag system). Soft dependency on PR 1.3 (dashboard for expiry warnings).

---

#### Task 3.3.1 — Write RED: Feature flag evaluator tests

- [ ] Write vitest test at `packages/ops/src/feature-flags/__tests__/evaluator.test.ts`: (a) flag enabled → evaluates `true` with reason 'enabled', (b) flag disabled → `false` with reason 'disabled', (c) 50% rollout + userId hash → consistent assignment for same user, (d) tenant-targeted flag with matching RUC → `true`, non-matching → `false`, (e) expired flag → always `false` with reason 'expired', (f) flag not found → `false` with reason 'not_found'.
- **Files:** `packages/ops/src/feature-flags/__tests__/evaluator.test.ts`
- **Estimated lines:** ~100
- **Acceptance:** Test fails (RED).

<!-- sdd-owner: implementation -->

#### Task 3.3.2 — Write RED: Feature flag store + cache tests

- [ ] Write vitest test at `packages/ops/src/feature-flags/__tests__/store.test.ts`: (a) `getFlag(name)` returns flag from DB, (b) second call within 30s hits cache (no DB call), (c) after 30s TTL, cache miss → DB query again, (d) `refreshCache()` forces reload, (e) `setFlag(name, data)` updates DB + invalidates cache.
- **Files:** `packages/ops/src/feature-flags/__tests__/store.test.ts`
- **Estimated lines:** ~70
- **Acceptance:** Test fails (RED).

<!-- sdd-owner: implementation -->

#### Task 3.3.3 — GREEN: Create feature flag DB tables migration

- [ ] Add `featureFlags` and `featureFlagAudit` tables to `packages/persistence/src/schema/ops.ts` per design AD-5.
- [ ] `featureFlagAudit` is INSERT-only (no UPDATE/DELETE enforcement at app level).
- [ ] Generate and apply Drizzle migration.
- **Files:** `packages/persistence/src/schema/ops.ts`, migration file
- **Estimated lines:** ~40
- **Acceptance:** Tables exist. Audit table rejects UPDATE/DELETE at app layer.

<!-- sdd-owner: implementation -->

#### Task 3.3.4 — GREEN: Implement feature flag store with cache

- [ ] Implement `packages/ops/src/feature-flags/store.ts` with `FeatureFlagStore`: in-memory `Map<string, FeatureFlag>` cache with TTL from `FEATURE_FLAG_CACHE_TTL_SECONDS` (default 30s). `getFlag(name)` checks cache → DB fallback. `setFlag(name, data)` writes DB + writes audit log + invalidates cache entry. `refreshCache()` loads all flags from DB.
- [ ] Run 3.3.2 tests — must pass (GREEN).
- **Files:** `packages/ops/src/feature-flags/store.ts`
- **Estimated lines:** ~120
- **Acceptance:** Store tests pass. Cache hit/miss behavior correct.

<!-- sdd-owner: implementation -->

#### Task 3.3.5 — GREEN: Implement feature flag evaluator

- [ ] Implement `packages/ops/src/feature-flags/evaluator.ts` with `FeatureFlagEvaluator` class: `evaluate(name, ctx?)` → `FlagEvaluationResult`. Logic: check expiry → false, check `enabled` → if false return 'disabled', check `targetRucs` → if ctx.ruc in list return 'tenant_targeted', check `rolloutPercentage` → hash userId/ruc modulo 100.
- [ ] Implement `evaluateSync()` using the in-memory cache for zero-latency evaluations.
- [ ] Implement sticky rollout: `hash(userId || ruc) % 100 < rolloutPercentage` ensures consistent assignment.
- [ ] Run 3.3.1 tests — must pass (GREEN).
- **Files:** `packages/ops/src/feature-flags/evaluator.ts`
- **Estimated lines:** ~100
- **Acceptance:** Evaluator tests pass. All 5 evaluation reasons verified.

<!-- sdd-owner: implementation -->

#### Task 3.3.6 — GREEN: Implement feature flag admin API

- [ ] Create `apps/api/src/features/ops/feature-flag-routes.ts` with:
  - `GET /api/ops/feature-flags` — list all, with status and expiry warnings
  - `GET /api/ops/feature-flags/:name` — single flag detail
  - `PUT /api/ops/feature-flags` — create or update (upsert)
  - `DELETE /api/ops/feature-flags/:name` — soft delete (disables + marks)
- [ ] Every mutation writes to `featureFlagAudit` with operator identity, old/new values, and optional reason.
- [ ] Add admin auth guard.
- **Files:** `apps/api/src/features/ops/feature-flag-routes.ts`, `application/queries/get-feature-flags.ts`, `application/commands/create-feature-flag.ts`, `update-feature-flag.ts`, `delete-feature-flag.ts`
- **Estimated lines:** ~200
- **Acceptance:** CRUD works. Audit entries created on every mutation.

<!-- sdd-owner: implementation -->

#### Task 3.3.7 — GREEN: Implement flag expiry checker

- [ ] Implement `packages/ops/src/feature-flags/health.ts` with `checkFlagExpiry()`: runs daily, identifies flags >30 days without modification → emits WARNING via existing alert engine (INFO severity). Flags with explicit `expiresAt` in the past → force-evaluate as false.
- [ ] Wire the daily check cron in `app-core.ts`.
- **Files:** `packages/ops/src/feature-flags/health.ts`
- **Estimated lines:** ~60
- **Acceptance:** Expired flag evaluates to false. Stale flag surfaced in warnings.

<!-- sdd-owner: implementation -->

#### Task 3.3.8 — GREEN: Implement feature flag management UI

- [ ] Implement `apps/web/src/features/feature-flags/` with: flag list table (name, status, rollout %, expiry, last modified), create/edit form with target RUC multi-select + percentage slider, audit log viewer (read-only), kill-switch toggle.
- **Files:** `apps/web/src/features/feature-flags/`
- **Estimated lines:** ~200
- **Acceptance:** Admin can create/toggle/edit/delete flags from UI. Audit log visible.

<!-- sdd-owner: implementation -->

#### Task 3.3.9 — TRIANGULATE: Feature flag integration test

- [ ] Write integration test at `packages/ops/src/feature-flags/__tests__/integration.test.ts`: (a) create flag via store, (b) evaluateSync returns correct value (cached), (c) update flag via store, (d) after cache TTL or manual refresh, evaluateSync returns new value, (e) audit log has both create and update entries.
- **Files:** `packages/ops/src/feature-flags/__tests__/integration.test.ts`
- **Estimated lines:** ~60
- **Acceptance:** Full lifecycle test passes without flakiness.

<!-- sdd-owner: implementation -->

#### Task 3.3.10 — REFACTOR: Add feature flag usage example + documentation

- [ ] Add a usage example in the ops package README or a code comment showing: `const ff = new FeatureFlagEvaluator(store); if (await ff.evaluate('fiscal-batch-v2', { ruc: tenantRuc })) { ... }`.
- [ ] Document the hard limit of 50 active flags and the 30-day expiry policy.
- **Estimated lines:** ~30
- **Acceptance:** Example compiles. Limit documented.

<!-- sdd-owner: implementation -->

#### Task 3.3.11 — Verify PR 3.3

- [ ] Run `bun run typecheck`.
- [ ] Run `bun run test` in `packages/ops/src/feature-flags/`.
- [ ] Manual smoke: create a flag, toggle it, verify evaluation changes within cache TTL, check audit log.
- **Estimated lines:** 0
- **Acceptance:** PR 3.3 ready for review. Phase 3 gate met: public status page live, DR tests running, feature flags operational.

<!-- sdd-owner: parent -->

---

## Cross-Cutting Verification (Final Gate)

### Task FINAL — Cross-cutting acceptance criteria validation

- [ ] AC-1 (End-to-end trace): Verify a fiscal report request from Web → API → Data Engine → SUNAT produces a complete distributed trace in the OTel collector with shared `traceId`.
- [ ] AC-2 (Alert from degradation): Simulate DB pool at ≥90% utilization, verify Discord alert within 2 minutes.
- [ ] AC-3 (Runbook-guided mitigation): Execute "API high error rate" runbook from alert acknowledgment to mitigation step completion.
- [ ] AC-4 (SLO dashboard + error budget): Verify all 5 SLIs show compliance on SLO dashboard. Simulate budget consumption at 50% → verify WARNING alert.
- [ ] AC-5 (Auto-generated post-mortem): Create a test incident → generate post-mortem → verify timeline has ≤5 min manual cleanup.
- [ ] AC-6 (Weekly DR test): Trigger DB restore DR test manually → verify result published to DR dashboard. Simulate failure → verify P1 incident within 15 minutes.
- [ ] AC-7 (Kill-switch): Create a flag, enable it, then disable it via admin panel → verify evaluation returns false within 60 seconds.
- [ ] AC-8 (Tenant self-service): Visit public status page (no auth) → see service status. Authenticate as tenant → view own metrics. File a support ticket → verify it appears in ticket list.
- **Estimated lines:** 0 (verification only)
- **Acceptance:** All 8 cross-cutting acceptance criteria from spec are met.

<!-- sdd-owner: parent -->

---

## Dependency Order Summary

```
PR1.1 (OTel SDK + middleware)
  └─► PR1.2 (business spans)
  └─► PR1.3 (ops dashboards)
        └─► PR1.4 (alerting engine)
              ├─► PR2.1 (runbooks)
              │     └─► PR2.4 (post-mortem + incidents)
              ├─► PR2.2 (on-call)
              │     └─► PR2.4
              ├─► PR2.3 (SLI/SLO)
              │     └─► PR2.4
              └─► PR3.1 (support portal — needs incidents)
                    └─► PR3.2 (DR testing — needs incidents)
PR3.3 (feature flags) — independent, can be done at any point
```

PR3.3 has no hard dependencies and can be developed in parallel with Phase 2 if needed.

---

## Summary Statistics

| Phase                           | PRs         | Tasks  | Estimated lines |
| ------------------------------- | ----------- | ------ | --------------- |
| Phase 1 — Ops Foundation        | 4 (1.1–1.4) | 36     | ~3,100          |
| Phase 2 — Incident Response     | 4 (2.1–2.4) | 24     | ~2,400          |
| Phase 3 — Support & Reliability | 3 (3.1–3.3) | 21     | ~2,000          |
| Cross-cutting                   | 1 (FINAL)   | 1      | 0               |
| **Total**                       | **11 + 1**  | **82** | **~7,500**      |

> Note: Line estimates include test files, making them higher than the proposal's code-only estimate (~4,550). With TDD, approximately 40% of lines are test code.
