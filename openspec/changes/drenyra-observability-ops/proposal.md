# SDD Proposal: Observability & Operations — Production Reliability

**Created:** 2026-07-23
**Status:** Proposal
**Plan SDD:** New — operations layer atop B3 Observability foundation
**Predecessor:** B3 Observability & Operations (implemented — CAP-FOUND-07)
**Dependency:** B3 outputs (structured logging, global error handler, health checks, request metrics, request-timing middleware)

---

## Executive Summary

Drenyra has observability foundations in place: structured logging (Pino), health checks, error handling, and request metrics. What's missing is the **operations layer** — the ability to trace a request across services, dashboards that show system health at a glance, alerts that fire before users notice, on-call rotations that route incidents to the right person, SLI/SLO tracking that quantifies reliability promises, and automation that turns incidents into learnings.

This proposal extends CAP-FOUND-07 observability into three operational phases: **Ops Foundation** (APM tracing, dashboards, alerting), **Incident Response** (runbooks, on-call, SLI/SLO, post-mortems), and **Support & Reliability** (support portal, DR testing, feature flags).

**Target:** "Every request is traceable end-to-end. Every degraded service fires an alert. Every incident has a timeline, a root cause, and a prevention."

---

## Current State

CAP-FOUND-07 delivered a solid observability baseline:

| Component                            | Status         | Details                                        |
| ------------------------------------ | -------------- | ---------------------------------------------- |
| API health checks                    | ✅ Implemented | 12 files, 5 tests — ready/live/deps endpoints  |
| Frontend telemetry                   | ✅ Implemented | 5 files — client-side error capture + metrics  |
| AI-swarm observability               | ✅ Implemented | Metrics, latency, cost tracking per swarm call |
| WEB observability                    | ✅ Implemented | 49 files, 0 tests — web-specific monitoring    |
| Infrastructure observability package | ✅ Implemented | Shared observability primitives                |
| Support ticket system                | ✅ Implemented | Basic ticket CRUD                              |

**What's missing — the operations gap:**

| Gap                           | Impact                                                                                                                |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **APM / distributed tracing** | Cannot trace a request from web → API → data-engine → AI. Debugging cross-service failures is manual log correlation. |
| **Operations dashboards**     | No real-time visibility. Teams have no single pane of glass for system health.                                        |
| **Alerting with thresholds**  | No automated alerting. Degradations are discovered by users or manual checks.                                         |
| **On-call schedules**         | No rotation. Incidents have no clear owner after hours.                                                               |
| **SLI/SLO tracking**          | No reliability measurement. Cannot answer "are we meeting our uptime promise?"                                        |
| **Post-mortem automation**    | Incidents are resolved ad-hoc. No structured root cause analysis, no prevention tracking.                             |
| **DR testing**                | No disaster recovery drills. Recovery procedures are untested assumptions.                                            |
| **Support portal**            | No self-service status page or support interface for tenants.                                                         |
| **Feature flags**             | No operational toggles. Cannot dark-launch, canary, or kill-switch features without deploy.                           |

---

## Problem

1. **No end-to-end visibility** — When a fiscal report takes 30 seconds, we can't pinpoint whether the bottleneck is in the API, the data engine, or an external SUNAT call. Engineers grep logs across services manually.

2. **No proactive detection** — The first sign of a degraded service is a user complaint. There's no "DB connection pool at 95% → alert on-call" pipeline.

3. **No operational accountability** — Incidents lack ownership timelines. "Who was on-call when the API went down last Tuesday?" has no systematic answer.

4. **No reliability quantification** — Drenyra promises fiscal correctness but can't measure or communicate uptime SLAs to tenants.

5. **No incident learning loop** — The same class of incident can repeat because there's no structured post-mortem → action-item → verification cycle.

6. **No operational safety net** — Feature flags don't exist. A bad deploy must be rolled back via git, not toggled off instantly.

---

## Solution

### Phase 1 — Ops Foundation: APM, Dashboards, Alerting

**Goal:** See everything, know when it breaks.

#### 1.1 Distributed Tracing (OpenTelemetry)

Instrument all services with OpenTelemetry SDKs. Every inbound request gets a trace context propagated across service boundaries.

