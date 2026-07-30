# Review Lens: ledger-integrity

Verify double-entry bookkeeping, account balances, Money type usage

## Checks

- [ ] Debe = Haber for all journal entries\n- [ ] Money values use BigInt (cents)\n- [ ] PCGE account codes are valid\n- [ ] Period boundaries respected (no postings to closed periods)

## Trigger

Run this lens when changes affect:
- Files in packages/fiscal-*, packages/domain/src/fiscal/
- Files with SUNAT, IGV, RUC, SIRE, detracción in name
- Any SQL query touching accounting tables
- API endpoints with RUC parameter
