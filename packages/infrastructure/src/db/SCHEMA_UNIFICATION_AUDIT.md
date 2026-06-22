# Schema Unification Audit (2026-02-27)

Current source of truth: `packages/persistence/src/schema`

Temporary compatibility surface: `packages/infrastructure/src/db/drizzle/schema.ts`

## Progress Sync (2026-02-28)

- `scripts/seed-demo-casos.ts` migrated to the modular schema.
- `packages/infrastructure/src/services/sunat-knowledge/sunat-2026.seed.ts` now imports types from the modular barrel.
- `packages/infrastructure/src/services/ai-cost/ai-cost.repository.ts` now uses `db/client` + modular schema exports.
- `packages/infrastructure/src/services/swarm-consensus/anomaly-alert.repository.ts` now uses `db/client` + modular schema exports.
- `packages/infrastructure/src/db/repositories/*` now route through `legacy-compat.schema.ts` instead of importing the monolithic legacy file directly.
- `packages/infrastructure/src/db/repositories/postgres-provider.repository.ts` now persists through `business_partners + vendor_profiles` and uses a compatibility bridge only for `organizationId -> companyId`.
- `packages/infrastructure/src/db/repositories/postgres-client.repository.ts` now persists through `business_partners + customer_profiles` and uses the same compatibility bridge only for `organizationId -> companyId`.
- `packages/infrastructure/src/db/repositories/postgres-transaction.repository.ts` now persists through the modular `transactions` table and uses the same compatibility bridge only for `organizationId -> companyId`.
- `business_partners` now carries `partner_document_type`, `phone`, and `address` in the modular schema; additive SQL is staged in `drizzle/0015_business_partners_contact_fields.sql`.
- `postgres-invoice.repository.ts` is now modular-only for live reads, tenant-aware for writes, and fail-fast on unscoped write methods so it cannot issue SQL against the removed legacy invoice shape.
- `packages/application` create/update invoice use cases now call the tenant-aware path when `organizationId` is present in the DTO, with an explicit fail-fast path for older callers that still omit tenant context.
- `document.repository.ts` now uses the canonical `documents.schema.ts` surface; `documents.schema.ts` was aligned to the actual domain contract and `drizzle/0016_documents_pipeline.sql` stages the forward-only table creation for environments where `documents` still does not exist.
- `packages/application` document creation flows (`upload-document`, `smart-ingest`) now require `organizationId` and call `saveForOrganization(document, organizationId)` by default.
- `document.repository.ts` now fail-fast on unscoped `save()` calls so new writes cannot bypass tenant context.
- The async document pipeline now carries `organizationId` in the job payload (`dispatchDocumentProcessing`, `document-processor.queue`, `document-processor.worker`) and uses `findByIdForOrganization` / `updateForOrganization` during processing.
- `DocumentFilters` and kanban reads are now organization-scoped; `findAll`, `count`, `findByStatus`, `findPendingValidation`, and `findReadyForProcessing` all require tenant context, and `findById()` also fails fast when called without scope.
- `documents` is now on the first step of an identity migration: `drizzle/0017_documents_company_id.sql` adds `company_id`, backfills it from the legacy organization/company bridge when the legacy table exists, and new document writes now persist both `organizationId` and `companyId` on a best-effort basis.
- During the transition, document reads/updates scope by `company_id` first when the legacy bridge is available, with a fallback to `organization_id` for environments (like the current local DB) where the legacy `organizations` table no longer exists or older rows have not been backfilled yet.
- `DocumentRepository` now exposes parallel `*ForCompany(...)` methods so new callers can target `companyId` directly, while `*ForOrganization(...)` remains as the transitional wrapper.
- `UploadDocumentUseCase`, `ProcessDocumentUseCase`, and `ValidateDocumentUseCase` now prefer `companyId` when the application boundary provides it, and fall back to `organizationId` only for transitional callers.
- `GetKanbanBoardUseCase` now uses an object-based tenant contract only (`execute({ companyId|organizationId, clientId? })`); `companyId` is the primary path and `organizationId` remains as compatibility inside the object shape.
- `DocumentFilters` is now tenant-aware at the domain boundary (`companyId` primary, `organizationId` fallback), and `document.repository.ts` resolves `findAll` / `count` directly through `company_id` when the filter already carries a company scope.
- The `DocumentRepository` port no longer exposes special kanban query methods; application reads now go through `findAll(filters)` with tenant-aware filters, which keeps the public contract smaller and easier to retire safely.
- `document.repository.ts` no longer keeps the old status-specific query methods either; those shims were removed from the adapter once the application stopped calling them.
- The active `document` contract is now company-scoped in domain/application (`companyId` required in DTOs, use cases, queue payloads, and filters). Legacy `organizationId` remains only inside the infrastructure bridge that keeps older rows readable while `company_id` backfill finishes.
- `bun run documents:company-id:report` now audits `documents.company_id` coverage, reports unresolved legacy-linked rows, and gives a concrete bridge-removal recommendation before we touch runtime behavior.
- `bun run documents:company-id:backfill` now stages the backfill workflow with a dry-run default; only `bun run documents:company-id:backfill -- --apply` mutates rows, and only when `organizations` still exists in the target environment.
- `GetKanbanBoardUseCase` now performs a single tenant-scoped `findAll(filters)` call and groups documents in memory, eliminating the previous one-query-per-status pattern while keeping the same public contract.
- `DocumentRepository.count(filters)` now runs `COUNT(*)` in PostgreSQL instead of materializing document rows and using `.length`, which keeps list/kanban metrics cheap while the bridge remains active.
- `legacy-compat.schema.ts` no longer exposes `clients`, `providers`, legacy `transactions`, legacy `invoices`, or `documents`; the only remaining legacy bridge is `legacyOrganizations`.
- Remaining direct imports to the legacy schema inside `packages/infrastructure/src` are now `0`.

