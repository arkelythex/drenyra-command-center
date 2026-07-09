# Archive Report: Invoice Entity Unification + Repository Interface

**Change:** `drenyra-invoice-entity-unification`
**Archived:** 2026-07-07
**Status:** Complete

## Artifacts

| Phase    | File                                                              | Status |
| -------- | ----------------------------------------------------------------- | ------ |
| Explore  | `openspec/changes/drenyra-invoice-entity-unification/explore.md`  | ✅     |
| Proposal | `openspec/changes/drenyra-invoice-entity-unification/proposal.md` | ✅     |
| Design   | `openspec/changes/drenyra-invoice-entity-unification/design.md`   | ✅     |
| Tasks    | `openspec/changes/drenyra-invoice-entity-unification/tasks.md`    | ✅     |
| Apply    | PR1 + PR2 implementados                                           | ✅     |

## Results

- **460 tests** pasando (0 regresiones)
- **0 errores** tsc en apps/api y packages/application
- **Invoice entity unificada**: domain entity absorbió `customerId`, `exchangeRate`, `balanceDue`, `sunatStatus`, `productId`, `igvRate`, `PAID` status
- **API entity eliminada**: todos los consumidores migrados a `@drenyra/domain`
- **InvoiceRepository unificado**: domain interface canónica con 15 métodos + 2 opcionales
- **API IInvoiceRepository eliminado**: reemplazado por domain InvoiceRepository
- **2 archivos duplicados eliminados**: `invoice.repository.interface.ts`, `infrastructure/repository.ts`

## Estado Final del Pipeline Invoice

```
Ruta API (PATCH /:id) → updateInvoice() command
  → InvoiceRepository (concrete, implements domain interface)
    → Invoice (domain entity, from @drenyra/domain)
      → DB (Drizzle ORM)

UseCase (domain) → InvoiceRepository (domain interface)
  → Invoice (domain entity)
```

Una sola entidad, un solo repositorio, sin duplicación.
