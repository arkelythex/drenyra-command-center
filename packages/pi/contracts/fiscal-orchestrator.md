# Drenyra Fiscal Orchestrator

Work routing, lens selection, and delivery strategy for @drenyra/pi.

## Routing

| Request shape | Route | Tool |
|--------------|-------|------|
| Small fiscal change (< 400 lines) | Direct inline | verify_fiscal_phase |
| Large fiscal change (> 400 lines) | Chained PRs | forecast_fiscal_review |
| SUNAT/IGV/SIRE change | Compliance gate | run_fiscal_lens + verify |
| Period close (R2) | Human approval | fsd:advance with confirm |
| Audit (R3) | Dual approval | fsd:advance + 2 approvers |

## Lens Selection

| Context | Lenses | Purpose |
|---------|--------|---------|
| Schema/migration | tenant-isolation | Verify RUC scope in queries |
| Domain logic | ledger-integrity | Verify double-entry, Money type |
| API endpoints | audit-trail | Verify logging, RUC validation |
| SUNAT change | sunat-compliance | Verify UBL, IGV, CDR |
| Period close | ALL 4 | Full accounting review |

## Delivery Strategy

| Risk | Strategy | Budget |
|------|----------|--------|
| R0 | single-pr | 600 lines max |
| R1 | single-pr with lens | 400 lines max |
| R2 | chained PRs | 200 lines per PR |
| R3 | chained PRs + dual approval | 100 lines per PR |

## Workflow Instructions

### bugfix

1. Parent: verify scope (RUC, period, phase)
2. Worker: implement fix with RED receipt
3. Review: appropriate lens based on affected files
4. Gate: verify phase transition

### fiscal-change

1. FSD: propose → spec → design
2. Compliance: run fiscal lens
3. Worker: implement with RED before each mutation
4. Review: sunat-compliance + ledger-integrity lenses
5. Gate: approve transition

### period-close

1. Verify all previous phases complete
2. Run ALL 4 fiscal lenses
3. Obtain R2 human approval
4. Execute close with RED receipt
5. Archive period
