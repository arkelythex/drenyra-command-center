/**
 * Inter-Company Transaction Repository — PORT (Interface)
 *
 * Defines the data-access contract. Infrastructure layer MUST implement this.
 * Domain and application layers depend only on this interface, never on Drizzle.
 */

import type {
  AtomicCreateInput,
  AuditPage,
  CreateInterCompanyTransactionResult,
  InterCompanyDetractionAuditFilters,
  InterCompanyTransactionEnriched,
  InterCompanyTransactionRow,
  SpotPdfResult,
} from './inter-company-transaction.entity';

/**
 * IInterCompanyTransactionRepository interface.
 *
 * @example
 * ```ts
 * const value: IInterCompanyTransactionRepository = {} as IInterCompanyTransactionRepository;
 * console.log(value);
 * ```
 */
export interface IInterCompanyTransactionRepository {
  /**
   * Validates that fromCompany and toCompany both belong to economicGroupId.
   * Throws a descriptive error if validation fails.
   */
  validateSameGroup(
    fromCompanyId: string,
    toCompanyId: string,
    economicGroupId: string
  ): Promise<void>;

  /**
   * Atomically creates:
   *   - EXPENSE transaction for fromCompany
   *   - INCOME transaction for toCompany
   *   - Inter-company link record tying both
   *
   * All or nothing — DB transaction guarantees consistency.
   */
  createAtomic(input: AtomicCreateInput): Promise<CreateInterCompanyTransactionResult>;

  /**
   * Returns all inter-company transactions for an Economic Group,
   * enriched with fromCompany/toCompany names and RUCs.
   */
  findManyByGroup(economicGroupId: string): Promise<InterCompanyTransactionEnriched[]>;

  /**
   * Returns a paginated, filtered, sortable audit trail for detraction analysis.
   */
  findAuditPage(filters: InterCompanyDetractionAuditFilters): Promise<AuditPage>;

  /**
   * Returns a single inter-company transaction by ID, or undefined if not found.
   */
  findById(id: string): Promise<InterCompanyTransactionRow | undefined>;

  /**
   * Records the generated SPOT PDF URL and reference number on the transaction.
   */
  updateSpotPdf(id: string, url: string, referenceNumber: string): Promise<void>;
}

// Re-export result types used by the repository interface consumers
export type { SpotPdfResult };
