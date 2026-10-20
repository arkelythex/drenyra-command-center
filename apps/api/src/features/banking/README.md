# 🏦 Banking Feature

Bank account management, transactions and statement import for ARKELYTHEX.

**Status:** ✅ Migrated (Vertical Slice) | Modular Split April 2026  
**Last Updated:** 2026-06-20  
**Última actualización:** 2026-06-20

## Overview

This feature handles:
- Bank account CRUD (PEN/USD)
- Transaction recording and listing
- Reconciliation shadow metrics (read-only) and reconciliation batches/rules
- Bulk import (normalized transactions; CSV parsing is client-side)
- Balance summaries

## Architecture

```
banking/
├── api/                          # HTTP layer
│   ├── banking.routes.ts         # Elysia routes
│   ├── banking.handlers.ts       # Request handlers
│   └── banking.schemas.ts        # Zod validation schemas
│
├── application/                  # Use cases (services)
│   └── services/
│       ├── banking.application-service.ts
│       ├── account.service.ts
│       ├── transaction.service.ts
│       ├── reconciliation.service.ts   # shadow metrics facade (read-only)
│       └── summary.service.ts
│
├── domain/                       # Business logic
│   ├── entities/
│   │   ├── bank-account.entity.ts
│   │   └── bank-transaction.entity.ts
│   ├── value-objects/
│   │   ├── account-number.vo.ts
│   │   ├── transaction-reference.vo.ts
│   │   └── match-score.vo.ts
│   └── services/
│       └── matching-strategy.ts  # Strategies reused by packages/infrastructure
│   └── types.ts
│
├── infrastructure/               # External concerns
│   └── banking.repository.ts     # Drizzle implementation
│
└── index.ts                      # Feature barrel export
```

## Key Concepts

### Reconciliation lives in `features/reconciliations`

Linking a bank movement to an invoice or bill goes **only** through
`/api/reconciliations` (`/:id/matches` and `/:id/reconcile`). That path
re-checks the proposal and locks the document row, so one invoice is linked
once. Banking no longer links documents: the legacy
`POST /api/banking/auto-reconcile` and `POST /api/banking/transactions/:id/reconcile`
were removed (see `odd/tasks/bank-reconciliation-mvp.md`, steps 1 and 5).

Banking keeps the read-only shadow endpoints (`/reconciliation-shadow/metrics`,
`/reconciliation-shadow/cutover`) and the reconciliation batches/rules endpoints.

### Money Handling

All monetary values use `Money` from `@drenyra/domain`:

```typescript
import { Money } from '@drenyra/domain';

const balance = new Money('15000.00', 'PEN');
const newBalance = balance.add(new Money('500.00', 'PEN'));
```

## Dependencies

### Internal
- `@drenyra/domain` - Money value object
- `@drenyra/shared` - SecureLogger
- `@drenyra/infrastructure` - Database, Drizzle schemas

### External
- None (no external bank APIs yet)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/banking/accounts` | List accounts |
| GET | `/api/banking/accounts/:id` | Get account |
| GET | `/api/banking/accounts/:id/balance` | Get balances |
| POST | `/api/banking/accounts` | Create account |
| DELETE | `/api/banking/accounts/:id` | Soft delete |
| GET | `/api/banking/accounts/:id/transactions` | List transactions |
| POST | `/api/banking/transactions` | Create transaction |
| POST | `/api/banking/import` | Import statement (amounts in cents) |
| GET | `/api/banking/summary` | Get summary |
| GET | `/api/banking/reconciliation-shadow/metrics` | Shadow metrics |
| GET | `/api/banking/reconciliation-shadow/cutover` | Shadow cutover evaluation |
| * | `/api/banking/reconciliation/batches/*` | Reconciliation batches |
| * | `/api/banking/reconciliation/rules/*` | Reconciliation rules |

Full API docs: docs/04-api/banking.md _(no disponible)_

## Extending

### Adding Bank Format for Import

1. Create parser in `infrastructure/parsers/`:

```typescript
// infrastructure/parsers/scotiabank.parser.ts
export class ScotiabankParser implements BankStatementParser {
  parse(csv: string): ParsedTransaction[] {
    // Parse Scotiabank-specific format
  }
}
```

2. Register in format map

## Testing

```bash
# Unit tests
bun test apps/api/src/features/banking/__tests__/unit/

# Integration tests
bun test apps/api/src/features/banking/__tests__/integration/

# All banking tests
bun test --grep "banking"
```

### Test Fixtures

Located in `__tests__/fixtures/banking.fixtures.ts`:
- `createTestAccount()` - Factory for BankAccount
- `createTestTransaction()` - Factory for BankTransaction
- `TestIds` - Consistent UUIDs for testing

## Configuration

Environment variables:
```bash
# None specific to banking yet
```

## ADRs

- ADR-008: Banking Reconciliation Strategy Pattern _(no disponible)_


## Edge Cases Covered

- **Reference format variance** (`F001-123`, `f001 123`, `F001/123`)  
  **Handling:** normalization to uppercase + separator unification before matching  
  **Tests:** `apps/api/src/features/banking/__tests__/unit/matching-strategy.test.ts`

- **Statement re-import / non-whole cents**  
  **Handling:** planned in cents, duplicates skipped, written all-or-nothing  
  **Tests:** `apps/api/src/features/banking/__tests__/unit/statement-import.test.ts`

## Migration from Legacy

This feature migrates from:
- `apps/api/src/services/banking.service.ts` (481 lines)
- `apps/api/src/types/banking.types.ts`

See: Vertical Slice Migration Guide _(no disponible)_

## Roadmap

- [x] Account management
- [x] Transaction CRUD
- [x] Statement import in cents
- [x] Reconciliation moved to `features/reconciliations`
- [ ] Bank API integration (BCP, BBVA)

---

- [Gentleman Philosophy](../../../../../docs/meta/gentleman-philosophy.md)

---
