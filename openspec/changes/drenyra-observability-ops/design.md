# SDD Design: Observability & Operations — Production Reliability

**Change:** drenyra-observability-ops
**Created:** 2026-07-23
**Status:** Design
**Predecessor:** CAP-FOUND-07 (B3 Observability)

---

## Executive Summary

This design extends Drenyra's observability foundation (Pino structured logging, prom-client metrics, health checks, frontend telemetry) with a three-phase operations layer: APM tracing with OpenTelemetry, dashboards, rule-based alerting, incident response automation, SLI/SLO tracking, support portal, DR testing, and feature flags. Every decision is grounded in the real codebase: the existing Elysia API, prom-client metrics exposed at `/metrics`, the health module with OTEL readiness plumbing, Pino logger with redaction, frontend telemetry with in-memory + DB persistence, and the Drenyra monorepo convention.

---

## Architecture Decisions

### AD-1: OpenTelemetry SDK Strategy — Bun-Compatible Manual Instrumentation

**Decision:** Use `@opentelemetry/api` + `@opentelemetry/sdk-trace-base` + `@opentelemetry/exporter-trace-otlp-http` with custom Elysia middleware for HTTP spans, a Drizzle wrapper for DB spans, and explicit `startSpan`/`endSpan` for business-critical paths. Do NOT use `@opentelemetry/sdk-node` or `@opentelemetry/instrumentation-http` — they target Node.js `http` module and are incompatible with Bun's native runtime.

