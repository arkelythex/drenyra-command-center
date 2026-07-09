# Archive Report: Invoice Update Logic Unification

**Change:** `drenyra-invoice-update-refactor`
**Archived:** 2026-07-07
**Status:** Complete

## Artifacts

| Phase    | File                                                           | Status |
| -------- | -------------------------------------------------------------- | ------ |
| Explore  | `openspec/changes/drenyra-invoice-update-refactor/explore.md`  | ✅     |
| Proposal | `openspec/changes/drenyra-invoice-update-refactor/proposal.md` | ✅     |
| Spec     | `openspec/changes/drenyra-invoice-update-refactor/spec.md`     | ✅     |
| Design   | `openspec/changes/drenyra-invoice-update-refactor/design.md`   | ✅     |
| Tasks    | `openspec/changes/drenyra-invoice-update-refactor/tasks.md`    | ✅     |
| Apply    | Implementación en PR planeado como single PR                   | ✅     |

## Results

- **460 tests** pasando (0 regresiones)
- **0 errores** tsc en apps/api y packages/application
- `TaxCalculationService` — nuevo servicio compartido con 12 tests unitarios
- `update-invoice.command.ts` — duplicación eliminada (clase deprecada + validación duplicada)
- `update-invoice.use-case.ts` — refactorizado para usar TaxCalculationService
- DTO actualizado con `taxType`
- Domain entity: `companyId`, `sunatTicket`, `sunatCdrUrl` agregados

## Deuda Técnica Documentada

| Item                                                              | Impacto                                              | Próximo SDD                      |
| ----------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------- |
| 3 entidades Invoice con shapes incompatibles                      | Medio — impide migrar ruta API al use case de domain | Unificación de entidades Invoice |
| InvoiceRepository de API usa tipos distintos al domain repository | Medio                                                | Requiere el SDD anterior         |
| update-invoice-status.command.ts tiene clase deprecada            | Bajo — en uso por ruta de status                     | Cleanup menor                    |

## Estado Final

```yaml
change: drenyra-invoice-update-refactor
status: archived
tests: 460 passed
tsc_errors: 0
pr_strategy: single_pr
delivery_strategy: exception-ok
```
