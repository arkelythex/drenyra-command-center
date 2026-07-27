# Observability & Operations Specification

**Change:** drenyra-observability-ops
**Created:** 2026-07-23
**Predecessor:** B3 Observability (CAP-FOUND-07)
**Scope:** Phases 1–3 — APM tracing, dashboards, alerting, incident response, support & reliability

---

## Domain: Distributed Tracing

### Purpose

End-to-end request tracing across Drenyra services using OpenTelemetry, enabling engineers to pinpoint latency bottlenecks and correlate failures across service boundaries without manual log correlation.

### Requirements

#### Requirement: Trace context propagation

The system MUST propagate a W3C trace context (`traceparent` header) across every service boundary: Web (React) → API (Elysia) → Data Engine (FastAPI) → external services (SUNAT, AI gateway).

##### Scenario: End-to-end trace for a fiscal report request

- GIVEN a user requests a fiscal report from the Web frontend
- WHEN the request flows through API → Data Engine → SUNAT
- THEN every span in the trace shares the same `traceId`
- AND the full waterfall is visible in a trace viewer showing per-service latency

##### Scenario: Trace ID in error responses

- GIVEN an API endpoint returns a 5xx error
- WHEN the error response is serialized
- THEN the response body MUST include the active `traceId`
- AND the frontend error capture MUST attach the same `traceId` to the client-side error report

##### Scenario: Trace context across AI swarm calls

- GIVEN an API request triggers an AI swarm completion
- WHEN the swarm orchestrator calls the AI gateway
- THEN the outbound request MUST carry the parent `traceparent` header
- AND the AI completion span MUST be a child of the originating API request span

#### Requirement: OpenTelemetry SDK instrumentation

The system MUST instrument all services with OpenTelemetry SDKs providing automatic instrumentation for HTTP, database (Drizzle), and fetch calls, plus manual spans for critical business paths.

##### Scenario: Auto-instrumentation of HTTP and DB

- GIVEN the API service is running with OpenTelemetry SDK enabled
- WHEN any inbound HTTP request is received OR any Drizzle database query is executed
- THEN a span is automatically created for that operation
- AND the span includes standard HTTP/DB attributes (method, url, status_code, db.statement)

##### Scenario: Manual span for fiscal calculation

- GIVEN the API processes a fiscal document
- WHEN the fiscal calculation function executes
- THEN a manual span named `fiscal.calculate` is created
- AND the span includes attributes: `document.type`, `document.amount`, `company.ruc`

##### Scenario: Manual span for SUNAT external call

- GIVEN the Data Engine submits a document to SUNAT
- WHEN the outbound HTTP call is initiated
- THEN a manual span named `sunat.submit` wraps the external call
- AND the span includes attributes: `sunat.endpoint`, `sunat.status_code`, `sunat.duration_ms`

#### Requirement: Trace sampling strategy

The system MUST support configurable trace sampling with 100% capture in dev/staging and adaptive sampling in production (10% base rate + 100% for errors).

##### Scenario: Production adaptive sampling

- GIVEN the sampling rate is configured as `{ base: 0.1, error: 1.0 }`
- WHEN a request succeeds with HTTP 200
- THEN the trace is sampled at 10% probability
- WHEN a request results in HTTP 5xx
- THEN the trace is sampled at 100% probability

##### Scenario: Development full capture

- GIVEN the environment is `development` or `staging`
- WHEN any request is processed
- THEN the trace is sampled at 100% regardless of the production sampling configuration

---

## Domain: Operations Dashboards

### Purpose

Real-time visibility into system health, request analytics, resource utilization, and business metrics surfaced through the admin panel and a standalone status page.

### Requirements

#### Requirement: System health dashboard

The system MUST provide a real-time system health view displaying service status, uptime percentage, and current incident count for each Drenyra service.

##### Scenario: Service status display

- GIVEN the operations dashboard is loaded
- WHEN the health check data is polled (every 30 seconds)
- THEN each service (API, data-engine, DB, AI gateway, SUNAT) shows its current status (healthy/degraded/down)
- AND the uptime percentage for the trailing 30 days is displayed per service
- AND the count of currently active incidents is shown

#### Requirement: Request analytics dashboard

