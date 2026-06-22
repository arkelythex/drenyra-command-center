/**
 * Get Inter-Company Transactions — Query Handler
 *
 * Returns all transactions for an Economic Group,
 * enriched with company metadata (name, RUC).
 */

import type { IInterCompanyTransactionRepository } from '../../domain/inter-company-transaction.repository';
import type { InterCompanyTransactionEnriched } from '../../domain/inter-company-transaction.entity';

/**
 * GetTransactionsHandler class.
 *
 * @example
 * ```ts
 * const value = new GetTransactionsHandler();
 * console.log(value);
 * ```
 */
export class GetTransactionsHandler {
  constructor(private readonly repository: IInterCompanyTransactionRepository) {}

  async execute(economicGroupId: string): Promise<InterCompanyTransactionEnriched[]> {
    return this.repository.findManyByGroup(economicGroupId);
  }
}
