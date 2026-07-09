# H2: SUNAT Integration Platform — Moat impenetrable Perú

## Propuesta

La ventaja imposible de copiar: integración SUNAT en tiempo real. CDR fetching automático, SIRE submission, multi-RUC, detracciones/percepciones/retenciones engine, monitoreo de cambios normativos.

## Scope

5 PRs, ~2,500 líneas estimadas.

## Estrategia

Construir sobre `apps/data-engine` (Python) + `apps/api` (Bun/Elysia). La API expone endpoints que el Orchestrator y el Dashboard consumen. El motor Python maneja la lógica pesada de validación SUNAT.

## PRs

1. **CDR real-time fetching + validation**: Servicio que fetch CDR de SUNAT OSE, valida hash chain, almacena como evidencia. Auto-retry en fallos.
2. **SIRE auto-submission**: Pipeline mensual que prepara datos del ledger, genera archivo SIRE, envía a SUNAT, captura respuesta. Con dashboard de estado.
3. **Multi-RUC management**: Dashboard para estudios contables con 20-200 clientes. Vista unificada de todos los RUCs, alertas por RUC, batch operations.
4. **Detracciones/percepciones/retenciones engine**: Motor que calcula tasas automáticamente según tabla SUNAT, aplica a transacciones, genera reportes. Con alerta de cambios de tasa.
5. **SUNAT normative change monitor**: Bot que monitorea el diario oficial y publicaciones SUNAT, detecta cambios normativos, inicia pipeline de compliance automático.

## Dependencias

- H0 (Agentic Harness) para el pipeline automático del monitor
- existing SUNAT services en packages/infrastructure

## Riesgos

- SUNAT API puede cambiar sin aviso (downtime, nuevos formatos)
- Multi-RUC necesita performance testing con 200+ RUCs
- Detracciones engine necesita tabla de tasas actualizada mensualmente
