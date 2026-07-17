# SLOs v1

## Scope
Initial reliability objectives for API and critical MVP user flows.

## Services in scope
- Public API (`civictech-api`)
- Transparency read endpoints
- Reports workflow endpoints

## SLI definitions
1. API availability SLI
- Definition: successful responses (`2xx`, `3xx`, `4xx`) / total requests.
- Excludes `5xx` and connection errors.

2. API latency SLI (p95)
- Definition: p95 latency for API requests by endpoint group.

3. Workflow success SLI (MVP-B)
- Definition: completed report transitions (`DRAFT->SUBMITTED->TRIAGED->VERIFIED->PUBLISHED`) / started workflows.
- Baseline metrics:
  - `civictech_report_transition_total`
  - `civictech_report_workflows_completed_total`
  - `civictech_report_resolution_seconds`

4. Ingest freshness SLI (MVP-A)
- Definition: percentage of expected ingest runs completed within schedule window.
- Baseline metrics:
  - `civictech_ingest_runs_total{result="success"}`
  - `civictech_ingest_duration_seconds`

5. Auth reliability SLI
- Definition: percentage of auth checks without backend failures (`civictech_auth_decisions_total{decision="auth_error"}`).

## SLO targets (initial)
- API availability: 99.5% per rolling 30 days.
- API latency p95:
  - `GET /public/*`: <= 600ms
  - `POST /reports*` and moderation transitions: <= 1000ms
- Workflow success: >= 95% per rolling 30 days.
- Ingest freshness: >= 98% per rolling 30 days.
- Auth reliability: 99.9% per rolling 30 days.

## Error budgets
- Availability error budget at 99.5% over 30 days: 0.5% downtime budget.
- Burn policy:
  - Fast burn: >10% budget consumed in 24h -> incident review.
  - Slow burn: >50% budget consumed in 15 days -> reliability sprint required.

## Measurement notes
- Use OpenTelemetry traces/metrics and Prometheus-compatible aggregation.
- Publish weekly SLO review note in operations channel.
