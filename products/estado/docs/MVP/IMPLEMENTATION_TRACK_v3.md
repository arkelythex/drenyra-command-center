# Dual MVP Implementation Track (v3)

## Objective
Ship MVP-A and MVP-B in parallel using one modular core and shared platform capabilities.

## Shared platform first
1. Apply `infra/migrations/0001_init.sql`.
2. Enable audit event writes for all state transitions.
3. Add request tracing and correlation IDs (OTel).
4. Enable PII segregation and retention controls.

## Track A (Transparency)
1. Implement dataset source registration.
2. Implement ingestion jobs and version checksums.
3. Persist normalized expense records.
4. Expose read APIs (`/public/datasets`, `/public/expenses`).
5. Build public dashboard in `apps/web`.

## Track B (Reports and Verification)
1. Implement report draft and submit flow.
2. Implement evidence metadata + object storage upload flow.
3. Implement verification case state transitions.
4. Implement redaction and publication flow.
5. Expose redacted feed in `apps/web` and moderation flows in `apps/admin`.

## Definition of done (v3)
- OpenAPI matches implemented routes.
- Every critical state transition emits an audit event.
- Public APIs never expose sensitive fields.
- CI passes for Rust and JS workspaces.

## v5 update
- `POST /admin/ingest/demo` implemented for CSV bootstrap.
- Workflow transitions implemented for `submit`, `triage`, `verify`, `publish`.
- Evidence upload now issues MinIO-compatible presigned URLs.
