# Spec: Fiscal Agent 24/7 — Autonomous Recurring Fiscal Worker

**Change**: fiscal-agent-247  
**Status**: spec  
**Date**: 2026-07-03  

## Pipeline Architecture

```
[2:00 AM Trigger]
       │
       ▼
┌──────────────────┐
│  1. COLLECT      │  Pull transacciones del día anterior
│                  │  - De DB local (transactions table)
│                  │  - De SUNAT vía SIRE (SunatSireService.fullSync)
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  2. CATEGORIZE   │  Clasificar cada transacción con PCGE
│                  │  - Usar PCGE agent existente
│                  │  - Output: cuenta contable + confianza
│                  │  - Si confianza < 80% → marcar como excepción
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  3. CALCULATE    │  Calcular IGV, detracciones, retenciones
│                  │  - Usar PeruGeneralRegime / TaxCalculator
│                  │  - Determinar tipo tributario
│                  │  - Validar contra reglas SUNAT
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  4. RECONCILE    │  Comparar contra datos SUNAT
│                  │  - Usar findDiscrepancies()
│                  │  - Detectar: faltantes, montos diferentes
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  5. REPORT       │  Generar resumen + excepciones
│                  │  - Propuestas de asientos contables
│                  │  - Discrepancias SUNAT
│                  │  - Anomalías detectadas
│                  │  → Todo a la cola de revisión
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  6. LEARN        │  Procesar correcciones del usuario
│                  │  - Cada corrección mejora categorización futura
│                  │  - Guardar en engram/memoria fiscal
└──────────────────┘
```

## Files to Create/Modify

### New files

| File | Purpose |
|------|---------|
| `packages/application/src/use-cases/fiscal-agent/fiscal-nightly-run.use-case.ts` | Orchestrator del pipeline completo |
| `packages/application/src/use-cases/fiscal-agent/fiscal-nightly-run.types.ts` | Tipos del pipeline |
| `packages/infrastructure/src/queues/fiscal-agent.queue.ts` | BullMQ queue for fiscal agent jobs |
| `packages/infrastructure/src/agents/fiscal-agent/collector.step.ts` | Step 1: collect data |
| `packages/infrastructure/src/agents/fiscal-agent/categorizer.step.ts` | Step 2: categorize with PCGE |
| `packages/infrastructure/src/agents/fiscal-agent/calculator.step.ts` | Step 3: calculate taxes |
| `packages/infrastructure/src/agents/fiscal-agent/reconciler.step.ts` | Step 4: reconcile vs SUNAT |
| `packages/infrastructure/src/agents/fiscal-agent/reporter.step.ts` | Step 5: generate report |
| `packages/infrastructure/src/agents/fiscal-agent/learner.step.ts` | Step 6: learn from corrections |
| `packages/infrastructure/src/agents/fiscal-agent/index.ts` | Barrel + exports |
| `apps/api/src/features/fiscal-agent/routes/report.route.ts` | GET endpoints for reports |
| `apps/api/src/features/fiscal-agent/routes/correction.route.ts` | POST endpoint for user corrections |
| `apps/api/src/features/fiscal-agent/routes/index.ts` | Route registration |
| `apps/api/src/features/fiscal-agent/scheduler.ts` | Cron/Repeatable job registration |

### Modified files

| File | Change |
|------|--------|
| `packages/application/src/index.ts` | Export new use cases |
| `packages/infrastructure/src/index.ts` | Export new queue + agent |
| `apps/api/src/app-core.ts` | Register fiscal-agent routes + scheduler |
| `packages/persistence/src/schema/enums.ts` | Add fiscal_job_status enum if needed |

## Acceptance Criteria

1. ✅ Worker runs nightly at 2:00 AM and completes all 5 steps
2. ✅ Each step retries up to 3 times on failure
3. ✅ Exceptions (low confidence, discrepancies) are persisted to review queue
4. ✅ User can submit corrections via POST endpoint
5. ✅ Corrections improve future categorization
6. ✅ All pipeline activity is logged to FAL
7. ✅ Existing on-demand agents continue working unchanged
8. ✅ Worker can be triggered manually via API for testing
