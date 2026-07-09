# Money Usage Audit — Domain Package

**Date:** 2026-07-09

## Files using `number` for monetary amounts in domain

These are legitimate `number` usages for monetary amounts that should
be reviewed. Most are in repository interfaces (DB) or DTOs (API)
where `Money` value objects can't be used directly.

### Repository interfaces (DB-level, `number` is correct)

- `repositories/transaction.repository.ts:61` — `total: number`
- `repositories/bank-transaction.repository.ts:61` — `total: number`

### Entity types (should use Money or be reviewed)

- `entities/invoice/types.ts:129-131` — `subtotal`, `igv`, `total` as number
- `fiscal/sire.types.ts:33,72` — `igv: number`
- `fiscal/fiscal-general-ledger.ts:63,81,94,138` — `monto`, `total` as number
- `entities/diff/diff-impact.ts:3` — `amount: number`
- `events/TransactionPosted.ts:28` — `amount: number`

### Test files (test helpers, acceptable)

- `accounting/__tests__/detraccion.test.ts:21` — test helper function

### Value objects (Money API, correct)

- `value-objects/Money.ts` — Money value object API uses `number` in fromCents/fromAmount

## Recommendation

The entity-level types should use Money value objects after proper
serialization handling is established. This requires careful refactoring
to avoid breaking serialization contracts.