## Active Legacy Imports To Migrate First

1. No direct imports remain inside `packages/infrastructure/src`.
2. Next target is deleting or shrinking `legacy-compat.schema.ts` by migrating organization-based repositories to company-based domain contracts.

## Modules Already Using The Modular Schema

1. `packages/infrastructure/src/repositories/chat.repository.ts`
2. `packages/infrastructure/src/services/sunat-knowledge/sunat-2026.seed.ts`
3. `apps/api/src/lib/db.ts`
4. `apps/api/src/features/auth/auth.config.ts`
5. `apps/api/src/features/auth/handlers/signup.handler.ts`
6. `apps/api/src/features/agents/infrastructure/agent-task.repository.ts`
7. `apps/api/src/features/banking/application/services/reconciliation.service.ts`
8. `apps/api/src/features/banking/infrastructure/banking.repository.ts`
9. `apps/api/src/features/inter-company/infrastructure/inter-company-transaction.repository.ts`
10. `apps/api/src/features/transactions/infrastructure/transaction.repository.ts`
11. `apps/api/src/services/economic-group.service.ts`
12. `apps/api/src/services/firm-model.service.ts`
13. `apps/api/src/services/inter-company.service.ts`
14. `packages/infrastructure/src/index.ts`
15. `packages/infrastructure/src/services/ai-cost/ai-cost.repository.ts`
16. `packages/infrastructure/src/services/swarm-consensus/anomaly-alert.repository.ts`
17. `scripts/seed-demo-casos.ts`
18. `packages/infrastructure/src/db/repositories/postgres-provider.repository.ts` (via compat surface)
19. `packages/infrastructure/src/db/repositories/postgres-client.repository.ts` (new persistence + compat bridge)
20. `packages/infrastructure/src/db/repositories/document.repository.ts` (canonical `documents.schema.ts`)
21. `packages/infrastructure/src/db/repositories/postgres-invoice.repository.ts` (modular-only reads + tenant-aware modular writes)
22. `packages/infrastructure/src/db/repositories/postgres-transaction.repository.ts` (new persistence + compat bridge)

## Immediate Migration Order

1. Replace `organizationId: integer` contracts with `companyId: uuid` contracts at the domain boundary.
2. Move remaining invoice callers to pass `organizationId` so they hit the tenant-aware path by default.
3. After invoice callers are fully tenant-aware, consider making `organizationId` mandatory in the invoice application DTOs/use cases.
4. Run `bun run documents:company-id:report` in each shared environment, backfill `documents.company_id` wherever the report shows gaps, and only then delete the remaining organization-based bridge code inside `document.repository.ts`.
5. Keep `auxiliary.schema.ts` and `legacy-compat.schema.ts` as transition surfaces only while contract migration is in progress.
6. Delete `packages/infrastructure/src/db/drizzle/schema.ts` only after the legacy compatibility surfaces reach zero active consumers.
