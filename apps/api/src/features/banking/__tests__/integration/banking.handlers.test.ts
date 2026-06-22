/**
 * Banking Handlers E2E Integration Tests
 *
 * Tests the full HTTP stack: Elysia -> Handlers -> Services -> Repository -> DB
 * Uses real database and real HTTP requests.
 */

// Apply integration test mocks FIRST
import './integration-mocks';

import { describe, it, expect, beforeAll } from 'vitest';
import { Elysia } from 'elysia';
import { randomUUID } from 'node:crypto';
import { bankingRoutes } from '../../api/banking.routes';
import {
  describeBankingIntegration,
  setupTestDb,
  createTestAccount,
  createTestTransaction,
} from './test-db-setup';

async function expectSuccessData<T = unknown>(response: Response): Promise<T> {
  const payload = await response.json();
  expect(payload).toMatchObject({ success: true });
  return payload.data as T;
}

describeBankingIntegration('Banking Handlers (E2E)', () => {
  const getCtx = setupTestDb();
  let app: Elysia;

  beforeAll(() => {
    // Create Elysia test app with banking routes
    app = new Elysia().use(bankingRoutes);
  });

  describe('GET /api/banking/accounts', () => {
    it('lists accounts for company', async () => {
      const ctx = getCtx();
      await createTestAccount(ctx, { accountName: 'Account 1' });
      await createTestAccount(ctx, { accountName: 'Account 2' });

      const response = await app.handle(
        new Request(`http://localhost/api/banking/accounts?companyId=${ctx.companyId}`)
      );

      expect(response.status).toBe(200);
      const accounts = await expectSuccessData<Array<Record<string, unknown>>>(response);
      expect(accounts).toHaveLength(2);
      expect(accounts[0]).toHaveProperty('id');
      expect(accounts[0]).toHaveProperty('accountName');
    });

    it('returns 422 for missing companyId', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/banking/accounts')
      );

      expect(response.status).toBe(422);
    });
  });

  describe('POST /api/banking/accounts', () => {
    it('creates account with valid data', async () => {
      const ctx = getCtx();

      const response = await app.handle(
        new Request('http://localhost/api/banking/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: ctx.companyId,
            accountName: 'BCP Principal',
            accountNumber: '191-1234567-0-11',
            accountType: 'CHECKING',
            bankName: 'BCP',
            bankCode: '002',
            currency: 'PEN',
          }),
        })
      );

      expect(response.status).toBe(200);
      const account = await expectSuccessData<Record<string, unknown>>(response);
      expect(account).toHaveProperty('id');
      expect(account.accountName).toBe('BCP Principal');
      expect(account.currency).toBe('PEN');

      ctx.addAccount(account.id);
    });

    it('validates required fields', async () => {
      const response = await app.handle(
        new Request('http://localhost/api/banking/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: 'test',
            accountName: 'Test',
            // Missing accountNumber
            accountType: 'CHECKING',
            bankName: 'Test Bank',
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it('validates account type enum', async () => {
      const ctx = getCtx();

      const response = await app.handle(
        new Request('http://localhost/api/banking/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: ctx.companyId,
            accountName: 'Test',
            accountNumber: '123456',
            accountType: 'INVALID',
            bankName: 'Test Bank',
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/banking/accounts/:id', () => {
    it('returns account by ID', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx, {
        accountName: 'Find Me',
      });

      const response = await app.handle(
        new Request(`http://localhost/api/banking/accounts/${account.id}`, {
          headers: { 'x-company-id': ctx.companyId },
        })
      );

      expect(response.status).toBe(200);
      const found = await expectSuccessData<Record<string, unknown>>(response);
      expect(found.id).toBe(account.id);
      expect(found.accountName).toBe('Find Me');
    });

    it('returns 404 for non-existent account', async () => {
      const nonExistentId = randomUUID();
      const response = await app.handle(
        new Request(`http://localhost/api/banking/accounts/${nonExistentId}`, {
          headers: { 'x-company-id': getCtx().companyId },
        })
      );

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/banking/accounts/:id/balance', () => {
    it('returns account balance', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx, {
        currentBalance: '5000.00',
        availableBalance: '4800.00',
        currency: 'PEN',
      });

      const response = await app.handle(
        new Request(`http://localhost/api/banking/accounts/${account.id}/balance`, {
          headers: { 'x-company-id': ctx.companyId },
        })
      );

      expect(response.status).toBe(200);
      const balance = await expectSuccessData<Record<string, unknown>>(response);
      expect(balance).toMatchObject({
        current: '5000.0000',
        available: '4800.0000',
      });
    });
  });

  describe('DELETE /api/banking/accounts/:id', () => {
    it('soft deletes account', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);

      const response = await app.handle(
        new Request(`http://localhost/api/banking/accounts/${account.id}`, {
          method: 'DELETE',
          headers: { 'x-company-id': ctx.companyId },
        })
      );

      expect(response.status).toBe(200);
      const result = await expectSuccessData<Record<string, unknown>>(response);
      expect(result.deleted).toBe(true);
    });
  });

  describe('POST /api/banking/transactions', () => {
    it('creates transaction with valid data', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx, {
        currentBalance: '2000',
        availableBalance: '2000',
      });

      const response = await app.handle(
        new Request('http://localhost/api/banking/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: ctx.companyId,
            accountId: account.id,
            transactionDate: '2026-01-15',
            description: 'Pago de proveedor',
            reference: 'FAC-001',
            type: 'DEBIT',
            amount: 1500.0,
            category: 'PAYMENTS',
          }),
        })
      );

      expect(response.status).toBe(200);
      const transaction = await expectSuccessData<Record<string, unknown>>(response);
      expect(transaction).toHaveProperty('id');
      expect(transaction.description).toBe('Pago de proveedor');
      expect(transaction.amount).toBe('1500.0000');

      ctx.addTransaction(transaction.id);
    });

    it('validates transaction type enum', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);

      const response = await app.handle(
        new Request('http://localhost/api/banking/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: ctx.companyId,
            accountId: account.id,
            transactionDate: '2026-01-15',
            description: 'Test',
            type: 'INVALID',
            amount: 100,
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/banking/accounts/:id/transactions', () => {
    it('lists transactions for account', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);
      await createTestTransaction(ctx, account.id, {
        description: 'Transaction 1',
      });
      await createTestTransaction(ctx, account.id, {
        description: 'Transaction 2',
      });

      const response = await app.handle(
        new Request(`http://localhost/api/banking/accounts/${account.id}/transactions`, {
          headers: { 'x-company-id': ctx.companyId },
        })
      );

      expect(response.status).toBe(200);
      const transactions = await expectSuccessData<Array<Record<string, unknown>>>(response);
      expect(transactions.length).toBeGreaterThanOrEqual(2);
      expect(transactions[0]).toHaveProperty('id');
      expect(transactions[0]).toHaveProperty('description');
    });

    it('filters transactions by date range', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);
      await createTestTransaction(ctx, account.id, {
        transactionDate: '2026-01-10',
      });
      await createTestTransaction(ctx, account.id, {
        transactionDate: '2026-01-20',
      });

      const response = await app.handle(
        new Request(
          `http://localhost/api/banking/accounts/${account.id}/transactions?startDate=2026-01-15&endDate=2026-01-25`,
          { headers: { 'x-company-id': ctx.companyId } }
        )
      );

      expect(response.status).toBe(200);
      const transactions = await expectSuccessData<Array<Record<string, unknown>>>(response);
      expect(transactions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/banking/transactions/:id/reconcile', () => {
    it('reconciles transaction', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);
      const transaction = await createTestTransaction(ctx, account.id, {
        isReconciled: false,
      });

      const response = await app.handle(
        new Request(
          `http://localhost/api/banking/transactions/${transaction.id}/reconcile`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-company-id': ctx.companyId,
            },
            body: JSON.stringify({
              userId: randomUUID(),
            }),
          }
        )
      );

      expect(response.status).toBe(200);
      const result = await expectSuccessData<Record<string, unknown>>(response);
      expect(result.reconciled).toBe(true);
    });

    it('rejects legacy header-only auth fallback when body.userId is omitted', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);
      const transaction = await createTestTransaction(ctx, account.id, {
        isReconciled: false,
      });

      const response = await app.handle(
        new Request(
          `http://localhost/api/banking/transactions/${transaction.id}/reconcile`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': randomUUID(),
              'x-user-role': 'admin',
              'x-company-id': ctx.companyId,
            },
            body: JSON.stringify({}),
          }
        )
      );

      expect(response.status).toBe(401);
      const payload = await response.json();
      expect(payload).toMatchObject({
        success: false,
        code: 'BANKING_AUTH_REQUIRED',
      });
    });

    it('returns 401 when neither body.userId nor auth headers provide a legacy user', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);
      const transaction = await createTestTransaction(ctx, account.id, {
        isReconciled: false,
      });

      const response = await app.handle(
        new Request(
          `http://localhost/api/banking/transactions/${transaction.id}/reconcile`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-company-id': ctx.companyId,
            },
            body: JSON.stringify({}),
          }
        )
      );

      expect(response.status).toBe(401);
      const payload = await response.json();
      expect(payload).toMatchObject({
        success: false,
        code: 'BANKING_AUTH_REQUIRED',
      });
    });
  });

  describe('GET /api/banking/summary', () => {
    it('returns banking summary for company', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx, {
        currentBalance: '10000.00',
      });
      await createTestTransaction(ctx, account.id, { isReconciled: false });
      await createTestTransaction(ctx, account.id, { isReconciled: false });

      const response = await app.handle(
        new Request(`http://localhost/api/banking/summary?companyId=${ctx.companyId}`)
      );

      expect(response.status).toBe(200);
      const summary = await expectSuccessData<Record<string, unknown>>(response);
      expect(summary).toHaveProperty('totalAccounts');
      expect(summary).toHaveProperty('totalBalance');
      expect(summary).toHaveProperty('unreconciledTransactions');
      expect(summary.totalAccounts).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/banking/import', () => {
    it('imports multiple transactions', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);

      const response = await app.handle(
        new Request('http://localhost/api/banking/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId: ctx.companyId,
            accountId: account.id,
            transactions: [
              {
                date: '2026-01-10',
                description: 'Import 1',
                amount: 500,
                type: 'CREDIT',
              },
              {
                date: '2026-01-11',
                description: 'Import 2',
                amount: 300,
                type: 'DEBIT',
              },
            ],
          }),
        })
      );

      expect(response.status).toBe(200);
      const result = await expectSuccessData<Record<string, unknown>>(response);
      expect(result.imported).toBeGreaterThanOrEqual(2);
    });
  });
});
