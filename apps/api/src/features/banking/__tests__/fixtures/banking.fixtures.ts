/**
 * Banking Service Test Fixtures
 * Shared test data builders and mock factories
 */

import { vi } from 'vitest';

// Type definitions for test data
export interface MockAccount {
  id: string;
  companyId: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  currency: 'PEN' | 'USD';
  accountType: 'CHECKING' | 'SAVINGS' | 'CREDIT';
  currentBalance: string;
  availableBalance?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface MockTransaction {
  id: string;
  companyId: string;
  accountId: string;
  type: 'CREDIT' | 'DEBIT';
  amount: string;
  currency?: 'PEN' | 'USD';
  description: string;
  reference?: string;
  transactionDate: Date;
  isReconciled: boolean;
}

// Test Data Builders
export const AccountBuilder = {
  create(overrides: Partial<MockAccount> = {}): MockAccount {
    return {
      id: 'acc-default',
      companyId: 'comp-test',
      accountName: 'Cuenta Default',
      bankName: 'BCP',
      accountNumber: '123456789',
      currency: 'PEN',
      accountType: 'CHECKING',
      currentBalance: '0',
      isDefault: false,
      isActive: true,
      ...overrides,
    };
  },

  withBalance(amount: string, currency: 'PEN' | 'USD' = 'PEN'): MockAccount {
    return this.create({ currentBalance: amount, currency });
  },

  inactive(): MockAccount {
    return this.create({ isActive: false });
  },
};

export const TransactionBuilder = {
  create(overrides: Partial<MockTransaction> = {}): MockTransaction {
    return {
      id: 'tx-default',
      companyId: 'comp-test',
      accountId: 'acc-test',
      type: 'CREDIT',
      amount: '1000.00',
      description: 'Transacción de prueba',
      transactionDate: new Date('2026-01-15'),
      isReconciled: false,
      ...overrides,
    };
  },

  credit(amount: string, description?: string): MockTransaction {
    return this.create({ type: 'CREDIT', amount, description });
  },

  debit(amount: string, description?: string): MockTransaction {
    return this.create({ type: 'DEBIT', amount, description });
  },

  reconciled(): MockTransaction {
    return this.create({ isReconciled: true });
  },

  withReference(ref: string): MockTransaction {
    return this.create({ reference: ref });
  },

  onDate(date: Date): MockTransaction {
    return this.create({ transactionDate: date });
  },
};

// Mock Factory for Drizzle chains
export const MockChains = {
  insert(returningValue: unknown[] = []) {
    return {
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(returningValue),
      }),
    };
  },

  update() {
    return {
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    };
  },

  select(returnValue: unknown[] = [{ total: '0' }]) {
    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(returnValue),
      }),
    };
  },
};

// Common test constants
export const TestIds = {
  company: 'comp-123',
  account: 'acc-456',
  user: 'user-789',
  transaction: 'tx-001',
} as const;

// Date helpers
export const TestDates = {
  today: new Date('2026-01-29'),
  yesterday: new Date('2026-01-28'),
  lastWeek: new Date('2026-01-22'),
  nextMonth: new Date('2026-02-28'),
};