The system MUST display request-per-minute (RPM), latency percentiles (p50/p95/p99), and error rate broken down by service and endpoint.

##### Scenario: Latency percentile visualization

- GIVEN the request analytics dashboard is loaded
- WHEN the metrics data is queried for the selected time window
- THEN a chart displays p50, p95, and p99 latency values per service
- AND the user MAY filter by endpoint and time range (1h, 6h, 24h, 7d)

##### Scenario: Error rate by endpoint

- GIVEN the request analytics dashboard is loaded
- WHEN error metrics are aggregated
- THEN each endpoint shows its error rate as a percentage of total requests
- AND endpoints exceeding 5% error rate are visually highlighted

#### Requirement: Resource utilization dashboard

The system MUST display CPU, memory, database connection pool usage, and AI token consumption per service.

##### Scenario: DB connection pool monitoring

- GIVEN the resource dashboard is loaded
- WHEN DB connection pool metrics are queried
- THEN the current pool utilization percentage is displayed
- AND a time-series chart shows pool usage over the selected window
- AND a threshold line at 80% is visually marked

##### Scenario: AI token consumption tracking

- GIVEN the resource dashboard is loaded
- WHEN AI swarm metrics are queried
- THEN total tokens consumed per day and cost estimate are displayed
- AND the daily trend over the trailing 30 days is shown

#### Requirement: Business metrics dashboard

The system MUST display active companies count, fiscal documents processed per hour, and AI swarm cost per day.

##### Scenario: Fiscal document throughput

- GIVEN the business metrics dashboard is loaded
- WHEN document processing metrics are queried
- THEN the number of fiscal documents processed in the current hour is displayed
- AND a daily aggregate for the trailing 7 days is shown

#### Requirement: Alert timeline in dashboard

The system MUST display a chronological timeline of recent alerts with their acknowledgment status.

##### Scenario: Alert timeline display

- GIVEN the operations dashboard is loaded
- WHEN alert data is queried
- THEN the 50 most recent alerts are displayed in reverse chronological order
- AND each alert shows severity, timestamp, service, and acknowledgment status
- AND the user MAY filter by acknowledged/unacknowledged

---

## Domain: Alerting Engine

### Purpose

Rule-based alert evaluation with severity classification and multi-channel notification routing so degradations are detected and escalated before users notice.

### Requirements

#### Requirement: Alert rule evaluation

The system MUST evaluate alert rules against collected metrics on a configurable interval and fire alerts when conditions are met.

##### Scenario: Error rate spike alert

- GIVEN the alert rule "API error rate spike" is configured with threshold >5% over 5 minutes
- WHEN the API error rate exceeds 5% sustained for 5 consecutive minutes
- THEN a CRITICAL severity alert is fired
- AND the alert includes: rule name, current error rate, threshold, affected service, and timestamp

##### Scenario: DB connection pool exhaustion alert

- GIVEN the alert rule "DB connection pool exhaustion" is configured with threshold >90% for 2 minutes
- WHEN the DB connection pool utilization exceeds 90% sustained for 2 consecutive minutes
- THEN a CRITICAL severity alert is fired

##### Scenario: Latency degradation alert

- GIVEN the alert rule "P95 latency degradation" is configured with threshold >2x baseline for 10 minutes
- WHEN the P95 latency exceeds twice the 7-day rolling baseline sustained for 10 minutes
- THEN a WARNING severity alert is fired

##### Scenario: Health check failure alert

- GIVEN the alert rule "Health check failure" is configured with threshold 3 consecutive failures
- WHEN any health check endpoint fails 3 consecutive evaluations
- THEN a CRITICAL severity alert is fired

##### Scenario: No alert on transient spike

- GIVEN the alert rule "API error rate spike" requires 5 minutes of sustained degradation
- WHEN the error rate spikes above threshold for 3 minutes and then recovers
- THEN no alert is fired

#### Requirement: Severity classification

The system MUST classify every alert into one of four severities: CRITICAL, WARNING, INFO, or ACKNOWLEDGED (post-intervention), and allow on-call engineers to change severity.

##### Scenario: Severity downgrade

- GIVEN a CRITICAL alert is active
- WHEN an on-call engineer assesses it as non-critical
- THEN the engineer MAY downgrade severity to WARNING or INFO
- AND the change is logged in the alert audit trail