**Rationale:** Bun's runtime lacks the Node.js `http`/`https` module hooks that `@opentelemetry/instrumentation-http` relies on. The Elysia framework runs on Bun's native `Bun.serve()`. Instead of fighting the runtime, we implement OTel primitives directly with middleware wrapping — the same pattern already used successfully by the existing `metrics.middleware.ts` (which wraps Elysia's `onAfterResponse`/`onError` hooks).

**Implementation approach:**

```typescript
// packages/ops/src/tracing/sdk.ts
import { trace, TracerProvider, SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { context, propagation } from '@opentelemetry/api';

// Elysia middleware for automatic HTTP spans (replaces @opentelemetry/instrumentation-http)
export function tracingMiddleware(app: Elysia): Elysia { ... }

// Manual span helpers for critical paths
export function startBusinessSpan(name: string, attrs?: Attributes): Span { ... }
```

**Tradeoffs:**

- Pro: Works on Bun, no polyfills, minimal overhead
- Pro: Full control over span lifecycle and attributes
- Con: No auto-instrumentation for external libraries — we instrument what we need
- Con: Must manually wrap Drizzle queries for DB spans

**Sampling:**

```typescript
// packages/ops/src/tracing/sampler.ts
export function createSampler(): Sampler {
  const env = process.env.NODE_ENV
  if (env === 'development' || env === 'staging') {
    return new AlwaysOnSampler()
  }
  return new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(0.1), // 10% base
  })
  // Errors captured via span status + a custom post-export filter that promotes error traces
}
```

Error traces are promoted to 100% via a `SpanProcessor` override:

```typescript
class ErrorTracePromoter implements SpanProcessor {
  onEnd(span: ReadableSpan): void {
    if (span.status.code === SpanStatusCode.ERROR) {
      // The trace was already sampled at 10%. If NOT sampled, we'd need
      // to force-export it. In practice, we use a DeferredSpanProcessor
      // that buffers all spans and promotes error traces at flush time.
    }
  }
}
```

For true 100% error capture regardless of sampling, we record spans always and conditionally export: a `DeferredSpanProcessor` buffers all spans in-memory (max 10k), and at export time, spans with ERROR status are always included while non-error spans obey the sampling rate. This gives us `{ base: 0.1, error: 1.0 }` semantics without OTel SDK complexity.

**Correlation with existing systems:**

- `traceId` appended to every Pino log entry via `spanContext` in log metadata
- `traceId` included in API error responses (extend existing error handler)
- Frontend telemetry events carry `traceId` from the `X-Trace-Id` response header
- AI swarm spans are children of the originating API request span

---

### AD-2: Alerting Engine — In-Process Cron + Rules DSL

**Decision:** Build the alert evaluation engine as a Bun-native in-process scheduler (not a separate service). Rules are defined in TypeScript (not YAML) with a typed DSL. Metrics are read from the existing prom-client registry (in-process, zero network overhead). Notifications are dispatched via pluggable notifier modules.

**Rationale:** Drenyra already collects all metrics in-process via prom-client. Running a separate metrics scraper + external Prometheus + Alertmanager is over-engineered for a single-region deployment. The in-process approach:

- Reads metrics at zero cost (same process, no HTTP round-trip)
- No external dependency (no Prometheus, no Alertmanager)
- Simple failure model (if API is down, alerting is down — which is itself detectable)
- Can still export to external Prometheus via the existing `/metrics` endpoint

**Architecture:**

```
┌──────────────────────────────────────────────────┐
│                  API Process (Bun)                │
│                                                   │
│  ┌──────────────┐    ┌────────────────────────┐  │
│  │ prom-client   │◄───│ AlertRuleEvaluator     │  │
│  │ registry      │    │ (runs every 30s)       │  │
│  └──────────────┘    │                        │  │
│                       │ ┌────────────────────┐ │  │
│                       │ │ Rule: api-error-rate│ │  │
│                       │ │ Rule: db-pool       │ │  │
│                       │ │ Rule: p95-latency   │ │  │
│                       │ │ Rule: health-check  │ │  │
│                       │ │ Rule: cert-expiry   │ │  │
│                       │ └────────────────────┘ │  │
│                       └───────────┬────────────┘  │
│                                   │               │
│                       ┌───────────▼────────────┐  │
│                       │ SeverityClassifier     │  │
│                       └───────────┬────────────┘  │
│                                   │               │
│                       ┌───────────▼────────────┐  │
│                       │ NotificationRouter     │  │
│                       └───┬───────┬──────┬─────┘  │
│                           │       │      │        │
│                    ┌──────▼──┐ ┌──▼──┐ ┌─▼──────┐ │
│                    │ Discord  │ │Pager│ │Email   │ │
│                    │ Notifier │ │Duty │ │Digest  │ │
│                    └─────────┘ └─────┘ └────────┘ │
└──────────────────────────────────────────────────┘
```

**Rule DSL (TypeScript, not YAML):**

```typescript
// packages/ops/src/alerting/rules/api-error-rate.rule.ts
export const apiErrorRateRule: AlertRule = {
  id: 'api-error-rate-spike',
  name: 'API error rate spike',
  description: 'Sustained HTTP 5xx error rate exceeding threshold',
  severity: 'CRITICAL',
  evaluate(ctx: AlertContext): AlertResult | null {
    const recentMinutes = ctx.metrics.range('5m')
    const errorRate = recentMinutes.errors / Math.max(recentMinutes.total, 1)
    if (errorRate > 0.05 && recentMinutes.consecutiveSamples >= 5) {
      return {
        fired: true,
        severity: 'CRITICAL',
        value: { errorRate, threshold: 0.05, window: '5m' },
        message: `API error rate ${(errorRate * 100).toFixed(1)}% exceeds 5% threshold over 5min`,
      }
    }
    return null
  },
  debounceMinutes: 15, // Don't re-fire within 15min of last fire
}
```

**State management:** Alert state (firing, acknowledged, resolved) is persisted in a `alerts` DB table via Drizzle. The evaluator uses the DB as the source of truth for debouncing and lifecycle.

---

### AD-3: Notification Channels — Pluggable Notifier Interface

**Decision:** Each notification channel (Discord, PagerDuty, Email) implements a common `AlertNotifier` interface. The `NotificationRouter` maps severity → channels and dispatches in parallel.

```typescript
// packages/ops/src/alerting/notifiers/types.ts
interface AlertNotifier {
  readonly channelId: string
  send(alert: FiredAlert): Promise<NotificationResult>
}

interface FiredAlert {
  id: string
  ruleId: string
  ruleName: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  message: string
  value: Record<string, unknown>
  service: string
  timestamp: string
  traceId?: string
}

// Severity → Channel routing
const ROUTING_TABLE = {
  CRITICAL: ['pagerduty', 'discord'],
  WARNING: ['discord'],
  INFO: ['email-digest'],
} as const
```

**Discord notifier:** Posts to configured webhook URL. Supports embed format with severity-colored borders, direct link to alert in admin panel, and acknowledgment instructions.

**PagerDuty notifier:** Posts to PagerDuty Events API v2 (compatible). Trigger/dedupe/resolve lifecycle mapped to alert lifecycle. Falls back gracefully if PagerDuty is unreachable — alert is still logged and visible in admin panel.

**Email digest:** Batches INFO alerts into a daily/weekly digest. Uses existing Drenyra email infrastructure. No real-time email for non-CRITICAL alerts.

---

### AD-4: Dashboard Architecture — Extend Existing Dashboard Module

**Decision:** Add ops-specific endpoints to the existing `features/dashboard` module rather than creating a separate ops-dashboard feature. The existing `dashboardRoutes` at `/api/dashboard` already serves `system-status`. Add:

- `GET /api/dashboard/ops/health` — per-service health (aggregated from health checks)
- `GET /api/dashboard/ops/analytics` — RPM, latency percentiles, error rates
- `GET /api/dashboard/ops/resources` — CPU/memory/DB-pool/AI-tokens
- `GET /api/dashboard/ops/business` — active companies, docs/hour, AI cost/day
- `GET /api/dashboard/ops/alerts` — recent alerts with status
- `GET /api/dashboard/ops/slo` — SLI/SLO compliance data

Frontend components live in `apps/web/src/features/ops-dashboard/` as a new feature surface.

**Rationale:** The dashboard feature already implements the pattern (CQRS with queries, Elysia routes, Elysia schema validation). Extending it avoids a new module surface and keeps ops data near the existing business metrics.

---

### AD-5: Database Schema — New Tables in Drenyra Persistence

**Decision:** All new tables go into the existing `@drenyra/persistence` package, following the Drizzle schema pattern already established.

```typescript
// packages/persistence/src/schema/ops.ts

// Alert lifecycle
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ruleId: text('rule_id').notNull(),
  ruleName: text('rule_name').notNull(),
  severity: text('severity', {
    enum: ['CRITICAL', 'WARNING', 'INFO'],
  }).notNull(),
  status: text('status', {
    enum: ['FIRING', 'ACKNOWLEDGED', 'RESOLVED', 'SUPPRESSED'],
  })
    .notNull()
    .default('FIRING'),
  message: text('message').notNull(),
  value: jsonb('value').$type<Record<string, unknown>>(),
  service: text('service').notNull().default('drenyra-api'),
  traceId: text('trace_id'),
  acknowledgedBy: text('acknowledged_by'),
  acknowledgedAt: timestamp('acknowledged_at'),
  resolvedAt: timestamp('resolved_at'),
  suppressed: boolean('suppressed').default(false),
  suppressReason: text('suppress_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// On-call rotations
export const onCallRotations = pgTable('on_call_rotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  members: jsonb('members').$type<string[]>().notNull(),
  schedule: text('schedule', {
    enum: ['weekly', 'biweekly', 'follow-the-sun'],
  }).notNull(),
  handoffDay: text('handoff_day').notNull().default('monday'),
  currentMember: text('current_member'),
  nextHandoffAt: timestamp('next_handoff_at'),
  escalationPolicy: jsonb('escalation_policy').$type<EscalationPolicy>(),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Rotation history (for audit)
export const onCallHandoffs = pgTable('on_call_handoffs', {
  id: uuid('id').primaryKey().defaultRandom(),
  rotationId: uuid('rotation_id')
    .references(() => onCallRotations.id)
    .notNull(),
  fromMember: text('from_member').notNull(),
  toMember: text('to_member').notNull(),
  handoffAt: timestamp('handoff_at').defaultNow().notNull(),
  summary: text('summary'),
})

// SLI/SLO tracking
export const sliDefinitions = pgTable('sli_definitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  sloTarget: numeric('slo_target').notNull(), // e.g., 99.9 for 99.9%
  window: text('window', { enum: ['monthly', 'quarterly'] })
    .notNull()
    .default('monthly'),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const sliMeasurements = pgTable('sli_measurements', {
  id: uuid('id').primaryKey().defaultRandom(),
  sliId: uuid('sli_id')
    .references(() => sliDefinitions.id)
    .notNull(),
  period: text('period').notNull(), // '2026-07'
  goodEvents: integer('good_events').notNull(),
  totalEvents: integer('total_events').notNull(),
  compliance: numeric('compliance').notNull(), // percentage
  errorBudgetConsumed: numeric('error_budget_consumed').notNull(), // percentage
  measuredAt: timestamp('measured_at').defaultNow().notNull(),
})

// Incidents
export const incidents = pgTable('incidents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  severity: text('severity', {
    enum: ['CRITICAL', 'WARNING', 'INFO'],
  }).notNull(),
  status: text('status', {
    enum: ['OPEN', 'INVESTIGATING', 'MITIGATING', 'RESOLVED', 'CLOSED'],
  })
    .notNull()
    .default('OPEN'),
  detectedBy: text('detected_by'), // 'alert', 'manual', 'user-report'
  alertId: uuid('alert_id').references(() => alerts.id),
  runbookId: text('runbook_id'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
  durationSeconds: integer('duration_seconds'),
  responders: jsonb('responders').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Incident timeline events
export const incidentEvents = pgTable('incident_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  incidentId: uuid('incident_id')
    .references(() => incidents.id)
    .notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  eventType: text('event_type').notNull(), // 'alert', 'deploy', 'health-check', 'manual', 'resolution'
  source: text('source').notNull(), // 'alert-engine', 'deploy-log', 'health-check', 'manual'
  description: text('description').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
})

// Post-mortems
export const postMortems = pgTable('post_mortems', {
  id: uuid('id').primaryKey().defaultRandom(),
  incidentId: uuid('incident_id')
    .references(() => incidents.id)
    .notNull(),
  title: text('title').notNull(),
  rootCause: text('root_cause'),
  impactSummary: text('impact_summary'),
  filePath: text('file_path'), // path to markdown file in repo
  status: text('status', { enum: ['draft', 'review', 'published'] })
    .notNull()
    .default('draft'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Post-mortem action items
export const postMortemActions = pgTable('post_mortem_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  postMortemId: uuid('post_mortem_id')
    .references(() => postMortems.id)
    .notNull(),
  description: text('description').notNull(),
  priority: text('priority', { enum: ['P0', 'P1', 'P2'] }).notNull(),
  owner: text('owner'),
  status: text('status', {
    enum: ['open', 'in_progress', 'completed', 'wont_fix'],
  })
    .notNull()
    .default('open'),
  dueDate: timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Feature flags
export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  enabled: boolean('enabled').notNull().default(false),
  rolloutPercentage: integer('rollout_percentage').notNull().default(100), // 0-100
  targetRucs: jsonb('target_rucs').$type<string[] | null>(), // null = all tenants
  expiresAt: timestamp('expires_at'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Feature flag audit log (immutable)
export const featureFlagAudit = pgTable('feature_flag_audit', {
  id: uuid('id').primaryKey().defaultRandom(),
  flagId: uuid('flag_id')
    .references(() => featureFlags.id)
    .notNull(),
  action: text('action', {
    enum: ['created', 'enabled', 'disabled', 'rollout_changed', 'deleted'],
  }).notNull(),
  oldValue: jsonb('old_value').$type<Record<string, unknown>>(),
  newValue: jsonb('new_value').$type<Record<string, unknown>>(),
  operatorId: text('operator_id').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// DR test results
export const drTests = pgTable('dr_tests', {
  id: uuid('id').primaryKey().defaultRandom(),
  scenario: text('scenario').notNull(), // 'db-restore', 'service-failover', 'config-recovery', 'full-stack'
  status: text('status', { enum: ['running', 'passed', 'failed'] }).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  durationSeconds: integer('duration_seconds'),
  metrics: jsonb('metrics').$type<Record<string, unknown>>(),
  error: text('error'),
  runId: text('run_id').notNull().unique(),
})

// Support tickets
export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketNumber: serial('ticket_number').notNull().unique(),
  tenantId: text('tenant_id').notNull(), // RUC
  category: text('category').notNull(),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  status: text('status', {
    enum: ['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'],
  })
    .notNull()
    .default('open'),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] })
    .notNull()
    .default('medium'),
  assignedTo: text('assigned_to'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
})

export const supportTicketComments = pgTable('support_ticket_comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id')
    .references(() => supportTickets.id)
    .notNull(),
  authorId: text('author_id').notNull(), // user or tenant identifier
  authorType: text('author_type', { enum: ['staff', 'tenant'] }).notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
```

---

### AD-6: Feature Flags — DB Table + In-Memory Cache

**Decision:** Self-hosted feature flag store backed by a Drizzle table with a Bun-native in-memory cache (TTL: 30s). No external service (LaunchDarkly, etc.).

**Architecture:**

```
┌─────────────────────────────────────────────┐
│            FeatureFlagService                │
│                                               │
│  ┌──────────────────┐   ┌─────────────────┐  │
│  │ In-Memory Cache   │   │ DB Store         │  │
│  │ (Map, TTL 30s)   │◄──│ (feature_flags)  │  │
│  └────────┬─────────┘   └─────────────────┘  │
│           │                                    │
│  ┌────────▼──────────────────────────────┐    │
│  │ FlagEvaluator                          │    │
│  │                                        │    │
│  │ evaluate(name, context) → boolean      │    │
│  │                                        │    │
│  │ Context: {                             │    │
│  │   ruc?: string     // tenant targeting │    │
│  │   userId?: string  // sticky rollout   │    │
│  │ }                                      │    │
│  └────────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

**Sticky rollout:** For percentage-based rollouts, hash the `userId` or `ruc` modulo 100 to ensure consistent assignment per user/tenant. No user → random.

**Admin API:** CRUD endpoints at `PUT /api/ops/feature-flags`, `GET /api/ops/feature-flags`, `GET /api/ops/feature-flags/:name`, `DELETE /api/ops/feature-flags/:name`. All mutations write to the audit log table.

**Expiry enforcement:**

- Daily cron checks for flags >30 days without modification → WARNING surfaced in admin panel
- Expired flags always evaluate to `false`
- Expiry evaluation reason logged

---

### AD-7: Support Portal — Public Status Page + Authenticated Tenant Dashboard

**Decision:** The public status page is a statically generated React page served from the Web app (no auth required). The tenant dashboard is an authenticated feature surface in the existing admin panel.

**Status page data flow:**

```
Alert Engine → alerts table → GET /api/public/status (public, no auth)
Incidents table → incident history → public status page
DR tests → public status page (pass/fail only, no details)
```

**Tenant dashboard data flow:**

```
Tenant request (authenticated, RUC-scoped) → GET /api/dashboard/ops/tenant
  → Documents processed (existing document metrics, filtered by RUC)
  → API usage (existing prom-client metrics, filtered by RUC)
  → Error rate (existing error metrics, filtered by RUC)
  → Support tickets (supportTickets table, filtered by RUC)
```

**Incident subscription:** Tenants subscribe via the support portal. Stored in a `incident_subscriptions` table. On CRITICAL incident creation, the alert engine triggers email to subscribed tenants using the existing email infrastructure.

---

### AD-8: DR Testing — Script-Based Runner with DB Tracking

**Decision:** DR tests are defined as shell scripts in `scripts/ops/dr/` (not in-process). A TypeScript orchestrator (`packages/ops/src/dr/runner.ts`) invokes them, captures output, and records results in `drTests` table.

Existing scripts already exist: `ops:db:backup`, `ops:db:restore:verify`. Extend with:

```
scripts/ops/dr/
├── db-restore.sh          # Restore latest backup to sandbox, validate
├── service-failover.sh    # Stop API in staging, verify health routing
├── config-recovery.sh     # Restore secrets from backup
├── full-stack-recovery.sh # End-to-end restore to staging
└── report.sh              # Publish results to DB via API
```

**Runner (TypeScript):**

```typescript
// packages/ops/src/dr/runner.ts
export async function runDrScenario(
  scenario: DrScenario
): Promise<DrTestResult> {
  const runId = createRunId(scenario.name)
  const start = Date.now()

  await insertDrTest({ scenario: scenario.name, status: 'running', runId })

  try {
    const output = await executeScript(scenario.script, scenario.timeoutSeconds)
    const result = parseResult(output)
    await insertDrTest({
      runId,
      status: result.passed ? 'passed' : 'failed',
      completedAt: new Date(),
      durationSeconds: (Date.now() - start) / 1000,
      metrics: result.metrics,
      error: result.error,
    })
    return result
  } catch (error) {
    await insertDrTest({
      runId,
      status: 'failed',
      completedAt: new Date(),
      durationSeconds: (Date.now() - start) / 1000,
      error: String(error),
    })
    if (scenario.failureCreatesIncident) {
      await createP1Incident(`DR test ${scenario.name} failed`, error)
    }
    throw error
  }
}
```

**Scheduling:** A Bun-native cron in the ops package triggers scenarios on schedule (weekly DB restore, monthly full stack). The cron is started in `app-core.ts` alongside the alert engine.

---

### AD-9: On-Call Management — DB-Backed Rotation + Discord Bot

**Decision:** On-call rotations are stored in DB, advanced by a daily cron. Discord integration uses webhooks + bot interactions (slash command `/ack` for alert acknowledgment). No external PagerDuty dependency.

**Rotation advancement:**

```typescript
// packages/ops/src/oncall/rotation-advancer.ts
// Runs daily at 00:01 UTC
export async function advanceRotations(): Promise<void> {
  const rotations = await getRotationsDueForHandoff()

  for (const rotation of rotations) {
    const nextIdx =
      (rotation.members.indexOf(rotation.currentMember) + 1) %
      rotation.members.length
    const nextMember = rotation.members[nextIdx]

    await recordHandoff(rotation, rotation.currentMember, nextMember)
    await advanceRotation(rotation.id, nextMember, rotation.schedule)
    await notifyDiscordHandoff(rotation, rotation.currentMember, nextMember)
  }
}
```

**Escalation:** When an alert is unacknowledged for `level1.timeout`, the escalation engine queries the escalation policy and notifies the next level. Escalation resets on acknowledgment.

**Discord acknowledgment:** The Discord bot listens for a `/ack <alert-id>` slash command. On receipt, it calls the alert API to mark the alert acknowledged.

---

## Package Structure

```
packages/ops/                          ← NEW package @drenyra/ops
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                       ← Public exports
│   │
│   ├── tracing/
│   │   ├── sdk.ts                     ← OTel SDK setup (provider, exporter)
│   │   ├── sampler.ts                 ← Adaptive sampler
│   │   ├── middleware.ts              ← Elysia HTTP tracing middleware
│   │   ├── db-tracing.ts              ← Drizzle query wrapper
│   │   ├── spans/                     ← Manual span definitions
│   │   │   ├── fiscal.ts              ← fiscal.calculate span
│   │   │   ├── sunat.ts               ← sunat.submit span
│   │   │   └── ai.ts                  ← ai.completion span
│   │   └── propagation.ts             ← W3C trace context propagation
│   │
│   ├── alerting/
│   │   ├── engine.ts                  ← Cron-based rule evaluator
│   │   ├── classifier.ts              ← Severity classifier
│   │   ├── router.ts                  ← Notification router
│   │   ├── state.ts                   ← Alert lifecycle state machine
│   │   ├── rules/                     ← Rule definitions
│   │   │   ├── api-error-rate.ts
│   │   │   ├── db-pool-exhaustion.ts
│   │   │   ├── p95-latency.ts
│   │   │   ├── health-check.ts
│   │   │   └── cert-expiry.ts
│   │   ├── notifiers/                 ← Notification channels
│   │   │   ├── discord.ts
│   │   │   ├── pagerduty.ts
│   │   │   ├── email.ts
│   │   │   └── email-digest.ts
│   │   └── types.ts                   ← AlertRule, AlertContext, etc.
│   │
│   ├── oncall/
│   │   ├── rotation.ts                ← Rotation management
│   │   ├── escalation.ts              ← Escalation policy engine
│   │   ├── handoff.ts                 ← Shift handoff protocol
│   │   └── discord-bot.ts             ← Discord bot integration
│   │
│   ├── slo/
│   │   ├── indicators.ts              ← SLI computation functions
│   │   ├── tracker.ts                 ← SLO compliance calculation
│   │   └── budget.ts                  ← Error budget + burn rate
│   │
│   ├── postmortem/
│   │   ├── template.ts                ← Markdown template generator
│   │   ├── timeline.ts                ← Auto-timeline builder
│   │   └── actions.ts                 ← Action item tracker
│   │
│   ├── runbooks/
│   │   ├── engine.ts                  ← Runbook execution engine
│   │   └── registry.ts               ← Runbook registry (loads YAML)
│   │
│   ├── dr/
│   │   ├── runner.ts                  ← DR test orchestrator
│   │   ├── scheduler.ts               ← Cron-based DR scheduler
│   │   └── reporter.ts                ← DR dashboard data queries
│   │
│   ├── feature-flags/
│   │   ├── store.ts                   ← DB + cache store
│   │   ├── evaluator.ts               ← Flag evaluation engine
│   │   ├── admin.ts                   ← CRUD API
│   │   └── health.ts                  ← Flag expiry checker
│   │
│   └── dashboard/
│       ├── queries/                   ← Ops dashboard queries
│       │   ├── health.ts              ← Aggregated health data
│       │   ├── analytics.ts           ← RPM, latency, errors
│       │   ├── resources.ts           ← CPU, memory, DB pool, AI tokens
│       │   ├── business.ts            ← Companies, docs, cost
│       │   ├── alerts.ts              ← Recent alert data
│       │   └── slo.ts                 ← SLI/SLO dashboard data
│       └── cron.ts                    ← Dashboard cron scheduler

apps/api/src/features/
├── alerts/                            ← Alert management API
│   ├── index.ts                       ← Elysia module
│   ├── routes.ts
│   └── application/
│       ├── queries/
│       │   ├── get-alerts.ts
│       │   └── get-alert.ts
│       └── commands/
│           ├── acknowledge-alert.ts
│           └── resolve-alert.ts
│
├── oncall/                            ← On-call management API
│   ├── index.ts
│   ├── routes.ts
│   └── application/
│       ├── queries/
│       │   ├── get-rotations.ts
│       │   └── get-current-oncall.ts
│       └── commands/
│           ├── create-rotation.ts
│           ├── update-rotation.ts
│           └── advance-rotation.ts
│
├── incidents/                         ← Incident lifecycle API
│   ├── index.ts
│   ├── routes.ts
│   └── application/
│       ├── queries/
│       │   ├── get-incidents.ts
│       │   └── get-incident.ts
│       └── commands/
│           ├── create-incident.ts
│           ├── update-incident.ts
│           └── resolve-incident.ts
│
├── slo/                               ← SLO data API
│   ├── index.ts
│   ├── routes.ts
│   └── application/
│       └── queries/
│           ├── get-sli-list.ts
│           └── get-slo-compliance.ts
│
├── support/                           ← Support portal API
│   ├── index.ts
│   ├── routes.ts
│   ├── public-routes.ts              ← Public (no auth) status page API
│   └── application/
│       ├── queries/
│       │   ├── get-public-status.ts
│       │   ├── get-tenant-dashboard.ts
│       │   └── get-tickets.ts
│       └── commands/
│           ├── create-ticket.ts
│           └── update-ticket.ts
│
├── ops/                               ← Feature flag + Ops admin API
│   ├── index.ts
│   ├── feature-flag-routes.ts
│   └── application/
│       ├── queries/
│       │   └── get-feature-flags.ts
│       └── commands/
│           ├── create-feature-flag.ts
│           ├── update-feature-flag.ts
│           └── delete-feature-flag.ts
│
└── dashboard/                         ← EXTEND existing
    └── api/
        └── ops-dashboard.routes.ts    ← NEW: ops dashboard endpoints

apps/web/src/features/
├── ops-dashboard/                     ← Operations dashboard UI
│   ├── index.tsx
│   ├── pages/
│   │   ├── SystemHealth.tsx
│   │   ├── RequestAnalytics.tsx
│   │   ├── ResourceUtilization.tsx
│   │   ├── BusinessMetrics.tsx
│   │   ├── AlertTimeline.tsx
│   │   └── SloDashboard.tsx
│   └── components/
│       ├── ServiceStatusCard.tsx
│       ├── LatencyChart.tsx
│       ├── AlertBadge.tsx
│       └── BurnRateGauge.tsx
│
├── alerts/                            ← Alert management UI
├── incidents/                         ← Incident management UI
├── oncall/                            ← On-call calendar UI
├── support-portal/                    ← Tenant support UI + public status page
└── feature-flags/                     ← Flag management UI

runbooks/                              ← Runbook YAML files
├── api-high-error-rate.yaml
├── db-pool-exhaustion.yaml
├── ai-swarm-degraded.yaml
└── sunat-unreachable.yaml

scripts/ops/dr/                        ← DR test scripts
├── db-restore.sh
├── service-failover.sh
├── config-recovery.sh
├── full-stack-recovery.sh
└── report.sh
```

---

## Data Flow Diagrams

### Trace Context Propagation

```
┌──────────────┐     traceparent      ┌──────────────┐     traceparent      ┌──────────────┐
│   Web (React) │─────────────────────►│  API (Elysia) │─────────────────────►│  Data Engine  │
│              │                      │              │                      │  (FastAPI)    │
│ OTel JS SDK  │                      │ tracingMw    │                      │              │
│              │                      │ fiscal.calc  │                      │ sunat.submit │
│ traceId=A    │                      │ ai.completion│                      │ traceId=A    │
└──────┬───────┘                      └──────┬───────┘                      └──────┬───────┘
       │                                     │                                     │
       │  X-Trace-Id: A (response)           │  traceparent: A (outbound)          │
       │◄────────────────────────────────────┤◄────────────────────────────────────┤
       │                                     │                                     │
       │  FE error: { traceId: A }           │  log: { trace_id: A }               │
       │────────────────────────────────────►│                                     │
       │                                     │                                     │
       └─────────────────────────────────────┼─────────────────────────────────────┘
                                             │
                                      ┌──────▼──────┐
                                      │ OTel Collector│
                                      │ (OTLP HTTP)  │
                                      └──────┬──────┘
                                             │
                                      ┌──────▼──────┐
                                      │ Jaeger/Tempo │
                                      │ (trace store)│
                                      └─────────────┘
```

### Alert Lifecycle

```
┌──────────┐    evaluate()    ┌──────────────┐    fire    ┌───────────────┐
│ Metrics   │────────────────►│ RuleEvaluator │──────────►│ Alert (FIRING) │
│ (prom)    │   every 30s     │              │           └───────┬───────┘
└──────────┘                  └──────────────┘                   │
                                                                 │
                              ┌──────────────────────────────────┴──────┐
                              │                                         │
                       ┌──────▼──────┐                           ┌──────▼──────┐
                       │ Discord      │                           │ PagerDuty    │
                       │ (CRIT/WARN)  │                           │ (CRIT only)  │
                       └──────┬──────┘                           └──────┬──────┘
                              │                                         │
                       ┌──────▼──────┐                                  │
                       │ On-call      │◄─────────────────────────────────┘
                       │ acknowledges │
                       └──────┬──────┘
                              │
                     ┌────────▼─────────┐
                     │ Alert (ACK'ED)    │
                     └────────┬─────────┘
                              │
                     ┌────────▼─────────┐
                     │ Incident created  │────► Runbook executed
                     └────────┬─────────┘
                              │
                     ┌────────▼─────────┐
                     │ Alert (RESOLVED)  │
                     └────────┬─────────┘
                              │
                     ┌────────▼─────────┐
                     │ Post-mortem gen   │
                     └──────────────────┘
```

---

## Component Contracts

### Tracing Middleware Contract

```typescript
// packages/ops/src/tracing/middleware.ts

/**
 * Elysia middleware that creates an HTTP span for every request.
 * Extracts W3C trace context from `traceparent` header.
 * Injects `traceId` into response headers as `X-Trace-Id`.
 *
 * Must be registered BEFORE other middleware to capture full request lifecycle.
 */
export function tracingMiddleware(app: Elysia): Elysia

// Usage in app-core.ts:
//   .use(tracingMiddleware)  // before requestLogger, metricsMiddleware

interface TraceContext {
  traceId: string
  spanId: string
  traceFlags: number
}
```

### DB Tracing Wrapper Contract

```typescript
// packages/ops/src/tracing/db-tracing.ts

/**
 * Wraps a Drizzle database instance with tracing.
 * Every query creates a child span of the active HTTP span.
 *
 * @example
 * const tracedDb = wrapDbWithTracing(db);
 * await tracedDb.select().from(users); // span: db.query.select.users
 */
export function wrapDbWithTracing<T extends DrizzleDB>(db: T): T
```

### Alert Rule Contract

```typescript
// packages/ops/src/alerting/types.ts

interface AlertRule {
  id: string
  name: string
  description: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  evaluate(ctx: AlertContext): AlertResult | null
  debounceMinutes: number
}

interface AlertContext {
  metrics: {
    range(window: string): MetricSnapshot
    current(): MetricSnapshot
  }
  db: DrizzleDB
  now: Date
}

interface MetricSnapshot {
  errors: number
  total: number
  p50: number
  p95: number
  p99: number
  consecutiveSamples: number // number of consecutive samples above threshold
}

interface AlertResult {
  fired: true
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  value: Record<string, unknown>
  message: string
}
```

### Feature Flag Evaluator Contract

```typescript
// packages/ops/src/feature-flags/evaluator.ts

interface FlagEvaluationContext {
  ruc?: string
  userId?: string
}

interface FlagEvaluationResult {
  enabled: boolean
  reason:
    | 'enabled'
    | 'disabled'
    | 'rollout_percentage'
    | 'tenant_targeted'
    | 'expired'
    | 'not_found'
}

export class FeatureFlagEvaluator {
  evaluate(
    name: string,
    ctx?: FlagEvaluationContext
  ): Promise<FlagEvaluationResult>
  evaluateSync(name: string, ctx?: FlagEvaluationContext): FlagEvaluationResult // cached
  refreshCache(): Promise<void>
}
```

---

## Integration Points

### With Existing Observability (CAP-FOUND-07)

| Existing Component                            | Integration                                                                                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prom-client` metrics at `/metrics`           | Alert engine reads metrics in-process via `register.getMetricsAsJSON()`. SLI computation uses the same data. No external scraping needed.                 |
| Pino logger (`@drenyra/shared/config/logger`) | Tracing middleware injects `traceId` into log child context. Every log line carries `trace_id`.                                                           |
| Health module (`/health/*`)                   | Alert rule `health-check-failure` queries `/health/live` from within the process. OTEL readiness already exists — tracing middleware uses those env vars. |
| Frontend telemetry                            | `X-Trace-Id` response header is captured by FE telemetry and attached to error events.                                                                    |
| Request logger middleware                     | Tracing middleware runs BEFORE request logger so span context is available.                                                                               |
| Global error handler                          | Extended to include `traceId` in error response body.                                                                                                     |

### With External Services

| Service          | Integration Pattern                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| SUNAT            | `sunat.submit` manual span wraps the outbound HTTP call in Data Engine. Trace context propagated via `traceparent` header. |
| AI Gateway (LLM) | `ai.completion` manual span with attributes: model, tokens, latency, cost. Parent trace context propagated to gateway.     |
| Discord          | Webhook URLs configured via env vars. No SDK dependency — raw HTTP POST.                                                   |
| PagerDuty        | Events API v2 compatible. Falls back gracefully.                                                                           |
| Email            | Existing `@drenyra/infrastructure` email adapter.                                                                          |

---

## Configuration & Environment Variables

```bash
# ── OpenTelemetry ─────────────────────────────────
DRENYRA_ENABLE_OTEL=true                    # Master enable (already exists)
OTEL_SERVICE_NAME=drenyra-api               # Service name (already exists)
OTEL_EXPORTER_OTLP_ENDPOINT=http://...      # OTLP collector (already exists)
OTEL_SAMPLING_BASE_RATE=0.1                 # Base sampling rate in production (NEW)

# ── Alerting ─────────────────────────────────────
ALERT_EVALUATION_INTERVAL_SECONDS=30        # How often rules evaluate
ALERT_DISCORD_WEBHOOK_URL=                  # Discord alerts channel
ALERT_PAGERDUTY_ROUTING_KEY=                # PagerDuty integration key
ALERT_EMAIL_DIGEST_ENABLED=true             # Enable daily/weekly email digest
ALERT_MAINTENANCE_WINDOW_ENABLED=false      # Suppress alerts during maintenance

# ── On-Call ─────────────────────────────────────
ONCALL_DISCORD_BOT_TOKEN=                   # Discord bot token for /ack commands
ONCALL_HANDOFF_CRON_ENABLED=true            # Enable daily handoff cron

# ── SLI/SLO ──────────────────────────────────────
SLO_WINDOW=monthly                          # Default SLO window
SLO_ERROR_BUDGET_ALERT_THRESHOLDS=50,80,100 # Alert at these budget consumption points

# ── Feature Flags ────────────────────────────────
FEATURE_FLAG_CACHE_TTL_SECONDS=30           # In-memory cache TTL

# ── DR Testing ──────────────────────────────────
DR_DB_BACKUP_DIR=/data/backups              # Backup directory
DR_SANDBOX_DB_URL=                          # Sandbox database for restore tests
DR_SCHEDULE_DB_RESTORE="0 3 * * 1"          # cron: every Monday 03:00 UTC
DR_SCHEDULE_FULL_STACK="0 3 1 * *"          # cron: 1st of month 03:00 UTC

# ── Support Portal ──────────────────────────────
SUPPORT_PUBLIC_STATUS_ENABLED=true          # Enable public status page
SUPPORT_INCIDENT_SUBSCRIPTIONS_ENABLED=true # Enable tenant subscriptions
```

---

## Performance Considerations

### Tracing Overhead

- Custom middleware adds ~0.1ms per request (no native module overhead)
- DeferredSpanProcessor buffers spans in-memory (max 10k, ~5MB)
- OTLP export is async, non-blocking via `BatchSpanProcessor`
- Production: 10% base sampling → 90% of requests have zero span overhead
- Error traces always captured → worst case is error storms, bounded by buffer size

### Alert Engine Overhead

- In-process metric read via `register.getMetricsAsJSON()` → ~0.5ms
- Rule evaluation (5 rules) → ~1ms
- Total overhead every 30s: negligible
- DB writes only when alert state changes (fire/ack/resolve)
- Discord/PagerDuty HTTP calls: async, non-blocking

### Feature Flag Overhead

- First evaluation: DB query (~5ms) → cached for 30s
- Subsequent evaluations: Map.get() → ~0.001ms
- Cache refresh: background cron, non-blocking

### Dashboard Query Overhead

- All dashboard queries read from existing prom-client registry (in-process) — no network
- Aggregation is O(n) where n = metric cardinality (bounded by route normalization)
- No additional DB queries for metrics data
- Alert/SLO/Incident data from DB: paginated (limit 50), indexed

---

## Security Considerations

- **Tracing data:** traceId is non-sensitive (UUID). Span attributes may contain RUC values — the redaction middleware already in the logger applies. Span attributes skip `ruc` and use `company_id` hash instead.
- **Alert notifications:** Discord webhook URLs never logged. PagerDuty keys stored in env, never in DB.
- **Public status page:** Only aggregate data, no tenant-specific data, no internal metrics. Rate-limited.
- **Tenant dashboard:** Authenticated, RUC-scoped via existing `companyScopeGuard`. Tenant can only see own data.
- **Feature flags:** Audit log is immutable (no UPDATE on audit table, only INSERT). Flag changes require admin auth.
- **Support portal:** Ticket CRUD requires tenant auth. No cross-tenant ticket access.
- **On-call data:** Rotation members stored as opaque IDs, not PII.

---

## Testing Strategy

### Unit Tests

- Alert rule evaluator: mock metrics, verify fire/not-fire conditions, debouncing
- Feature flag evaluator: mock DB, verify all evaluation reasons
- SLI computation: fixed input → known compliance percentage
- Post-mortem timeline: fixed event data → expected markdown
- Notification router: verify severity → channel mapping

### Integration Tests

- Tracing middleware: create span in test Elysia app, verify traceId in response
- Alert engine end-to-end: fire mock metric → verify Discord/PagerDuty call (mocked HTTP)
- On-call rotation advancement: insert rotation → advance → verify handoff record
- DR runner: execute test script → verify DB record

### Smoke Tests (following existing pattern in `health/__tests__/unit/doctor-observability-smoke.test.ts`)

- OTEL SDK starts, exports to collector, trace visible
- Alert engine starts, evaluates rules, no crash
- Feature flag cache refreshes, evaluation works
- SLO dashboard returns data

---

## Rollout Plan

### Phase 1 — Ops Foundation (PRs 1.1–1.4)

1. **PR1.1:** `@drenyra/ops` package scaffold + tracing SDK + Elysia middleware + sampler. No business spans yet. `/health/doctor` reports OTEL status.
2. **PR1.2:** Manual spans (`fiscal.calculate`, `sunat.submit`, `ai.completion`) + trace context propagation between API and Data Engine. Trace IDs in error responses and FE telemetry.
3. **PR1.3:** Ops dashboard queries (`health.ts`, `analytics.ts`, `resources.ts`, `business.ts`) + API endpoints extending `dashboardRoutes`.
4. **PR1.4:** Alert engine (rule evaluator, severity classifier, router) + Discord/PagerDuty notifiers + initial 5 rules + alert state management + DB schema for alerts.

**Phase 1 gate:** Traces visible in collector. Alerts fire to Discord. Ops dashboard shows live data. No breaking changes to existing observability.

### Phase 2 — Incident Response (PRs 2.1–2.4)

5. **PR2.1:** Runbook YAML definitions (4 files) + runbook engine + registry.
6. **PR2.2:** On-call rotation DB schema + rotation management API + Discord bot (`/ack`) + escalation engine + handoff protocol.
7. **PR2.3:** SLI definitions + SLO tracker + error budget computation + SLO dashboard queries + budget alerts.
8. **PR2.4:** Incident DB schema + incident lifecycle API + post-mortem template + timeline auto-generator + action item tracker.

### Phase 3 — Support & Reliability (PRs 3.1–3.3)

9. **PR3.1:** Support ticket DB schema + ticket CRUD API + public status page API + tenant dashboard API + incident subscription.
10. **PR3.2:** DR test scripts (4) + DR runner + DR scheduler + DR dashboard.
11. **PR3.3:** Feature flag DB schema + store + evaluator + admin API + audit log + flag expiry checker.

---

## Risks & Mitigations

| Risk                                                    | Mitigation                                                                                                                                                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OTel SDK on Bun: undiscovered runtime incompatibilities | Start with manual span creation only (Phase 1.1). If SDK issues arise, fall back to custom span implementation using the same `@opentelemetry/api` types. The OTLP wire protocol is simple enough to hand-roll if needed. |
| Alert fatigue from false positives                      | Start with conservative thresholds (5min sustained). Every rule has `debounceMinutes`. Include a "suppress all alerts" maintenance window flag.                                                                           |
| On-call rotation complexity for small team              | Allow manual advancement. Discord bot is optional — rotations can be managed via admin panel.                                                                                                                             |
| Feature flags: combinatorial explosion                  | Hard limit of 50 active flags. Expiry warnings at 30 days. Audit log captures every change.                                                                                                                               |
| DR tests consuming production resources                 | All DR tests target sandbox/staging environments. The `full-stack-recovery` scenario uses an isolated clone, never production.                                                                                            |
| Support portal exposing internal state                  | Public status page serves only aggregate data from cache (TTL 60s). No direct DB queries. Rate-limited at edge.                                                                                                           |
| Database migration complexity (11 new tables)           | Each PR includes its own Drizzle migration. Migrations are additive and backwards-compatible. No existing tables modified.                                                                                                |

---

## Decision Log

| ID   | Decision                                   | Rationale                                                                           | Alternatives Considered                                                                            |
| ---- | ------------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| AD-1 | Bun-compatible manual OTel instrumentation | Bun lacks Node.js `http` module hooks. Elysia runs on `Bun.serve()`.                | `@opentelemetry/sdk-node` (incompatible), `dd-trace` (vendor lock-in)                              |
| AD-2 | In-process alert engine                    | Zero network overhead reading metrics. Simple failure model.                        | External Prometheus+Alertmanager (over-engineered for single region), Grafana Cloud (cost, vendor) |
| AD-3 | Pluggable notifier interface               | Discord, PagerDuty, and email have different APIs. Interface abstracts the routing. | Hardcoded notifiers (inflexible), single notifier (incomplete)                                     |
| AD-4 | Extend existing dashboard module           | Reuses CQRS pattern, route structure, and schema validation.                        | New ops-dashboard feature (unnecessary duplication)                                                |
| AD-5 | Drizzle schemas in `@drenyra/persistence`  | Consistent with all existing DB schemas. Single migration source.                   | Separate ops database (fragmentation)                                                              |
| AD-6 | Self-hosted feature flags                  | Zero external dependencies. 30s cache TTL is fast enough for operational toggles.   | LaunchDarkly (cost, vendor), Unleash (another service to run)                                      |
| AD-7 | Statically generated public status page    | No auth, no DB queries at page load. Fast, cacheable, CDN-friendly.                 | Server-rendered status page (unnecessary compute)                                                  |
| AD-8 | Shell script DR tests                      | Existing backup/restore scripts already in shell. Reuse, don't rewrite.             | TypeScript-only DR (reinventing pg_dump/pg_restore)                                                |
| AD-9 | DB-backed on-call rotation                 | Self-contained, no PagerDuty lock-in. Discord bot provides the notification layer.  | PagerDuty-only (cost, vendor lock-in), spreadsheet (no automation)                                 |
