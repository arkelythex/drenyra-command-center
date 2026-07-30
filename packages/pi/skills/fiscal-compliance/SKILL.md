# Fiscal Compliance

Ensures fiscal correctness for Peruvian tax flows: SUNAT, UBL 2.1, IGV, retenciones, detracciones, SIRE, CDR.

## Triggers

- SUNAT/UBL/IGV changes in code
- Declaration uploads and CDR validation
- Tax calculation logic (IGV, retención, detracción)
- SIRE compliance reporting

## Rules

1. Never use floats for money — use whole-number soles (BigInt) or cents (integer)
2. Validate RUC checksum before any SUNAT operation
3. Preserve document series (F001, B001, etc.) per SUNAT format
4. CDR must be validated and stored for every SUNAT submission
5. IGV calculation: base × 0.18, rounded to whole soles
6. Detracciones apply to operations in SUNAT-annexed goods/services
7. SIRE reporting requires period-level book entry reconciliation

## Verification

```bash
bun run compliance:sire-gate
bun run compliance:sire-repro
```
