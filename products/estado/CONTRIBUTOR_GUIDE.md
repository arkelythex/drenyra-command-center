# Contributor Guide

## Goal
Provide a reproducible local setup for contributors in less than 10 minutes.

## Prerequisites
- `git`
- `docker` + `docker compose`
- `psql`
- `pnpm` (recommended: v9)
- `cargo` (Rust stable)

## First-time setup
1. Clone repository.
2. Run bootstrap:
   ```bash
   pnpm bootstrap
   ```
3. Start API:
   ```bash
   pnpm api:dev
   ```
4. In another terminal start apps:
   ```bash
   pnpm dev
   ```

Alternative one-command local run:
```bash
pnpm dev:all
```

## Data setup options
- API-driven demo ingest:
  ```bash
  curl -X POST http://localhost:8080/admin/ingest/demo -H 'authorization: Bearer dev-admin-token'
  ```
- SQL seed data:
  ```bash
  pnpm db:seed
  ```

## Run smoke tests (golden paths A/B)
```bash
pnpm smoke:e2e
pnpm smoke:workflow-b
```
Default protected-endpoint token in local mode: `dev-admin-token` (`AUTH_MODE=dev_static`).

## Observability smoke
```bash
pnpm obs:up
pnpm obs:smoke
pnpm obs:validate
```

## OIDC RBAC validation (Keycloak local)
1. Set `AUTH_MODE=oidc` in `.env`.
2. Restart API (`pnpm api:dev`).
3. Run:
   ```bash
   pnpm keycloak:wait
   pnpm smoke:rbac
   ```
4. Inspect auth metrics:
   ```bash
   curl -s http://localhost:8080/metrics | grep civictech_auth_decisions_total
   ```

## Typical contribution flow
1. Create a branch from `main`.
2. Make focused changes.
3. Run quality checks:
   ```bash
   pnpm quality:check
   ```
4. If scope is major, create/update RFC in `docs/RFCS/`.
5. If architecture changes, update ADR in `docs/DECISIONS/`.
6. Open PR with template and linked issue/RFC.

## Common troubleshooting
- API cannot connect to DB:
  - verify `docker compose -f infra/docker-compose.yml ps`
  - verify `DATABASE_URL` in `.env`
- Migration fails:
  - rerun `pnpm db:migrate`
  - ensure `psql` is installed
- MinIO upload issues:
  - check `minio` and `minio-init` containers are up
  - confirm `S3_*` vars from `.env.example`

## Reference docs
- `README.md`
- `CONTRIBUTING.md`
- `docs/ENGINEERING_QUALITY.md`
- `docs/MVP/GOLDEN_PATHS_v5.md`
