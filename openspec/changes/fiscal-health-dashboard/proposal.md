# Proposal: Fiscal Health Dashboard — Live Risk + Projections

## Problem
Digits/Wesley give clients real-time financials. Drenyra has the data (TaxRegime, SIRE, discrepancies) but no proactive dashboard.

## Solution
Live dashboard in RightInspector showing:
- Fiscal Health Score (0-100): based on discrepancies, deadlines, risks
- Active exceptions from Fiscal Agent 24/7
- IGV projection for current period
- Next tax deadlines
- SUNAT sync status

## Implementation
- Backend: aggregation endpoint in existing fiscal feature
- Frontend: InspectorFiscalPanel already exists — extend it
- Uses existing data: SunatSireService, findDiscrepancies, TaxCalculator

## Key Metric
```typescript
interface FiscalHealthScore {
  overall: number; // 0-100
  categories: {
    sunatSync: number;
    igvCompliance: number;
    detraccionCompliance: number;
    discrepancyRate: number;
    deadlineProximity: number;
  };
  activeExceptions: number;
  projectedIGV: { base: number; tax: number; total: number };
}
```