```
Web (React)                 API (Elysia)              Data Engine (FastAPI)
    │                           │                           │
    │  traceparent header       │  traceparent header       │
    ├──────────────────────────►├──────────────────────────►│
    │                           │                           │
    │◄──────────────────────────┤◄──────────────────────────┤
    │                           │                           │
    ▼                           ▼                           ▼
  OTel JS SDK              OTel JS SDK               OTel Python SDK
    │                           │                           │
    └───────────────────────────┼───────────────────────────┘
                                │
                                ▼
                        OTel Collector
                                │
                                ▼
                     Jaeger / Tempo (trace store)
```

**Scope:**

- `@opentelemetry/api` + `@opentelemetry/sdk-node` in API
- `@opentelemetry/exporter-trace-otlp-http` for export
- Auto-instrumentation for HTTP, DB (Drizzle), fetch
- Manual spans for critical paths: fiscal calculations, SUNAT calls, AI completions
- Trace sampling: 100% in dev/staging, adaptive (10% base + 100% errors) in production
- Correlation: trace IDs exposed in API error responses and frontend error captures

#### 1.2 Operations Dashboards

A real-time operations dashboard surfaced in the admin panel and a standalone status page.

**Dashboard views:**

- **System health:** service status (API, data-engine, DB, AI gateway, SUNAT), uptime %, current incident count
- **Request analytics:** RPM per service, latency percentiles (p50/p95/p99), error rate by endpoint
- **Resource utilization:** CPU/memory per service, DB connection pool, AI token consumption
- **Business metrics:** active companies, fiscal documents processed/hour, AI swarm cost/day
- **Alert timeline:** recent alerts, acknowledged vs. unacknowledged

**Tech:** Grafana (self-hosted) or a lightweight admin-panel metrics UI backed by the existing metrics collector, with OpenTelemetry metrics export to Prometheus-compatible storage.

#### 1.3 Alerting Engine

Rule-based alerting with severity levels and notification channels.

**Alert rules (initial set):**

| Alert                         | Condition                           | Severity | Channel           |
| ----------------------------- | ----------------------------------- | -------- | ----------------- |
| API error rate spike          | >5% errors over 5min                | CRITICAL | PagerDuty/Discord |
| DB connection pool exhaustion | >90% utilization for 2min           | CRITICAL | PagerDuty/Discord |
| P95 latency degradation       | >2x baseline for 10min              | WARNING  | Discord           |
| Health check failure          | Any check fails 3 consecutive times | CRITICAL | PagerDuty/Discord |
| AI swarm cost anomaly         | >2x daily average                   | WARNING  | Discord           |
| Certificate expiry            | <30 days                            | WARNING  | Discord/Email     |

**Alerting pipeline:**

```
Metrics → Alert Rule Evaluator → Severity Classifier → Notification Router
                                                          │
                                     ┌────────────────────┼────────────────────┐
                                     ▼                    ▼                    ▼
                                 PagerDuty            Discord            Email
                                 (on-call)           (team channel)     (weekly digest)
```

**Non-goals (Phase 1):** No ML-based anomaly detection. No dynamic thresholds. No alert correlation/de-duplication beyond simple grouping.

---

### Phase 2 — Incident Response: Runbooks, On-Call, SLI/SLO

**Goal:** Respond fast, learn faster.

#### 2.1 Runbook Automation

Structured runbooks for common incident classes, stored as code in the repo.

```yaml
# runbooks/api-high-error-rate.yaml
incident: api-high-error-rate
severity: critical
diagnosis:
  - step: Check health endpoint
    command: curl https://api.drenyra.com/health/deps
    expected: All dependencies healthy
  - step: Check recent deploys
    command: gh run list --workflow=deploy-api --limit=5
  - step: Check DB connection pool
    query: SELECT count(*) FROM pg_stat_activity WHERE state = 'active'
mitigation:
  - action: Restart API service
    command: flyctl apps restart drenyra-api
  - action: Rollback last deploy
    command: gh run rerun --failed
escalation:
  after: 15min
  to: engineering-lead
```

Runbook engine: a simple CLI or admin-panel interface that guides the on-call engineer through diagnosis → mitigation → escalation.

#### 2.2 On-Call Management

On-call rotation with schedules, escalation policies, and incident ownership.

**Schema:**