#### Requirement: Notification routing

The system MUST route alerts to notification channels based on severity: CRITICAL to PagerDuty and Discord, WARNING to Discord, INFO to email digest.

##### Scenario: CRITICAL alert notification

- GIVEN a CRITICAL severity alert is fired
- WHEN the notification router processes the alert
- THEN a PagerDuty incident is created
- AND a Discord message is posted to the team alerts channel
- AND the message includes: alert name, severity, service, timestamp, and a direct link

##### Scenario: WARNING alert notification

- GIVEN a WARNING severity alert is fired
- WHEN the notification router processes the alert
- THEN a Discord message is posted to the team alerts channel
- AND no PagerDuty incident is created

##### Scenario: Certificate expiry notification

- GIVEN a TLS certificate expires in fewer than 30 days
- WHEN the certificate expiry check runs
- THEN a WARNING alert is fired
- AND an email digest entry is queued for the weekly operations summary

#### Requirement: Alert acknowledgment and lifecycle

The system MUST allow on-call engineers to acknowledge, resolve, or suppress alerts, and MUST track the full alert lifecycle with timestamps.

##### Scenario: Acknowledge an alert

- GIVEN an alert is fired and unacknowledged
- WHEN an on-call engineer acknowledges the alert
- THEN the alert status changes to ACKNOWLEDGED
- AND the acknowledgment timestamp and engineer identity are recorded

##### Scenario: Alert silencing

- GIVEN a known maintenance window is active
- WHEN an alert rule fires during the maintenance window
- THEN the alert is evaluated but notifications are suppressed
- AND the alert is logged with `suppressed: true` and reason `maintenance-window`

---

## Domain: Runbook Automation

### Purpose

Structured incident response runbooks defined as code that guide on-call engineers through diagnosis, mitigation, and escalation for common incident classes.

### Requirements

#### Requirement: Runbook definition format

The system MUST support runbooks defined in YAML with structured diagnosis steps, mitigation actions, and escalation rules.

##### Scenario: Runbook YAML parsing

- GIVEN a runbook YAML file at `runbooks/api-high-error-rate.yaml`
- WHEN the runbook engine loads the file
- THEN the engine parses: incident identifier, severity, diagnosis steps (with commands and expected outputs), mitigation actions (with commands), and escalation timeout with target role
- AND invalid runbook YAML causes a validation error without crashing the engine

#### Requirement: Runbook execution engine

The system MUST provide a runbook execution interface that guides the on-call engineer step-by-step through diagnosis → mitigation → escalation.

##### Scenario: Guided diagnosis

- GIVEN an on-call engineer activates the "API high error rate" runbook
- WHEN the execution engine starts
- THEN the first diagnosis step is displayed with its description and suggested command
- AND the engineer MAY mark the step complete, skip it, or record a custom observation
- AND the engine advances to the next step only after the current step is resolved

##### Scenario: Escalation timeout

- GIVEN a runbook with `escalation.after: 15min` is active
- WHEN 15 minutes elapse since the runbook was started without resolution
- THEN the runbook engine triggers escalation to the configured target role
- AND the escalation event is logged in the incident timeline

#### Requirement: Initial runbook library

The system MUST ship with runbooks for at least four incident classes: API high error rate, DB pool exhaustion, AI swarm degradation, and SUNAT unreachability.

##### Scenario: DB pool exhaustion runbook

- GIVEN the "DB pool exhaustion" runbook is loaded
- WHEN an on-call engineer executes it
- THEN the diagnosis steps include: checking active connections via `pg_stat_activity`, checking recent deploys, and identifying connection-leaking queries
- AND mitigation steps include: restarting the API service and terminating idle connections

---

## Domain: On-Call Management

### Purpose

Self-contained on-call rotation management with schedules, escalation policies, and shift handoff, integrated via Discord bot notifications.

### Requirements

#### Requirement: On-call rotation schedules

The system MUST support weekly, bi-weekly, and follow-the-sun rotation schedules with configurable handoff days.

##### Scenario: Weekly rotation with Monday handoff

