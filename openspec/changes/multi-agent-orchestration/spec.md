# Spec: Multi-Agent Orchestration — Model Routing + Delegation

## Architecture

Each Fiscal Agent step now has a route config:

| Step | Model Tier | Delegation | Budget |
|------|-----------|------------|--------|
| document_ingestion | Flash | Disabled | 10K |
| transaction_categorization | Reasoning | **Proactive** | 25K |
| tax_calculation | Flash | Disabled | 5K |
| sunat_reconciliation | Reasoning | Explicit-only | 20K |
| anomaly_detection | **Opus** | Explicit-only | 50K |
| report_generation | Reasoning | Disabled | 15K |

## Files Created
- `packages/infrastructure/src/ai/agent-router.ts` — route configs + lookup functions

## Integration
- Router integrates with existing ModelRegistry for model instantiation
- FiscalNightlyRunUseCase can call `getRouteForTask(stepName)` to determine which model to use
