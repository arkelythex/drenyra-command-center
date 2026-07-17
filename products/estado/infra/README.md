# Infra Local Stack

Services:
- Postgres (`localhost:5432`)
- Redis (`localhost:6379`)
- MinIO (`localhost:9000`, console `localhost:9001`)
- Keycloak (`localhost:8081`)
- OpenTelemetry Collector (`localhost:4317`, `localhost:4318`)
- Prometheus (`localhost:9090`)
- Grafana (`localhost:3001`, user/pass `admin`/`admin`)

## Run
```bash
docker compose -f infra/docker-compose.yml up -d
```
`minio-init` creates the `evidence` bucket automatically.

## Apply first migration
```bash
./scripts/migrate.sh
```

## Load deterministic seed (optional)
```bash
./scripts/seed.sh
```

## Local OIDC provider
- Realm import: `configs/keycloak/realm-civictech.json`
- Validate RBAC with:
```bash
pnpm smoke:rbac
```

## Metrics
- API exposes Prometheus metrics at `http://localhost:8080/metrics`
- Includes request counters/latency and auth decision counters

## Observability quickstart
1. Start API (`pnpm api:dev`).
2. Start observability stack:
```bash
pnpm obs:up
```
3. Validate:
```bash
pnpm smoke:workflow-b
pnpm obs:smoke
pnpm obs:validate
```
4. Open Grafana at `http://localhost:3001` (dashboard auto-provisioned from `infra/dashboards/`).