- GIVEN an on-call rotation "Engineering Primary" with `schedule: weekly` and `handoffDay: monday`
- WHEN the current week ends (Sunday 23:59 UTC)
- THEN the rotation advances to the next member in the ordered member list
- AND a Discord notification announces the handoff with the new on-call engineer's name
- AND the handoff event is recorded in the rotation history

##### Scenario: Bi-weekly rotation

- GIVEN an on-call rotation with `schedule: biweekly`
- WHEN two weeks elapse since the last handoff
- THEN the rotation advances to the next member

#### Requirement: Escalation policies

The system MUST support multi-level escalation policies with configurable timeouts per level.

##### Scenario: Three-level escalation

- GIVEN an escalation policy with level1 (5min, primary on-call), level2 (15min, engineering lead), level3 (30min, CTO)
- WHEN a CRITICAL alert is unacknowledged for 5 minutes
- THEN the level2 target (engineering lead) is notified
- WHEN still unacknowledged after 15 minutes
- THEN the level3 target (CTO) is notified

##### Scenario: Escalation reset on acknowledgment

- GIVEN a level2 escalation notification has been sent
- WHEN the primary on-call engineer acknowledges the alert
- THEN the escalation chain resets
- AND no further escalation notifications are sent for this alert

#### Requirement: Shift handoff protocol

The system MUST generate a structured handoff summary at rotation boundaries including active incidents, recent alerts, and pending action items.

##### Scenario: Handoff summary generation

- GIVEN a rotation handoff is triggered
- WHEN the handoff protocol executes
- THEN a summary is generated containing: unacknowledged alerts, active incidents with duration, P0/P1 action items from recent post-mortems, and notes from the outgoing engineer
- AND the summary is posted to Discord and stored in the incident log

#### Requirement: Discord bot integration

The system MUST integrate with Discord for on-call notifications, handoffs, and alert acknowledgments without requiring external PagerDuty dependency.

##### Scenario: Discord alert acknowledgment

- GIVEN a CRITICAL alert is posted to the alerts Discord channel
- WHEN an on-call engineer reacts with an acknowledgment emoji or slash command
- THEN the alert is marked ACKNOWLEDGED in the alerting engine
- AND the acknowledgment is attributed to the Discord user

---

## Domain: SLI/SLO Tracking

### Purpose

Define, measure, and report on Service Level Indicators and Objectives with error budget calculation and burn rate alerting.

### Requirements

#### Requirement: SLI definitions

The system MUST support at least five initial SLIs: API availability, API latency (P95 for fiscal endpoints), Data Engine availability, AI swarm availability, and health check pass rate.

##### Scenario: API availability SLI calculation

- GIVEN the SLI "API availability" is defined as percentage of non-5xx responses
- WHEN the monthly compliance window is evaluated
- THEN the SLO compliance percentage is calculated as `(total_requests - 5xx_responses) / total_requests * 100`

##### Scenario: API latency SLI calculation

- GIVEN the SLI "API latency" is defined as P95 response time for fiscal endpoints
- WHEN the trailing 30-day window is evaluated
- THEN the P95 latency in milliseconds is computed from all fiscal endpoint requests in that window
- AND the compliance status (met/exceeded) is determined against the SLO target of <500ms

#### Requirement: Error budget tracking

The system MUST calculate error budgets from SLO targets and track consumption with burn rate visualization.

##### Scenario: Error budget consumption alert at 50%

- GIVEN the API availability SLO target is 99.9% (monthly error budget: 43.2 minutes of downtime)
- WHEN 21.6 minutes of downtime have been accumulated in the current month
- THEN a WARNING alert fires: "API error budget 50% consumed"
- AND the burn rate is displayed on the SLO dashboard

##### Scenario: Error budget exhausted alert

- GIVEN the API availability SLO target is 99.9%
- WHEN the monthly error budget is fully consumed (43.2 minutes of downtime)
- THEN a CRITICAL alert fires: "API error budget exhausted"
- AND the SLO dashboard shows the SLO as "breached" for the current month

#### Requirement: SLO compliance dashboard

The system MUST display SLO compliance for all defined SLIs over trailing 7-day, 30-day, and 90-day windows.

##### Scenario: Multi-window SLO view

