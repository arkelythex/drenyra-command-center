import { describe, it, expect, vi } from 'vitest';
import {
  AmountDateMatchingStrategy,
  AmountEntityMatchingStrategy,
  FuzzyEntityMatchingStrategy,
  PartialPaymentMatchingStrategy,
  ReferenceMatchingStrategy,
  type MatchContext,
  type BankTransactionLike,
} from '../../domain/services/matching-strategy';
import { TestIds } from '../fixtures/banking.fixtures';

const baseContext = (): MatchContext => ({
  companyId: TestIds.company,
  dateWindowDays: 3,
  normalizeReference: (ref) => ref.trim().toUpperCase(),
  findInvoiceByReference: vi.fn(async () => null),
  findBillByReference: vi.fn(async () => null),
  findInvoicesByAmountAndDate: vi.fn(async () => []),
  findBillsByAmountAndDate: vi.fn(async () => []),
  findPartners: vi.fn(async () => []),
  findInvoicesByAmountAndCustomer: vi.fn(async () => []),
  findBillsByAmountAndVendor: vi.fn(async () => []),
  findPartialPaymentMatch: vi.fn(async () => null),
});

describe('Matching Strategies', () => {
  it('ReferenceMatchingStrategy returns invoice match for CREDIT', async () => {
    const ctx = baseContext();
    ctx.findInvoiceByReference = vi.fn(async () => ({ id: 'inv-1' }));

    const strategy = new ReferenceMatchingStrategy();
    const tx: BankTransactionLike = {
      id: 'tx-1',
      accountId: 'acc-1',
      companyId: TestIds.company,
      transactionDate: new Date(),
      description: 'Pago',
      reference: 'F001-123',
      type: 'CREDIT',
      amount: '100.00',
    };

    const match = await strategy.match(tx, ctx);
    expect(match).toEqual({
      documentId: 'inv-1',
      documentType: 'INVOICE',
      score: 100,
      criteria: 'REFERENCE',
    });
  });

  it('AmountDateMatchingStrategy returns bill match for DEBIT', async () => {
    const ctx = baseContext();
    ctx.findBillsByAmountAndDate = vi.fn(async () => [{ id: 'bill-1' }]);

    const strategy = new AmountDateMatchingStrategy();
    const tx: BankTransactionLike = {
      id: 'tx-2',
      accountId: 'acc-1',
      companyId: TestIds.company,
      transactionDate: new Date('2026-01-15'),
      description: 'Pago proveedor',
      reference: null,
      type: 'DEBIT',
      amount: '250.00',
    };

    const match = await strategy.match(tx, ctx);
    expect(match).toEqual({
      documentId: 'bill-1',
      documentType: 'BILL',
      score: 80,
      criteria: 'AMOUNT_DATE',
    });
  });

  it('AmountEntityMatchingStrategy uses partner name in description', async () => {
    const ctx = baseContext();
    ctx.findPartners = vi.fn(async () => [{ id: 'cust-1', legalName: 'ACME SAC' }]);
    ctx.findInvoicesByAmountAndCustomer = vi.fn(async () => [{ id: 'inv-2' }]);

    const strategy = new AmountEntityMatchingStrategy();
    const tx: BankTransactionLike = {
      id: 'tx-3',
      accountId: 'acc-1',
      companyId: TestIds.company,
      transactionDate: new Date('2026-01-15'),
      description: 'Pago de ACME SAC',
      reference: null,
      type: 'CREDIT',
      amount: '500.00',
    };

    const match = await strategy.match(tx, ctx);
    expect(match).toEqual({
      documentId: 'inv-2',
      documentType: 'INVOICE',
      score: 60,
      criteria: 'AMOUNT_ENTITY',
    });
  });

  it('PartialPaymentMatchingStrategy delegates to context', async () => {
    const ctx = baseContext();
    ctx.findPartialPaymentMatch = vi.fn(async () => ({
      documentId: 'inv-3',
      documentType: 'INVOICE',
      score: 60,
      criteria: 'PARTIAL',
      relatedTransactionIds: ['tx-4', 'tx-5'],
    }));

    const strategy = new PartialPaymentMatchingStrategy();
    const tx: BankTransactionLike = {
      id: 'tx-4',
      accountId: 'acc-1',
      companyId: TestIds.company,
      transactionDate: new Date('2026-01-15'),
      description: 'Pago parcial',
      reference: null,
      type: 'CREDIT',
      amount: '300.00',
    };

    const match = await strategy.match(tx, ctx);
    expect(match?.documentId).toBe('inv-3');
    expect(ctx.findPartialPaymentMatch).toHaveBeenCalledWith(tx);
  });

  it('FuzzyEntityMatchingStrategy matches near partner names in description', async () => {
    const ctx = baseContext();
    ctx.findPartners = vi.fn(async () => [{ id: 'cust-9', legalName: 'INVERSIONES ACME SAC' }]);
    ctx.findInvoicesByAmountAndCustomer = vi.fn(async () => [{ id: 'inv-99' }]);

    const strategy = new FuzzyEntityMatchingStrategy();
    const tx: BankTransactionLike = {
      id: 'tx-fuzzy',
      accountId: 'acc-1',
      companyId: TestIds.company,
      transactionDate: new Date('2026-01-15'),
      description: 'Transferencia a INVERSIONES ACME SAC',
      reference: null,
      type: 'CREDIT',
      amount: '500.00',
    };

    const match = await strategy.match(tx, ctx);
    expect(match).toMatchObject({
      documentId: 'inv-99',
      documentType: 'INVOICE',
      criteria: 'FUZZY_ENTITY',
    });
  });
});
