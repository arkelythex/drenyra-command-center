# Monorepo Bootstrap v3

## Goals
- Build MVP-A and MVP-B in parallel without premature microservices.
- Keep strict DDD boundaries with a modular monolith core.
- Expose a public API contract first (OpenAPI).

## Top-level layout
- `apps/`: product surfaces (public web, admin)
- `crates/`: Rust core (api, domain, usecases, adapters)
- `packages/`: UI tokens/components for TS apps
- `infra/`: local dependencies and migrations
- `openapi/`: API contracts

## Delivery path
1. Implement core domain invariants in `crates/domain`.
2. Add use cases and ports in `crates/usecases`.
3. Implement adapters (`pg`, `s3`, `redis`).
4. Wire routes in `crates/api` and keep OpenAPI in sync.
5. Build read-model views in `apps/web` and moderation flows in `apps/admin`.

## v5 runtime status
- `crates/api` now uses a real Postgres store (`sqlx`) for reports, evidence, datasets, and audit events.
- MinIO presigned upload flow is wired through `crates/adapters_s3`.
- Demo CSV ingestion path is wired through `POST /admin/ingest/demo`.