- GIVEN the SLO dashboard is loaded
- WHEN compliance data is queried
- THEN each SLI shows compliance percentage for 7d, 30d, and 90d windows
- AND SLIs below their SLO target are visually highlighted in red
- AND a burn rate chart shows error budget consumption over time for the current window

---

## Domain: Post-Mortem Automation

### Purpose

Structured post-incident analysis with automated timeline generation from alert, deploy, and health check data, ensuring incidents produce action items and prevention tracking.

### Requirements

#### Requirement: Automated timeline generation

The system MUST auto-generate an incident timeline from correlated alert logs, deployment records, and health check data.

##### Scenario: Timeline from alert + deploy + health data

- GIVEN an incident spanning 23 minutes with: an alert at 14:32, an API health check failure at 14:30, and a deployment at 14:28
- WHEN the post-mortem generator runs for that incident
- THEN the generated timeline includes entries for: the deployment event (14:28), the first health check failure (14:30), the alert firing (14:32), acknowledgment (14:34), and resolution (14:55)
- AND each entry is timestamped and sourced from its origin system (deploy log, health check, alert engine)

##### Scenario: Manual timeline augmentation

- GIVEN an auto-generated timeline with 5 events
- WHEN the incident responder adds 2 manual timeline entries (e.g., "identified root cause as connection leak", "restarted API service")
- THEN the final timeline includes all 7 entries in chronological order
- AND manual entries are visually distinguished from auto-generated entries

#### Requirement: Post-mortem template

The system MUST generate a structured post-mortem document from a template including: incident metadata, timeline, root cause analysis, impact assessment, and action items.

##### Scenario: Post-mortem document generation

- GIVEN an incident has been resolved
- WHEN the post-mortem generator is invoked
- THEN a markdown document is created with sections: metadata (date, duration, severity, detection method, responders), timeline, root cause, impact assessment (users affected, data affected, revenue impact if quantifiable), and action items
- AND the document is saved to `postmortems/{year}/{month}/{incident-id}-{slug}.md`

#### Requirement: Action item tracking

The system MUST extract action items from post-mortem documents and track their completion status.

##### Scenario: Action item lifecycle

- GIVEN a post-mortem has 3 action items with priorities (P0, P1, P2) and owners
- WHEN the action item tracker processes the post-mortem
- THEN each action item is created as a trackable item with status "open"
- AND action items appear in the on-call handoff summary until completed
- AND overdue P0 action items (not completed within SLA) generate a weekly reminder

---

## Domain: Support Portal

### Purpose

Self-service tenant interface providing system status visibility, tenant-specific metrics, and support ticket management.

### Requirements

#### Requirement: Public status page

The system MUST provide a public status page displaying current system status, incident history, and upcoming maintenance for all Drenyra services.

##### Scenario: Current status display

- GIVEN a tenant visits the public status page
- WHEN the page loads
- THEN each service (API, Web, Data Engine, AI) shows a status indicator (operational/degraded/outage/maintenance)
- AND the overall system status banner reflects the worst service status
- AND the page loads statically (no authentication required)

##### Scenario: Incident history visibility

- GIVEN the public status page is loaded
- WHEN the visitor scrolls to incident history
- THEN resolved incidents from the trailing 90 days are listed with date, duration, and summary
- AND active incidents are displayed prominently at the top of the page

#### Requirement: Tenant-specific dashboard

The system MUST provide authenticated tenants with a dashboard showing their own metrics: documents processed, API usage, error rate for their RUC, and their support ticket status.

##### Scenario: Tenant metric visibility

- GIVEN a tenant is authenticated with RUC `20123456789`
- WHEN they access their tenant dashboard
- THEN they see: fiscal documents processed this month (filtered to their RUC), API calls made (count by endpoint), error rate for their requests, and their open support tickets with status
- AND they CANNOT see metrics for other tenants

#### Requirement: Support ticket interface

The system MUST allow authenticated tenants to file, view, and track support tickets from the portal.

##### Scenario: Ticket filing

- GIVEN an authenticated tenant
- WHEN they submit a support ticket with category, subject, and description
- THEN a ticket is created with status "open" and a unique ticket ID
- AND the ticket is visible in their ticket list immediately
- AND the tenant receives a confirmation with the ticket ID

