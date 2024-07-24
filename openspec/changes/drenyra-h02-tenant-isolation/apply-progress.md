## H02 Tenant Isolation — Apply Progress

### Status: GREEN (Waves 2-5 implementation complete, all files staged)

---

### Completed Waves

#### Wave 2 — Repositories with 1 caller each
| PR | Repository | Status |
|----|-----------|--------|
| 2.1 | DetractionRepository | Complete |
| 2.2 | CpeLogRepository | Complete |
| 2.3 | AccountingPeriodRepository | Complete |

#### Wave 3 — Group C repositories (ExchangeRate, Transaction, Client, Provider)
| PR | Repository | Status |
|----|-----------|--------|
| 3.1 | ExchangeRateRepository | Complete |
| 3.2 | TransactionRepository | Complete |
| 3.3 | ClientRepository | Complete |
| 3.4 | ProviderRepository | Complete |

#### Wave 4 — Mixed-scope repositories + SireSubmission
| PR | Repository | Status |
|----|-----------|--------|
| 4.1 | EvidenceRepository | Complete |
| 4.2 | InvoiceRepository | Complete |
| 4.3 | SireSubmissionRepository | Complete |

#### Wave 5 — Perimeter Security (Workers, SSE, Exports, Signed URLs)
| PR | Component | Status |
|----|-----------|--------|
| 5.1 | Workers — scope validation | Complete |
| 5.2 | SSE — tenant filtering | Complete |
| 5.3 | Exports — scope in generation | Complete |
| 5.4 | Signed URLs — tenant-aware | Complete |

---

### PR 5.1: Workers — scope validation in job payloads

**Pattern:** Added `validateWorkerScope(payload, level)` as FIRST check in every worker handler.

**New file:**
- `packages/infrastructure/src/workers/scope-validator.ts` — shared validation helper with 3 levels: `organization`, `tenant`, `fiscal`

**Modified files:**
- `packages/infrastructure/src/workers/fiscal-agent.worker.ts` — `validateWorkerScope(job.data, "fiscal")`
- `packages/infrastructure/src/workers/evidence-ingestion.worker.ts` — `validateWorkerScope(event, "tenant")`
- `packages/infrastructure/src/queues/document-processor.worker.ts` — added `organizationId` to Zod schema + tenant validation
- `packages/infrastructure/src/queues/document-processor.queue.ts` — added `organizationId` to `DocumentJobData`
- `packages/infrastructure/src/workers/csv-batch.worker.ts` — `validateWorkerScope({orgId, companyId}, "tenant")`

**Tests:** 19/19 pass (scope-validator)

**TDD Evidence:**
- RED: 19 failing tests for validateWorkerScope (org/tenant/fiscal levels, cross-tenant, edge cases)
- GREEN: Implemented validateWorkerScope with strict type checks
- TRIANGULATE: Cross-tenant isolation: different org scopes pass individually
- REFACTOR: Shared helper eliminates duplication across 4 workers

---

### PR 5.2: SSE — tenant filtering in subscriptions

**Pattern:** `eventBus.publish(event, { organizationId })` filters subscribers by org match. Subscribers without org filter receive all events (backward compatible).

**Modified files:**
- `packages/infrastructure/src/events/event.port.ts` — added `organizationId` to `SubscriptionOptions`
- `packages/infrastructure/src/events/in-memory-event-bus.ts` — dual tracking: EventEmitter for broadcast (no-org events), TenantSubscription map for org-filtered delivery

**Tests:** 8/8 pass (tenant-isolation)

**TDD Evidence:**
- RED: Tests for cross-org blocking (subscriber org-b doesn't receive org-a events)
- GREEN: Tenant filtering in publish() with org-aware subscriber map
- TRIANGULATE: Tested: same-org delivery, cross-org blocking, no-filter backward compat, multi-subscriber, subscribeMultiple, disconnect cleanup
- REFACTOR: Minimal change — EventEmitter retained for backward compat

---

### PR 5.3: Exports — scope in report generation

**Pattern:** `ReportJobData` now requires `companyId` alongside `organizationId`. `addReportJob()` validates both before queuing.

**Modified files:**
- `packages/infrastructure/src/queues/types.ts` — added `companyId: string` to `ReportJobData`
- `packages/infrastructure/src/queues/queues.ts` — `addReportJob` validates orgId + companyId
- `packages/infrastructure/src/queues/handlers.ts` — same validation in duplicate `addReportJob`

---

### PR 5.4: Signed URLs — tenant-aware

**Pattern:** `getSignedUrl(fileUrl, expiresIn, scope?)` — when scope is provided, tenant orgId+companyId are embedded in the key path. For R2, the S3 presigned signature is bound to the full key path; for local storage, the tenant prefix is in the URL pathname.

**Modified files:**
- `packages/application/src/ports/storage.port.ts` — added `TenantScope` interface, updated `getSignedUrl` signature
- `packages/infrastructure/src/storage/r2-storage.service.ts` — scope-bound key path: `{orgId}/{companyId}/{key}`
- `packages/infrastructure/src/storage/local-storage.service.ts` — scope-bound URL pathname prefix

---

### Files Changed (Wave 5): 16 files (+167/-10)

### Test Results
- scope-validation: 19/19 pass
- tenant-isolation: 8/8 pass
- Total: 27/27 pass

### Remaining: Wave 6 — RLS (3 PRs)
