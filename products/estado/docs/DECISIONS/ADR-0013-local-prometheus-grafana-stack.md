# ADR-0013: Local Prometheus and Grafana stack

## Status
Accepted

## Context
The project already exposes API metrics and alert rules, but contributors lacked a reproducible local stack to validate dashboards and alert behavior before merge.

## Decision
1. Add Prometheus and Grafana services to `infra/docker-compose.yml`.
2. Provision Grafana datasource and dashboards from repo-managed files.
3. Add scripts:
   - `pnpm obs:up` to start observability services.
   - `pnpm obs:smoke` to validate Prometheus/Grafana health and query path.

## Consequences
+ Contributors can validate observability changes locally.
+ Dashboard and alert changes become reviewable artifacts in PRs.
- Slightly higher local infra footprint (CPU/RAM).
