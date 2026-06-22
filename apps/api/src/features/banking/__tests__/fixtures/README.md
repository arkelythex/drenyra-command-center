# Banking Test Fixtures

**Last Updated:** 2026-06-20
**Última actualización:** 2026-06-20

## Purpose

Reusable test data factories and constants for Banking feature tests (unit + integration).

Legacy banking fixtures moved here from services tests.

## Contents

| Export | Type | Purpose |
|--------|------|---------|
| `createTestAccount()` | Factory | Creates a `BankAccount` entity with default test values |
| `createTestTransaction()` | Factory | Creates a `BankTransaction` entity with default test values |
| `TestIds` | Constants | Consistent UUIDs for cross-test entity references |

## Usage

```typescript
import { createTestAccount, createTestTransaction, TestIds } from './banking.fixtures';

const account = createTestAccount({ companyId: TestIds.company });
const tx = createTestTransaction({ accountId: account.id });
```

## References

- [Banking Feature](../../README.md)
- [Gentleman Philosophy](../../../../../../../docs/meta/gentleman-philosophy.md)
