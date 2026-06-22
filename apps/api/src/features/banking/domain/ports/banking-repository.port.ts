/**
 * IBankingRepository — Port interface for the Banking bounded context.
 *
 * Separates domain logic from infrastructure adapters (Hexagonal Architecture).
 * All application command/query handlers depend on this interface, never on
 * the concrete Drizzle/PostgreSQL adapter.
 *
 * @module banking/domain/ports
 *
 * @example
 * ```ts
 * class RecordTransactionHandler {
 *   constructor(private readonly repo: IBankingRepository) {}
 * }
 * ```
 */

import type { BankAccountRecord, BankTransactionRecord } from '../../infrastructure/banking.repository';
import type { TransactionFilters } from '../types';

/**
 * Port contract for all Banking persistence operations.
 *
 * @example
 * ```ts
 * const repo: IBankingRepository = new BankingRepository();
 * ```
 */
export interface IBankingRepository {
  // ── Accounts ──────────────────────────────────────────────────────────────

  /**
   * Returns all active accounts for a company, ordered by default first.
   *
   * @example
   * ```ts
   * const accounts = await repo.findAllAccounts('cmp_1');
   * ```
   */
  findAllAccounts(companyId: string): Promise<BankAccountRecord[]>;

  /**
   * Finds a single account by its UUID.
   *
   * @example
   * ```ts
   * const account = await repo.findAccountById('acc_1');
   * ```
   */
  findAccountById(id: string): Promise<BankAccountRecord | null>;

  /**
   * Finds an account by its bank account number within a company.
   *
   * @example
   * ```ts
   * const account = await repo.findAccountByNumber('cmp_1', '191-123456');
   * ```
   */
  findAccountByNumber(companyId: string, accountNumber: string): Promise<BankAccountRecord | null>;

  /**
   * Persists a new bank account and returns the created record.
   *
   * @example
   * ```ts
   * const created = await repo.createAccount({ companyId: 'cmp_1', bankName: 'BCP', ... });
   * ```
   */
  createAccount(data: Omit<BankAccountRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<BankAccountRecord>;

  /**
   * Partially updates a bank account's fields.
   *
   * @example
   * ```ts
   * await repo.updateAccount('acc_1', { accountName: 'Cuenta BCP Principal' });
   * ```
   */
  updateAccount(id: string, data: Partial<BankAccountRecord>): Promise<void>;

  /**
   * Soft-deletes an account by marking it inactive.
   *
   * @example
   * ```ts
   * await repo.softDeleteAccount('acc_1');
   * ```
   */
  softDeleteAccount(id: string): Promise<void>;

  // ── Transactions ───────────────────────────────────────────────────────────

  /**
   * Returns filtered transactions for an account with optional date/status filters.
   *
   * @example
   * ```ts
   * const txns = await repo.findTransactions('acc_1', { isReconciled: false });
   * ```
   */
  findTransactions(accountId: string, options?: TransactionFilters): Promise<BankTransactionRecord[]>;

  /**
   * Finds a single transaction by its UUID.
   *
   * @example
   * ```ts
   * const tx = await repo.findTransactionById('tx_1');
   * ```
   */
  findTransactionById(id: string): Promise<BankTransactionRecord | null>;

  /**
   * Returns all unreconciled transactions for an account within a company.
   *
   * @example
   * ```ts
   * const pending = await repo.findUnreconciledTransactions('cmp_1', 'acc_1');
   * ```
   */
  findUnreconciledTransactions(companyId: string, accountId: string): Promise<BankTransactionRecord[]>;

  /**
   * Persists a new transaction and returns the created record.
   *
   * @example
   * ```ts
   * const tx = await repo.createTransaction({ companyId: 'cmp_1', amount: '100.00', ... });
   * ```
   */
  createTransaction(data: Omit<BankTransactionRecord, 'id' | 'createdAt'>): Promise<BankTransactionRecord>;

  /**
   * Marks a transaction as reconciled, optionally linking it to an Invoice or Bill.
   *
   * @example
   * ```ts
   * await repo.reconcileTransaction('tx_1', 'user_1', 'inv_1', 'INVOICE');
   * ```
   */
  reconcileTransaction(
    id: string,
    userId: string,
    documentId?: string,
    documentType?: 'INVOICE' | 'BILL'
  ): Promise<void>;

  /**
   * Returns the count of unreconciled transactions for a company.
   *
   * @example
   * ```ts
   * const count = await repo.countUnreconciled('cmp_1');
   * ```
   */
  countUnreconciled(companyId: string): Promise<number>;
}