##### Scenario: Ticket status tracking

- GIVEN a tenant has 3 support tickets (1 open, 1 in-progress, 1 resolved)
- WHEN they view their ticket list
- THEN each ticket shows: ID, subject, status, created date, and last update date
- AND they MAY filter by status

#### Requirement: Incident subscription

The system MUST allow tenants to subscribe to incident updates for services they depend on.

##### Scenario: Incident subscription and notification

- GIVEN a tenant subscribes to incident updates for the API service
- WHEN a CRITICAL incident is created for the API service
- THEN the tenant receives an email notification with incident summary and a link to the status page
- AND when the incident is resolved, the tenant receives a resolution notification

---

## Domain: Disaster Recovery Testing

### Purpose

Automated DR drills validating backup restoration and service recovery procedures on a regular schedule with published results.

### Requirements

#### Requirement: DR scenario definitions

The system MUST support at least four DR test scenarios: database restore validation, service failover simulation, configuration recovery, and full stack recovery.

##### Scenario: Database restore test

- GIVEN a database restore DR scenario is defined
- WHEN the DR runner executes it
- THEN the latest production backup is restored to an isolated sandbox environment
- AND data integrity checks run against the restored database (row counts, checksums on critical tables)
- AND the result (pass/fail) with detailed metrics is published to the DR dashboard
- AND any failure generates a P1 incident

##### Scenario: Service failover test

- GIVEN a service failover DR scenario is defined
- WHEN the DR runner executes it
- THEN the target service (e.g., API) is temporarily taken down in a staging environment
- AND the health check routing is validated to confirm traffic redirection
- AND the service is restored and verified operational within 5 minutes

#### Requirement: DR test scheduling

The system MUST support configurable DR test schedules with recommended defaults: database restore weekly, full stack recovery monthly.

##### Scenario: Weekly database restore schedule

- GIVEN the DR scheduler is configured for weekly database restore tests (every Monday 03:00 UTC)
- WHEN the scheduled time arrives
- THEN the database restore scenario executes automatically
- AND results are published to the DR dashboard within 30 minutes of completion
- AND a summary is posted to the team Discord channel

##### Scenario: Manual DR test trigger

- GIVEN an engineer needs to run an off-schedule DR test
- WHEN they trigger a DR scenario manually via the admin panel or CLI
- THEN the scenario executes immediately with the same validation and reporting as scheduled tests

#### Requirement: DR results dashboard

The system MUST display DR test history, pass/fail rates, and detailed test results for each scenario.

##### Scenario: DR compliance view

- GIVEN the DR dashboard is loaded
- WHEN DR test history is queried
- THEN each scenario shows: last run date, last result (pass/fail), pass rate over trailing 90 days, and next scheduled run
- AND any scenario with a failing test in the last 30 days is visually highlighted

---

## Domain: Feature Flags

### Purpose

Operational feature toggles enabling safe deployments, dark launches, kill-switches, and tenant-targeted feature rollouts without requiring code deploys.

### Requirements

#### Requirement: Boolean feature flags

The system MUST support boolean feature flags that can be toggled on/off at runtime without a deployment.

##### Scenario: Kill-switch activation

- GIVEN a feature flag `fiscal-batch-v2` is enabled in production
- WHEN a critical bug is discovered
- THEN an operator MAY disable the flag via the admin panel or API
- AND the feature is deactivated across all application instances within the flag cache TTL (maximum 60 seconds)
- AND the flag change is recorded in the audit log with operator identity and timestamp

##### Scenario: Flag evaluation at request time

- GIVEN the feature flag `fiscal-batch-v2` is disabled
- WHEN any request enters the fiscal batch processing code path
- THEN the flag is evaluated and the v2 code path is NOT executed
- AND the v1 (default) code path executes instead

#### Requirement: Percentage-based rollouts

The system MUST support percentage-based feature flag rollouts allowing gradual traffic shifting.

##### Scenario: 10% canary rollout

- GIVEN the feature flag `new-dashboard` is configured for a 10% rollout
- WHEN 1000 requests are evaluated
- THEN approximately 100 requests (10% ± 2%) see the new dashboard
- AND the same user consistently sees the same variant (sticky assignment based on user/session identifier)

