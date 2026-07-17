# ADR-0014: Domain SLO metrics and observability asset validation

## Status
Accepted

## Context
Platform-level metrics (request/error/latency) were in place, but MVP SLOs for workflow and ingest needed domain metrics with CI guardrails for dashboards and alerts.

## Decision
1. Add domain metrics in API:
   - `civictech_report_transition_total`
   - `civictech_report_workflows_completed_total`
   - `civictech_ingest_runs_total`
   - `civictech_ingest_rows_total`
   - `civictech_ingest_duration_seconds`
2. Update dashboards and alerts to use these metrics for workflow and ingest SLO visibility.
3. Add CI validation for observability assets:
   - JSON dashboard validation with `jq`
   - Prometheus config/rule validation with `promtool`

## Consequences
+ Workflow and ingest SLOs become measurable from first-class domain metrics.
+ Prometheus/Grafana changes are validated before merge.
- More metrics and CI checks increase maintenance cost modestly.