```typescript
interface OnCallRotation {
  id: string
  name: string // "Engineering Primary"
  members: string[] // Discord/github user IDs
  schedule: 'weekly' | 'biweekly' | 'follow-the-sun'
  handoffDay: 'monday' | 'monday+thursday'
  escalationPolicy: {
    level1: { timeout: '5min'; target: 'on-call-primary' }
    level2: { timeout: '15min'; target: 'engineering-lead' }
    level3: { timeout: '30min'; target: 'cto' }
  }
}
```

**Integration:** Discord bot for on-call notifications and handoffs. PagerDuty-compatible webhook for external alerting integration. The system is self-contained (no external PagerDuty dependency) but exportable.

#### 2.3 SLI/SLO Tracking

Define, measure, and report on Service Level Indicators and Objectives.

**Initial SLIs:**

| SLI                      | Definition                             | SLO Target     |
| ------------------------ | -------------------------------------- | -------------- |
| API availability         | % of successful (non-5xx) responses    | 99.9% monthly  |
| API latency              | P95 response time for fiscal endpoints | <500ms         |
| Data engine availability | % of successful computation jobs       | 99.5% monthly  |
| AI swarm availability    | % of successful completions            | 99% monthly    |
| Health check pass rate   | % of passing health checks             | 99.99% monthly |

**SLO tracking:**

- Error budget calculation and burn rate visualization
- SLO dashboard showing compliance over trailing 7d/30d/90d
- Error budget exhaustion alerts (budget 50% consumed, 80% consumed, exhausted)

#### 2.4 Post-Mortem Automation

Structured post-mortem template and automated timeline generation from incident data.

**Post-mortem template (markdown in repo):**

```markdown
# Incident #2026-073: API degraded — DB connection pool exhaustion

- **Date:** 2026-07-23 14:32 UTC
- **Duration:** 23 minutes
- **Severity:** CRITICAL — API returning 503 for all endpoints
- **Detected by:** Discord alert (DB pool >90%)
- **Responders:** @el-gentleman (primary on-call)

## Timeline

| Time (UTC) | Event                                                      |
| ---------- | ---------------------------------------------------------- |
| 14:30      | DB pool reaches 85%                                        |
| 14:32      | Alert fires: "DB pool >90%"                                |
| 14:34      | On-call acknowledges                                       |
| 14:38      | Root cause identified: connection leak in fiscal-batch job |
| 14:45      | Mitigation: restarted API, pool recovered                  |
| 14:55      | Service fully restored                                     |

## Root Cause

...

## Action Items

- [ ] Fix connection leak in fiscal-batch (P0, owner: @dev)
- [ ] Add connection-pool metrics to dashboard (P1)
- [ ] Add pool-exhaustion runbook (P2)
```

Automation generates the timeline from alert logs, deploy logs, and health check data. Engineer fills in root cause and action items.

---

### Phase 3 — Support & Reliability: Portal, DR, Feature Flags

**Goal:** Empower tenants, survive disasters, ship safely.

#### 3.1 Support Portal

A self-service status page and support interface for Drenyra tenants.

**Features:**

- **Public status page:** current system status, incident history, upcoming maintenance
- **Tenant dashboard:** tenant-specific metrics (documents processed, API usage, error rate for their RUC)
- **Support ticket interface:** file tickets, track status, view resolution timeline
- **Incident subscription:** tenants subscribe to incident updates for their affected services

**Tech:** React component in admin panel + standalone status page (statically generated from incident data).

#### 3.2 Disaster Recovery Testing

Automated DR drills that validate backup restoration and service recovery procedures.

**DR test scenarios:**

1. **DB restore test:** Restore latest backup to a sandbox, validate data integrity
2. **Service failover test:** Simulate API failure, validate health check routing
3. **Config recovery test:** Restore configuration from secrets manager backup
4. **Full stack recovery:** End-to-end restore to a staging environment

**Schedule:** DB restore weekly, full stack monthly. Results published to DR dashboard. Any failure generates a P1 incident.

#### 3.3 Feature Flags

Operational feature toggles for safe deployments and dark launches.

**Capabilities:**

- Boolean and percentage-based rollouts
- Kill-switch toggles for emergency disable
- Tenant-targeted flags (enable beta feature for specific RUCs)
- Audit log of flag changes
- Integration with the existing infrastructure package

