# Invitations Flow — Integration Tests

## Prerequisites

1. PostgreSQL instance running (local or Docker)
2. Environment variable: `DATABASE_URL_TEST`
3. Run database migrations: `bun run drizzle:push`

## Running

```bash
DATABASE_URL_TEST=postgres://user:pass@localhost:5432/drenyra_test \
  vitest run --config vitest.config.ts \
  apps/api/src/features/auth/invitations/__tests__/integration/
```

## Test Data Setup

Tests expect:

- A firm admin user with session
- An organization with at least one company
- A test user to receive invitations

See individual test TODO markers for exact setup steps.
