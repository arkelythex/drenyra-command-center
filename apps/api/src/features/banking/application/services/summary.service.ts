import { Money } from '@arkelythex/domain';
import type { Currency } from '@arkelythex/domain/value-objects/Money';
import { bankingRepository } from '../../infrastructure/banking.repository';

/**
 * Application service that computes aggregated banking metrics (balances, counts).
 *
 * @deprecated Use {@link GetBankingSummaryQuery} from `application/queries/get-banking-summary.query` instead.
 * This service will be removed in a future version.
 *
 * @example
 * ```ts
 * const service = new SummaryService();
 * await service.getSummary('cmp_123');
 * ```
 */
export class SummaryService {
  constructor(private readonly repository = bankingRepository) {}

  async getSummary(companyId: string) {
    const accounts = await this.repository.findAllAccounts(companyId);

    let totalBalancePEN = Money.zero('PEN');
    let totalBalanceUSD = Money.zero('USD');

    for (const account of accounts) {
      if (!account.isActive) continue;
      const balance = Money.fromAmount(Number(account.currentBalance), toCurrency(account.currency));
      if (account.currency === 'PEN') {
        totalBalancePEN = totalBalancePEN.add(balance);
      } else if (account.currency === 'USD') {
        totalBalanceUSD = totalBalanceUSD.add(balance);
      }
    }

    const unreconciledCount = await this.repository.countUnreconciled(companyId);

    const format = (value: Money) => value.getAmount().toFixed(2);

    return {
      totalAccounts: accounts.filter((account) => account.isActive).length,
      totalBalance: format(totalBalancePEN),
      totalBalancePEN: format(totalBalancePEN),
      totalBalanceUSD: format(totalBalanceUSD),
      unreconciledTransactions: unreconciledCount,
    };
  }
}

function toCurrency(value: string | null | undefined): Currency {
  return value === 'USD' ? 'USD' : 'PEN';
}
