# Runbook Observability v1

## Symptoms
- No recent series in Prometheus for `civictech_*` metrics.
- Grafana dashboards show `N/A` or empty panels.
- Alert spikes for auth or API but no traceability.

## Quick checks
1. API metrics endpoint:
   - `curl -s http://localhost:8080/metrics | head`
2. Prometheus target status:
   - `http://localhost:9090/targets`
3. Grafana health:
   - `curl -s http://localhost:3001/api/health`
4. Full stack smoke:
   - `pnpm obs:smoke`
5. Assets validation (alerts/dashboards/prometheus):
   - `pnpm obs:validate`
6. Generate workflow metrics quickly (for dashboard sanity):
   - `pnpm smoke:workflow-b`

## Common causes
- API not running on host (`localhost:8080`).
- Prometheus cannot reach host gateway target.
- Grafana datasource provisioning mismatch.

## Mitigations
- Restart observability services:
  - `docker compose -f infra/docker-compose.yml up -d prometheus grafana`
- Restart API and re-check `/metrics`.
- Inspect Prometheus config and target:
  - `infra/prometheus/prometheus.yml`

## Escalation
- Sev-2 if observability is blind during production incident.
- Escalate to incident commander and attach target status and sample failed query.
