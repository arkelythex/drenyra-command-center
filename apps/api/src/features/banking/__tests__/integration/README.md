# Banking Integration Tests

**Last Updated:** 2026-06-20
**Última actualización:** 2026-06-20

## Overview

These integration tests verify the full Banking feature stack against a **REAL PostgreSQL database**.

## Test Files

1. **`banking.repository.test.ts`** - Repository layer CRUD operations
   - Account creation, updates, queries, soft delete
   - Transaction creation, filters, pagination
   - Reconciliation operations

2. **`banking.handlers.test.ts`** - E2E HTTP endpoint tests
   - Tests all banking routes via Elysia
   - Request validation, error handling, responses
   - Uses real DB + real HTTP calls

3. **`auto-reconcile.integration.test.ts`** - Full reconciliation flow
   - Creates test invoices and transactions
   - Runs auto-reconcile algorithm
   - Verifies matching strategies work correctly

## Setup Requirements

### 1. Database

These tests require a PostgreSQL database. Set the connection string via environment variable:

```bash
DATABASE_URL="postgres://user:password@localhost:5435/arkomix"
```

### 2. Dependencies

The following dependencies are required (install via `bun add -d`):

- `@ai-sdk/google` - AI SDK (mocked but must be installed)
- `ai` - AI package (mocked but must be installed)
- `fast-xml-parser` - XML parsing (used by infrastructure)

## Running Tests

Integration files are **excluded** from the default API test run unless `RUN_DB_TESTS=1` (see `apps/api/vitest.config.ts`).

### All integration tests (with Postgres + migrations):
```bash
bun run dev:stack   # or your own Postgres on DATABASE_URL
export DATABASE_URL="postgres://..."  # must match compose / local instance
RUN_DB_TESTS=1 bun test apps/api/src/features/banking/__tests__/integration/ --run
```

### Skip integration even when RUN_DB_TESTS=1 (CI without DB service):
```bash
RUN_DB_TESTS=1 SKIP_INTEGRATION_DB=1 bun test apps/api/src/features/banking/__tests__/integration/ --run
```
Suites use `describeBankingIntegration` and will **skip** (not fail) when `DATABASE_URL` is unset or `SKIP_INTEGRATION_DB=1`.

### Specific test file:
```bash
RUN_DB_TESTS=1 DATABASE_URL="postgres://..." \
  bun test apps/api/src/features/banking/__tests__/integration/auto-reconcile.integration.test.ts --run
```

## Known Issues

### Dependency Hell

The `@arkelythex/infrastructure` package is monolithic and imports many external dependencies (AI, XML, Storage, etc.). When running integration tests, you may encounter missing dependency errors.

**Workaround**: Install missing dependencies as dev dependencies in `apps/api`:

```bash
bun add -d @ai-sdk/google ai fast-xml-parser
```

**Future Fix**: Refactor `@arkelythex/infrastructure` to use conditional imports or split into smaller packages.

### Test Isolation

Tests use real database with automatic cleanup via `beforeEach` / `afterEach`. Each test gets a unique `companyId` (generated via `createId()`) to avoid conflicts.

### Mocks

Integration tests use minimal mocks (see `integration-mocks.ts`):
- AI SDK (not used in banking)
- AWS SDK (not used in banking)
- BullMQ (queues not used in banking)

Database, Drizzle ORM, and banking services are **NOT mocked**.

## Coverage

Current coverage: **~80%** of banking repository and handlers.

Missing coverage:
- Error scenarios (DB connection failures)
- Complex partial payment reconciliation
- Bill reconciliation (only invoice tests implemented)

## Best Practices

1. **Always cleanup** - Use `afterEach` to delete test data
2. **Unique IDs** - Use `createId()` for companyId to avoid collisions
3. **Explicit assertions** - Check both success and error paths
4. **Real data** - Create full records (invoices with customers, etc.)

## Debugging

If tests fail:

1. Check DATABASE_URL is set correctly
2. Verify PostgreSQL is running
3. Check migrations are applied
4. Look for missing dependencies in error messages

## Future Improvements

- [ ] Add testcontainers for CI/CD
- [ ] Split integration tests into separate config
- [ ] Add performance benchmarks
- [ ] Test concurrent reconciliation scenarios
- [ ] Add bill reconciliation tests

---

- [Gentleman Philosophy](../../../../../../docs/meta/gentleman-philosophy.md)
