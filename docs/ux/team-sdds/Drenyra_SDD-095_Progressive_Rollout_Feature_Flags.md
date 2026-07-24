# SDD-095 — Progressive Rollout and Feature Flags

**Estado:** PROPOSED  
**Depende de:** SDD-090–094

## Decisión

Features de alto riesgo se activarán por environment, organization/company cohort, role y capability. Flags controlan exposición, no autorización ni invariantes.

## Fases

`internal → design partners → pilot companies → percentage cohorts → general availability`.

## Reglas

1. Default seguro y owner/expiry obligatorios.
2. Flag evaluation server-side para side effects.
3. Rollback no revierte automáticamente datos; cada slice define compensación.
4. Migrations son backward-compatible durante ventana de rollback.
5. Exposure events permiten medir cohortes.
6. Emergency kill switch detiene nuevas ejecuciones L3 sin ocultar resultados existentes.

## Go/no-go

Error rate, unknown rate, task success, support incidents, accessibility, performance y fiscal reconciliation deben cumplir thresholds del slice. Security/tenant anomaly es stop inmediato.

## Criterios de aceptación

- Registry de flags con owner y removal date.
- Tests cubren old/new code paths.
- Kill switch probado.
- Rollback runbook incluye datos/jobs.
- Flag cleanup forma parte de DONE.