##### Scenario: Rollout percentage adjustment

- GIVEN the feature flag `new-dashboard` is at 10%
- WHEN an operator increases the rollout to 50%
- THEN subsequent evaluations reflect the new percentage within the cache TTL
- AND the change is recorded in the audit log

#### Requirement: Tenant-targeted flags

The system MUST support feature flags that target specific tenants (by RUC) for beta program enrollment.

##### Scenario: Tenant-specific beta enablement

- GIVEN the feature flag `beta-sunat-direct` is configured with target RUCs `["20123456789", "20987654321"]`
- WHEN a request arrives from RUC `20123456789`
- THEN the flag evaluates to `true`
- WHEN a request arrives from RUC `20999999999`
- THEN the flag evaluates to `false`

#### Requirement: Feature flag audit log

The system MUST record every flag creation, modification, and deletion with operator identity, timestamp, old value, and new value.

##### Scenario: Flag change audit

- GIVEN an operator changes the `fiscal-batch-v2` flag from enabled to disabled
- WHEN the change is persisted
- THEN an audit entry is created with: flag name, operator ID, old value (`true`), new value (`false`), timestamp, and optional reason
- AND the audit entry is immutable and queryable from the admin panel

#### Requirement: Feature flag expiry

The system MUST support hard expiry dates on feature flags and MUST surface warnings for flags exceeding 30 days without modification.

##### Scenario: Flag expiry warning

- GIVEN the feature flag `old-batch-processor` has not been modified in 35 days
- WHEN the flag health check runs (daily)
- THEN a WARNING is surfaced in the flag management dashboard: "Flag 'old-batch-processor' exceeds 30-day expiry — consider removal"
- AND the flag is listed in the weekly operations digest as a cleanup candidate

##### Scenario: Expired flag enforcement

- GIVEN the feature flag `old-batch-processor` has an explicit expiry date that has passed
- WHEN the flag is evaluated
- THEN the evaluation returns the default value (false)
- AND the evaluation reason is logged as "expired"

---

## Cross-Cutting Acceptance Criteria

These criteria span multiple domains and validate the integrated system.

### AC-1: End-to-end trace

A fiscal report request from the Web frontend SHALL produce a complete distributed trace visible in the trace viewer, with spans for Web → API → Data Engine → SUNAT, all sharing the same `traceId`.

### AC-2: Alert from degradation to notification

A sustained DB connection pool at ≥90% utilization SHALL fire a Discord alert within 2 minutes of the sustained condition being met.

### AC-3: Runbook-guided mitigation

An on-call engineer SHALL be able to follow a runbook from alert acknowledgment to mitigation within 10 minutes for a common incident class (API high error rate, DB pool exhaustion, AI swarm degradation, or SUNAT unreachability).

### AC-4: SLO dashboard with error budget

Monthly SLO compliance for all five SLIs SHALL be visible on the SLO dashboard, and error budget consumption at 50%, 80%, and 100% SHALL trigger alerts automatically.

### AC-5: Auto-generated post-mortem timeline

A post-mortem timeline SHALL be auto-generated from correlated alert, deploy, and health check data with no more than 5 minutes of manual cleanup required from the incident responder.

### AC-6: Weekly DR test

A database restore DR test SHALL execute automatically every week with results published to the DR dashboard. Any failure SHALL generate a P1 incident within 15 minutes of test completion.

### AC-7: Runtime feature kill-switch

A feature SHALL be toggled off in production within 60 seconds (flag cache TTL) without requiring a code deploy, and the change SHALL be recorded in the immutable audit log.

### AC-8: Tenant self-service

A tenant SHALL be able to check system status on the public status page (no auth), view tenant-specific metrics on their dashboard (authenticated), and file a support ticket from the portal.

---

## Non-Goals (Spec-Level)

- No ML-based anomaly detection or dynamic threshold adjustment
- No custom Prometheus/Grafana infrastructure (use managed or lightweight alternatives)
- No multi-region disaster recovery (single-region restore testing only)
- No real-time chat support (portal is ticket-based)
- No feature flag A/B experiment analytics or metrics
- No AI-driven automated incident response
- No vendor lock-in to external APM products (OpenTelemetry is vendor-neutral)
