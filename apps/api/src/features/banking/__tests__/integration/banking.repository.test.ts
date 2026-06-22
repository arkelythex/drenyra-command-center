/**
 * Banking Repository Integration Tests
 *
 * Tests BankingRepository against a REAL PostgreSQL database.
 * Verifies CRUD operations, queries, filters, and pagination.
 */

// Apply integration test mocks FIRST
import './integration-mocks';

import { describe, it, expect } from 'vitest';
import { randomUUID } from 'node:crypto';
import { BankingRepository } from '../../infrastructure/banking.repository';
import {
  describeBankingIntegration,
  setupTestDb,
  createTestAccount,
  createTestTransaction,
} from './test-db-setup';

describeBankingIntegration('BankingRepository (Integration)', () => {
  const getCtx = setupTestDb();
  const repository = new BankingRepository();

  describe('Account CRUD Operations', () => {
    it('creates account with all fields', async () => {
      const ctx = getCtx();
      const account = await repository.createAccount({
        companyId: ctx.companyId,
        accountName: 'BCP Principal',
        accountNumber: '191-2345678-0-11',
        accountType: 'CHECKING',
        bankName: 'BCP',
        bankCode: '002',
        branch: 'Lima Centro',
        currency: 'PEN',
        currentBalance: '5000.0000',
        availableBalance: '4800.0000',
        isActive: true,
        isDefault: true,
      });

      ctx.addAccount(account.id);

      expect(account).toMatchObject({
        companyId: ctx.companyId,
        accountName: 'BCP Principal',
        accountNumber: '191-2345678-0-11',
        accountType: 'CHECKING',
        bankName: 'BCP',
        bankCode: '002',
        branch: 'Lima Centro',
        currency: 'PEN',
        currentBalance: '5000.0000',
        availableBalance: '4800.0000',
        isActive: true,
        isDefault: true,
      });
      expect(account.id).toBeDefined();
      expect(account.createdAt).toBeInstanceOf(Date);
    });

    it('finds all accounts ordered by default status', async () => {
      const ctx = getCtx();

      // Create 3 accounts: default, active, inactive
      const acc1 = await createTestAccount(ctx, {
        accountName: 'Default Account',
        isDefault: true,
      });
      await createTestAccount(ctx, {
        accountName: 'Active Account',
        isDefault: false,
      });
      await createTestAccount(ctx, {
        accountName: 'Inactive Account',
        isActive: false,
      });

      const accounts = await repository.findAllAccounts(ctx.companyId);

      expect(accounts).toHaveLength(3);
      // Default should come first
      expect(accounts[0].id).toBe(acc1.id);
      expect(accounts[0].isDefault).toBe(true);
    });

    it('finds account by ID', async () => {
      const ctx = getCtx();
      const created = await createTestAccount(ctx, {
        accountName: 'Find Me',
      });

      const found = await repository.findAccountById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.accountName).toBe('Find Me');
    });

    it('finds account by number', async () => {
      const ctx = getCtx();
      const accountNumber = '191-9999999-0-00';

      await createTestAccount(ctx, { accountNumber });

      const found = await repository.findAccountByNumber(
        ctx.companyId,
        accountNumber
      );

      expect(found).not.toBeNull();
      expect(found?.accountNumber).toBe(accountNumber);
    });

    it('updates account balance', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx, {
        currentBalance: '1000.00',
      });

      await repository.updateAccount(account.id, {
        currentBalance: '2500.50',
        availableBalance: '2400.00',
      });

      const updated = await repository.findAccountById(account.id);
      expect(updated?.currentBalance).toBe('2500.5000');
      expect(updated?.availableBalance).toBe('2400.0000');
    });

    it('soft deletes account', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx, {
        isActive: true,
      });

      await repository.softDeleteAccount(account.id);

      const deleted = await repository.findAccountById(account.id);
      expect(deleted?.isActive).toBe(false);
    });
  });

  describe('Transaction CRUD Operations', () => {
    it('creates transaction with all fields', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);

      const transaction = await repository.createTransaction({
        companyId: ctx.companyId,
        accountId: account.id,
        transactionDate: '2026-01-15',
        description: 'Pago de factura 001-123',
        reference: 'FAC-001-123',
        type: 'DEBIT',
        amount: '1500.0000',
        balance: '3500.00',
        category: 'PAYMENTS',
        tags: 'factura,proveedor',
        importedFrom: 'MANUAL',
      });

      ctx.addTransaction(transaction.id);

      expect(transaction).toMatchObject({
        companyId: ctx.companyId,
        accountId: account.id,
        transactionDate: '2026-01-15',
        description: 'Pago de factura 001-123',
        reference: 'FAC-001-123',
        type: 'DEBIT',
        amount: '1500.0000',
        isReconciled: false,
      });
      expect(transaction.id).toBeDefined();
    });

    it('finds transaction by ID', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);
      const created = await createTestTransaction(ctx, account.id, {
        description: 'Find This Transaction',
      });

      const found = await repository.findTransactionById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.description).toBe('Find This Transaction');
    });

    it('finds transactions with date filters', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);

      // Create transactions on different dates
      await createTestTransaction(ctx, account.id, {
        transactionDate: '2026-01-10',
        description: 'Before range',
      });
      const tx2 = await createTestTransaction(ctx, account.id, {
        transactionDate: '2026-01-15',
        description: 'In range',
      });
      const tx3 = await createTestTransaction(ctx, account.id, {
        transactionDate: '2026-01-20',
        description: 'In range',
      });
      await createTestTransaction(ctx, account.id, {
        transactionDate: '2026-01-30',
        description: 'After range',
      });

      const transactions = await repository.findTransactions(account.id, {
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-01-20'),
      });

      expect(transactions).toHaveLength(2);
      const ids = transactions.map((t) => t.id);
      expect(ids).toContain(tx2.id);
      expect(ids).toContain(tx3.id);
    });

    it('finds transactions with reconciliation filter', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);

      // Create reconciled and unreconciled transactions
      await createTestTransaction(ctx, account.id, {
        isReconciled: false,
        description: 'Unreconciled 1',
      });
      await createTestTransaction(ctx, account.id, {
        isReconciled: false,
        description: 'Unreconciled 2',
      });
      await createTestTransaction(ctx, account.id, {
        isReconciled: true,
        description: 'Reconciled',
      });

      const unreconciled = await repository.findTransactions(account.id, {
        isReconciled: false,
      });

      expect(unreconciled.length).toBeGreaterThanOrEqual(2);
      expect(unreconciled.every((t) => !t.isReconciled)).toBe(true);
    });

    it('paginates transactions', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);

      // Create 5 transactions
      for (let i = 1; i <= 5; i++) {
        await createTestTransaction(ctx, account.id, {
          description: `Transaction ${i}`,
        });
      }

      const page1 = await repository.findTransactions(account.id, {
        limit: 2,
        offset: 0,
      });
      const page2 = await repository.findTransactions(account.id, {
        limit: 2,
        offset: 2,
      });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('finds unreconciled transactions for company', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);

      // Create mix of reconciled and unreconciled
      await createTestTransaction(ctx, account.id, {
        isReconciled: false,
      });
      await createTestTransaction(ctx, account.id, {
        isReconciled: false,
      });
      await createTestTransaction(ctx, account.id, {
        isReconciled: true,
      });

      const unreconciled = await repository.findUnreconciledTransactions(
        ctx.companyId,
        account.id
      );

      expect(unreconciled.length).toBeGreaterThanOrEqual(2);
      expect(unreconciled.every((t) => !t.isReconciled)).toBe(true);
    });
  });

  describe('Transaction Reconciliation', () => {
    it('reconciles transaction without document link', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);
      const transaction = await createTestTransaction(ctx, account.id, {
        isReconciled: false,
      });

      const userId = randomUUID();
      await repository.reconcileTransaction(transaction.id, userId);

      const reconciled = await repository.findTransactionById(transaction.id);
      expect(reconciled?.isReconciled).toBe(true);
      expect(reconciled?.reconciledBy).toBe(userId);
      expect(reconciled?.reconciledAt).toBeInstanceOf(Date);
    });

    it('reconciles transaction with invoice link', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);
      const transaction = await createTestTransaction(ctx, account.id);

      const invoiceId = randomUUID();
      await repository.reconcileTransaction(
        transaction.id,
        randomUUID(),
        invoiceId,
        'INVOICE'
      );

      const reconciled = await repository.findTransactionById(transaction.id);
      expect(reconciled?.isReconciled).toBe(true);
      expect(reconciled?.invoiceId).toBe(invoiceId);
      expect(reconciled?.billId).toBeNull();
    });

    it('reconciles transaction with bill link', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);
      const transaction = await createTestTransaction(ctx, account.id);

      const billId = randomUUID();
      await repository.reconcileTransaction(
        transaction.id,
        randomUUID(),
        billId,
        'BILL'
      );

      const reconciled = await repository.findTransactionById(transaction.id);
      expect(reconciled?.isReconciled).toBe(true);
      expect(reconciled?.billId).toBe(billId);
      expect(reconciled?.invoiceId).toBeNull();
    });

    it('counts unreconciled transactions', async () => {
      const ctx = getCtx();
      const account = await createTestAccount(ctx);

      await createTestTransaction(ctx, account.id, { isReconciled: false });
      await createTestTransaction(ctx, account.id, { isReconciled: false });
      await createTestTransaction(ctx, account.id, { isReconciled: true });

      const count = await repository.countUnreconciled(ctx.companyId);

      expect(count).toBeGreaterThanOrEqual(2);
    });
  });
});