**Tech:** Self-hosted or lightweight flag store (DB table + in-memory cache) vs. LaunchDarkly integration. Decision deferred to design phase based on cost/complexity tradeoff.

---

## Architecture

```text
packages/
├── infrastructure/
│   └── observability/           ← CAP-FOUND-07 (existing)
│       ├── logger.ts
│       ├── metrics.ts
│       └── health.ts
│
├── ops/                          ← NEW — operations package
│   ├── tracing/
│   │   ├── sdk.ts               ← OpenTelemetry setup + export
│   │   ├── instrumentations/    ← Auto-instrumentation configs
│   │   │   ├── http.ts
│   │   │   ├── db.ts
│   │   │   └── ai.ts
│   │   └── spans/               ← Manual span definitions
│   │       ├── fiscal.ts
│   │       └── sunat.ts
│   │
│   ├── alerting/
│   │   ├── engine.ts            ← Rule evaluator
│   │   ├── rules/               ← Alert rule definitions
│   │   ├── notifiers/           ← Notification channels
│   │   │   ├── discord.ts
│   │   │   ├── email.ts
│   │   │   └── pagerduty.ts
│   │   └── router.ts            ← Severity → channel routing
│   │
│   ├── oncall/
│   │   ├── rotation.ts          ← Schedule management
│   │   ├── escalation.ts        ← Escalation policy engine
│   │   └── handoff.ts           ← Shift handoff protocol
│   │
│   ├── slo/
│   │   ├── indicators.ts        ← SLI definitions
│   │   ├── tracker.ts           ← SLO compliance calculation
│   │   └── budget.ts            ← Error budget + burn rate
│   │
│   ├── postmortem/
│   │   ├── template.ts          ← Post-mortem generator
│   │   ├── timeline.ts          ← Automated timeline builder
│   │   └── actions.ts           ← Action item tracker
│   │
│   ├── runbooks/
│   │   └── engine.ts            ← Runbook executor
│   │
│   ├── dr/
│   │   ├── scenarios/           ← DR test definitions
│   │   ├── runner.ts            ← DR test orchestrator
│   │   └── reporter.ts          ← DR test results
│   │
│   ├── feature-flags/
│   │   ├── store.ts             ← Flag storage + cache
│   │   ├── evaluator.ts         ← Flag evaluation engine
│   │   └── admin.ts             ← Flag management API
│   │
│   └── dashboard/
│       ├── queries/             ← Dashboard data queries
│       └── components/          ← Dashboard UI components

apps/
├── api/
│   └── src/
│       ├── features/
│       │   ├── alerts/          ← Alert management API
│       │   ├── oncall/          ← On-call management API
│       │   ├── incidents/       ← Incident lifecycle API
│       │   ├── slo/             ← SLO data API
│       │   └── support/         ← Support portal API
│       └── shared/
│           └── tracing.ts       ← Trace context injection
│
├── web/
│   └── src/
│       ├── features/
│       │   ├── ops-dashboard/   ← Operations dashboard UI
│       │   ├── alerts/          ← Alert management UI
│       │   ├── incidents/       ← Incident management UI
│       │   ├── oncall/          ← On-call calendar UI
│       │   ├── support-portal/  ← Tenant support UI
│       │   └── feature-flags/   ← Flag management UI
│       └── shared/
│           └── tracing.ts       ← Frontend trace context

runbooks/                         ← Runbook YAML definitions
├── api-high-error-rate.yaml
├── db-pool-exhaustion.yaml
├── ai-swarm-degraded.yaml
└── sunat-unreachable.yaml

postmortems/                      ← Post-mortem artifacts
└── 2026/
    └── 07/
        └── 073-api-db-pool.md
```

---

## Dependencies

| Dependency                      | Relationship                                                                                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B3 Observability (CAP-FOUND-07) | **Hard dependency.** Ops package extends the existing observability primitives. Tracing enriches existing logs with trace IDs. Alerting consumes existing metrics. |
| B1 API Contracts                | Error responses already carry `requestId` — extend to carry `traceId` for correlation.                                                                             |
| B4 Security/Deploy              | Alerting must work with rate limiting. Feature flags must respect RLS.                                                                                             |
| P6 Package Health Audit         | New `@drenyra/ops` package must follow monorepo package conventions.                                                                                               |

