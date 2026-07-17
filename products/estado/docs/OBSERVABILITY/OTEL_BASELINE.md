# OpenTelemetry Baseline

## Required signals
- Traces: HTTP requests, ingest jobs, verification transitions
- Metrics: request latency, ingest throughput, verification time
- Logs: structured logs with `trace_id`

## Local setup
- Collector config: `infra/otel-collector.yml`
- OTLP endpoints:
  - gRPC: `http://localhost:4317`
  - HTTP: `http://localhost:4318`
- Prometheus scrape config: `infra/prometheus/prometheus.yml`
- Grafana provisioning:
  - datasource: `infra/grafana/provisioning/datasources/prometheus.yml`
  - dashboards: `infra/grafana/provisioning/dashboards/dashboards.yml`

## Quick validation
1. Start API: `pnpm api:dev`
2. Start observability services: `pnpm obs:up`
3. Validate stack health: `pnpm obs:smoke`

## Rule
Any new critical flow must include trace spans and error-level logs.
