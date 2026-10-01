# Review Lens: tenant-isolation

Verify no cross-RUC data access, RUC parameter validation, org boundaries

## Checks

- [ ] All queries include RUC filter\n- [ ] RUC validated against current session context\n- [ ] Organization boundaries enforced at DB query level\n- [ ] No hardcoded RUCs in queries

## Trigger

Run this lens when changes affect:
- Files in packages/fiscal-*, packages/domain/src/fiscal/
- Files with SUNAT, IGV, RUC, SIRE, detracción in name
- Any SQL query touching accounting tables
- API endpoints with RUC parameter