---

## Delivery

**Strategy:** auto-chain — 3 phases, chained PRs within each phase.

### Phase 1 — Ops Foundation

| PR    | Scope                                                                           | Files | Lines |
| ----- | ------------------------------------------------------------------------------- | ----- | ----- |
| PR1.1 | OpenTelemetry SDK setup, auto-instrumentation, trace export                     | 8-12  | ~400  |
| PR1.2 | Manual spans for critical paths (fiscal, SUNAT, AI) + trace context propagation | 6-10  | ~300  |
| PR1.3 | Operations dashboards — queries + UI components                                 | 10-15 | ~500  |
| PR1.4 | Alerting engine — rule evaluator, notifiers, initial rule set                   | 8-12  | ~400  |

**Phase 1 total:** ~1,600 lines · 32-49 files · 4 PRs

### Phase 2 — Incident Response

| PR    | Scope                                                  | Files | Lines |
| ----- | ------------------------------------------------------ | ----- | ----- |
| PR2.1 | Runbook engine + initial runbooks (4-6 scenarios)      | 8-12  | ~350  |
| PR2.2 | On-call management (rotation, escalation, Discord bot) | 10-15 | ~500  |
| PR2.3 | SLI/SLO tracking + error budget                        | 8-12  | ~400  |
| PR2.4 | Post-mortem automation + timeline generator            | 6-10  | ~300  |

**Phase 2 total:** ~1,550 lines · 32-49 files · 4 PRs

### Phase 3 — Support & Reliability

| PR    | Scope                                                  | Files | Lines |
| ----- | ------------------------------------------------------ | ----- | ----- |
| PR3.1 | Support portal — public status page + tenant dashboard | 10-15 | ~500  |
| PR3.2 | DR testing — scenarios, runner, reporter               | 8-12  | ~400  |
| PR3.3 | Feature flags — store, evaluator, admin API + UI       | 10-15 | ~500  |

**Phase 3 total:** ~1,400 lines · 28-42 files · 3 PRs

**Grand total:** ~4,550 lines · 92-140 files · 11 PRs across 3 phases

---

## Risks

| Risk                                     | Mitigation                                                                                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenTelemetry adds latency overhead      | Sampling strategy (10% in production). Async export. Measure overhead before full rollout.                                                                          |
| Alert fatigue from noisy thresholds      | Start with conservative thresholds. Require 3 consecutive failures or sustained degradation before CRITICAL alert. Iterate thresholds based on false-positive rate. |
| On-call rotation friction for small team | Allow "business hours only" mode initially. Escalation to always-on only for CRITICAL.                                                                              |
| Feature flag tech debt                   | Hard expiry on flags (>30 days triggers removal). Audit log captures every evaluation. Limit flag count to prevent combinatorial explosion.                         |
| DR tests consume resources               | Run in sandbox/staging environments. DB restore tests use an isolated clone, not production.                                                                        |
| Support portal exposes internal state    | Public status page shows only aggregate, no tenant data. Tenant dashboard requires auth + RLS.                                                                      |

---

## Non-Goals

- No external APM vendor lock-in (Datadog, New Relic). OTel collector is vendor-neutral.
- No real-time chat support. Support portal is ticket-based.
- No AI-driven incident response in this proposal (candidate for future SDD).
- No multi-region DR (single-region restore testing only).
- No feature flag A/B experiment analytics.
- No custom Prometheus/Grafana infrastructure — use managed or lightweight alternatives where possible.

---

## Success Criteria

1. A fiscal report request can be traced end-to-end from web → API → data-engine → SUNAT in a trace viewer.
2. A DB connection pool at 90% fires a Discord alert within 2 minutes of sustained degradation.
3. An on-call engineer can diagnose and mitigate a common incident using a runbook within 10 minutes.
4. Monthly SLO compliance is visible on a dashboard and error budget burn rate triggers alerts automatically.
5. A post-mortem timeline is auto-generated from incident data with <5 minutes of manual cleanup.
6. A DR restore test runs weekly and results are published automatically.
7. A feature can be toggled off in production without a deploy.
8. A tenant can check system status and file a support ticket from a self-service portal.
