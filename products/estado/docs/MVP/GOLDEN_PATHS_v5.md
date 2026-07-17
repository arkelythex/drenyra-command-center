# Golden Paths v5 (Runnable)

## Path A: Transparency ingest to read API
1. Run infra and migrations.
2. Call `POST /admin/ingest/demo` with `Authorization: Bearer <ADMIN_TOKEN>`.
3. Verify `GET /public/datasets` returns at least one dataset source/version.
4. Verify `GET /public/expenses` returns ingested records.

## Path B: Report lifecycle with workflow invariants
1. `POST /reports` creates `DRAFT`.
2. `POST /reports/{id}/submit` moves to `SUBMITTED`.
3. `POST /moderation/cases/{id}/triage` moves to `TRIAGED`.
4. `POST /moderation/cases/{id}/verify` moves to `VERIFIED`.
5. `POST /moderation/reports/{id}/publish` with moderator/admin token creates publication and moves to `PUBLISHED`.
6. `GET /public/reports` exposes redacted publication.

## Guardrails
- Invalid transitions return HTTP 409.
- Every HTTP request appends an audit event row.
- Evidence upload uses MinIO presigned PUT URL generation.

## Automation
- Run all golden path checks with: `pnpm smoke:e2e`
