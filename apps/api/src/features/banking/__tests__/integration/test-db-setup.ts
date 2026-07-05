/**
 * Integration Test Database Setup
 *
 * Provides utilities for setting up and tearing down test data
 * against a real PostgreSQL database.
 *
 * IMPORTANT: These tests use the REAL database defined in DATABASE_URL.
 * Make sure you're running against a development database!
 *
 * Vitest loads this folder only when `RUN_DB_TESTS=1` (see apps/api/vitest.config.ts).
 * If `DATABASE_URL` is empty or `SKIP_INTEGRATION_DB=1`, suites should use
 * `describeBankingIntegration` so they **skip** instead of failing with ECONNREFUSED.
 */

import { describe as vitestDescribe } from 'vitest';
import {
  db,
  bankAccounts,
  bankTransactions,
  eq,
  and,
} from '@drenyra/infrastructure';
import { beforeEach, afterEach } from 'vitest';
import { createId } from '@paralleldrive/cuid2';
import { randomUUID } from 'node:crypto';

/** True when real Postgres is not configured or integration is intentionally skipped. */
export const skipBankingDbIntegration =
	process.env.SKIP_INTEGRATION_DB === '1' ||
	process.env.SKIP_INTEGRATION_DB === 'true' ||
	!process.env.DATABASE_URL?.trim();

/** Use instead of `describe` for suites that require PostgreSQL. */
export const describeBankingIntegration = skipBankingDbIntegration
	? vitestDescribe.skip
	: vitestDescribe;

/**
 * Test context that holds IDs for cleanup
 */
export class TestContext {
  accountIds: string[] = [];
  transactionIds: string[] = [];
  companyId: string;

  constructor() {
    this.companyId = randomUUID();
  }

  addAccount(id: string) {
    this.accountIds.push(id);
  }

  addTransaction(id: string) {
    this.transactionIds.push(id);
  }
}

/**
 * Setup test database with automatic cleanup
 */
export function setupTestDb() {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = new TestContext();
  });

  afterEach(async () => {
    // Clean up in reverse order (transactions before accounts)
    if (ctx.transactionIds.length > 0) {
      await db.delete(bankTransactions)
        .where(eq(bankTransactions.companyId, ctx.companyId));
    }

    if (ctx.accountIds.length > 0) {
      await db.delete(bankAccounts)
        .where(eq(bankAccounts.companyId, ctx.companyId));
    }
  });

  return () => ctx;
}

/**
 * Create test account in database
 */
export async function createTestAccount(
  ctx: TestContext,
  overrides: Partial<typeof bankAccounts.$inferInsert> = {}
) {
  const accountId = randomUUID();

  const [account] = await db.insert(bankAccounts).values({
    id: accountId,
    companyId: ctx.companyId,
    accountName: 'Test Account',
    accountNumber: '999-' + createId().slice(0, 8),
    accountType: 'CHECKING',
    bankName: 'Test Bank',
    bankCode: 'TESTBANK',
    branch: null,
    currency: 'PEN',
    currentBalance: '0',
    availableBalance: '0',
    isActive: true,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }).returning();

  ctx.addAccount(accountId);
  return account;
}

/**
 * Create test transaction in database
 */
export async function createTestTransaction(
  ctx: TestContext,
  accountId: string,
  overrides: Partial<typeof bankTransactions.$inferInsert> = {}
) {
  const transactionId = randomUUID();

  const [transaction] = await db.insert(bankTransactions).values({
    id: transactionId,
    companyId: ctx.companyId,
    accountId,
    transactionDate: new Date().toISOString().split('T')[0],
    description: 'Test Transaction',
    reference: null,
    type: 'CREDIT',
    amount: '1000.00',
    balance: null,
    category: null,
    tags: null,
    isReconciled: false,
    reconciledAt: null,
    reconciledBy: null,
    invoiceId: null,
    billId: null,
    importedFrom: 'TEST',
    createdAt: new Date(),
    ...overrides,
  }).returning();

  ctx.addTransaction(transactionId);
  return transaction;
}

/**
 * Find all accounts for test company
 */
export async function findTestAccounts(ctx: TestContext) {
  return await db.query.bankAccounts.findMany({
    where: eq(bankAccounts.companyId, ctx.companyId),
  });
}

/**
 * Find all transactions for test company
 */
export async function findTestTransactions(ctx: TestContext) {
  return await db.query.bankTransactions.findMany({
    where: eq(bankTransactions.companyId, ctx.companyId),
  });
}

/**
 * Count unreconciled transactions
 */
export async function countUnreconciledTransactions(ctx: TestContext) {
  const transactions = await db.query.bankTransactions.findMany({
    where: and(
      eq(bankTransactions.companyId, ctx.companyId),
      eq(bankTransactions.isReconciled, false)
    ),
  });
  return transactions.length;
}
