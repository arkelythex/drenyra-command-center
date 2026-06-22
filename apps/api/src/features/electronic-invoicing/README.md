# Electronic Invoicing Feature

> Runtime prefix: `/electronic-invoicing`  
> Last updated: 2026-06-20  
> **Última actualización:** 2026-06-20  
> Status: Active mounted backend surface

## Purpose

This vertical slice owns the electronic invoicing lifecycle for SUNAT/OSE flows:

- submit CPE XML to OSE/SUNAT,
- process CDR responses,
- preserve lifecycle traceability,
- expose readiness and compliance signals,
- support invoice OSE send compatibility from `/api/invoices/:id/send-ose`.

## Runtime routes

Mounted from `apps/api/src/app-core.ts` through `electronicInvoicingModule`.

| Method | Endpoint | Role |
| --- | --- | --- |
| `POST` | `/electronic-invoicing/send` | Submit a CPE XML payload through the governed e-invoicing pipeline. |
| `POST` | `/electronic-invoicing/webhooks/cdr` | Process async CDR payloads from OSE/SUNAT. |
| `GET` | `/electronic-invoicing/lifecycle/:transactionId` | Read lifecycle traceability by transaction. |
| `GET` | `/electronic-invoicing/lifecycle/invoice/:invoiceId` | Read lifecycle traceability by invoice. |

Related compatibility route:

| Method | Endpoint | Role |
| --- | --- | --- |
| `POST` | `/api/invoices/:id/send-ose` | Invoice feature route that delegates to the unified e-invoicing pipeline. |

## Architecture

Wave 1 of `backend-hardening-roadmap` moved the main processing orchestration into the feature slice:

```text
HTTP route / invoice handler
        │
        ▼
ElectronicInvoicingService facade
        │
        ▼
ElectronicInvoiceProcessorService
        │
        ├── XmlParserService
        ├── DataConsistencyService
        ├── CdrProcessorService
        ├── CpeLifecycleService
        ├── SignatureService
        └── OSEService
```

## Public feature services

| Service | Responsibility |
| --- | --- |
| `ElectronicInvoiceProcessorService` | Canonical application service for the end-to-end CPE processing flow. |
| `XmlParserService` | Parses and validates UBL 2.1 XML payloads. |
| `DataConsistencyService` | Verifies XML data against persisted transaction data. |
| `CdrProcessorService` | Maps OSE/SUNAT CDR responses to internal status and metadata. |
| `CpeLifecycleService` | Maintains lifecycle events, status transitions, and traceability snapshots. |
| `CpeRepository` | Persistence adapter for CPE-related transaction/invoice data. |

## Compatibility facade

`apps/api/src/services/electronic-invoicing.service.ts` remains as a compatibility facade because existing consumers still import `ElectronicInvoicingService`.

New code should prefer the feature-local services when it is already inside this slice. Cross-slice consumers may keep using the facade until a dedicated port is introduced.

## TDD coverage

Relevant tests:

```bash
BUN_TMPDIR=/tmp BUN_INSTALL=/tmp \
  bun run test:run \
  src/features/electronic-invoicing/__tests__/unit/electronic-invoicing-facade.service.test.ts \
  src/features/invoice/__tests__/unit/send-ose-route.test.ts \
  --reporter=verbose
```

Coverage intent:

- facade delegates to the canonical feature processor,
- invoice OSE route preserves public response shape,
- missing linked transaction returns `INVOICE_TRANSACTION_NOT_FOUND`,
- tenant mismatch returns `TENANT_SCOPE_VIOLATION`,
- unsupported invoice currency fails before OSE submission.

## Hardening roadmap

Current status:

- ✅ Wave 1: processor extraction and facade boundary cleanup complete.
- 🔲 Wave 2: route protection matrix.
- 🔲 Wave 3: tenant fail-closed hardening.
- 🔲 Wave 4: contract/envelope consistency.

See:

- `docs/10-project-management/backend-hardening-roadmap-2026-04.md`
- `docs/04-api/README.md`
- `docs/04-api/hardening/auth-matrix.md`

---

- [Gentleman Philosophy](../../../../../docs/meta/gentleman-philosophy.md)
