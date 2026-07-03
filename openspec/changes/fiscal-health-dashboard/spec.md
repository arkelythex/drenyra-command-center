# Spec: Fiscal Health Dashboard — Live Metrics

## Backend
- `packages/infrastructure/src/services/fiscal-health.service.ts` — aggregate endpoint
- Score: 0-100 weighted: SUNAT sync (30%), IGV compliance (30%), discrepancy rate (25%), deadlines (15%)
- Integrates with existing: SunatSireService, SunatApiClient

## Frontend (existing)
- InspectorFiscalPanel already exists in RightInspector
- Extend to fetch health score from API and display
