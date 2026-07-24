# SDD-076 — Tax Filing and Pre-submission Review

**Estado:** PROPOSED  
**Depende de:** SDD-010–020, 052, 053, 074, 075

## Decisión

La presentación tributaria separará package preparation, pre-submission review, approval, external submission y receipt reconciliation. “Aprobado” nunca se mostrará como “Presentado”.

## Lifecycle

`DRAFT → VALIDATING → READY_FOR_REVIEW → REVIEWED → APPROVED → SUBMITTING → SUBMITTED → CONFIRMED`

Alternativos: `CHANGES_REQUESTED`, `REJECTED`, `FAILED`, `UNKNOWN`, `RECTIFICATION_REQUIRED`.

## Preflight

- company/RUC/period;
- obligation/version;
- inputs y rule versions;
- totals y cross-checks;
- unresolved exceptions;
- credentials availability sin revelarlas;
- approval freshness;
- external availability y idempotency strategy.

## Submission

Adapter obtiene credencial por verified context, produce correlation y preserva request hash/receipt. Timeout ambiguo entra UNKNOWN y reconciler consulta fuente antes de retry.

## UX

Review summary repite scope, importe, obligación y versión. Botón usa “Presentar” solo cuando realmente llama al sistema externo. Resultado muestra receipt o estado “Verificando presentación”.

## Criterios de aceptación

- No existe submit con client-authorized company.
- Duplicate click/retry no duplica presentación.
- Receipt enlaza package exacto.
- Approval stale bloquea submit.
- Failure/UNKNOWN tiene recovery y audit completos.
