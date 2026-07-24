# SDD-072 — SIRE Reconciliation Workspace

**Estado:** PROPOSED  
**Prioridad:** primer vertical slice  
**Depende de:** SDD-010–020, 034–041, 050–056

## Decisión

SIRE será un workspace de conciliación entre registros Drenyra y propuesta/fuente SUNAT. El resultado es una **propuesta versionada y revisable**, nunca una submission directa desde un chat o `companyId` controlado por cliente.

## Workflow

1. Seleccionar contexto verificado empresa/periodo/libro.
2. Sincronizar fuentes mediante job durable.
3. Normalizar y matching determinista.
4. Clasificar: matched, only-Drenyra, only-SUNAT, mismatch, invalid, needs-evidence.
5. Resolver excepciones manualmente o con propuesta L2.
6. Generar diff y summary.
7. Revisar y aprobar versión exacta.
8. Presentar/aplicar mediante adapter L3 autorizado.
9. Reconciliar outcome y vincular constancia/receipt.

## Seguridad crítica

Credenciales SUNAT se resuelven exclusivamente desde `FiscalContext` verificado. Payload puede indicar intención, pero no seleccionar credenciales de otra empresa. Submission revalida membership, period, approval y version.

## UX

Grid virtualizado con columnas de ambas fuentes, status, monto e impacto. Filters conservan conteos. Inspector muestra evidencia y resolución. Summary fija totales y exceptions. UNKNOWN bloquea resubmit y abre reconciliación.

## Criterios de aceptación

- Tests reales niegan same-org cross-company y cross-org.
- Matching/diff son deterministas y golden-tested.
- Duplicate submit no genera doble presentación.
- Timeout-after-success produce UNKNOWN y se reconcilia.
- Usuario completa conciliación con 40% menos cambios de pantalla que baseline.
