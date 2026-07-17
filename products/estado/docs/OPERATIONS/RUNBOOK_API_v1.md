# Runbook API v1

## Common failure modes
1. API cannot connect to Postgres.
2. MinIO presign flow failing.
3. Elevated `5xx` responses.
4. Latency p95 regression.

## Quick checks
1. Infra health:
   - `docker compose -f infra/docker-compose.yml ps`
2. API health:
   - `curl -i http://localhost:8080/health`
   - `curl -s http://localhost:8080/metrics | head`
3. DB connectivity:
   - `psql "$DATABASE_URL" -c 'select 1'`
4. Recent errors:
   - Inspect application logs with trace IDs.
5. Observability status:
   - `curl -s http://localhost:9090/-/ready`
   - `curl -s http://localhost:3001/api/health`

## Mitigation playbook
- DB unavailable:
  1. Verify Postgres container and restart if needed.
  2. Check connection string and credentials.
- MinIO unavailable:
  1. Verify `minio` and `minio-init` are healthy.
  2. Validate `S3_*` env vars.
- High 5xx:
  1. Roll back latest change if correlated.
  2. Disable unstable path behind feature toggle where possible.

## Escalation
- Sev-1/2: trigger incident process and assign IC.
