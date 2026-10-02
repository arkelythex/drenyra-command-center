# Review Lens: audit-trail

Verify every mutation is logged with RUC, periodo, timestamp, actor, reason

## Checks

- [ ] Every mutation has: RUC, periodo, timestamp, actor, reason\n- [ ] Ledger entries are append-only (no UPDATE)\n- [ ] Period closures logged with human approver\n- [ ] Cross-RUC operations have explicit authorization

## Trigger

Run this lens when changes affect:
- Files in packages/fiscal-*, packages/domain/src/fiscal/
- Files with SUNAT, IGV, RUC, SIRE, detracción in name
- Any SQL query touching accounting tables
- API endpoints with RUC parameter
