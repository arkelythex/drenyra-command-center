import { n } from '@/lib/utils';
import { RECONCILIATION_TRANSACTIONS } from './reconciliation.data';

export function formatReconciliationMoney(value: number) {
  return n(value);
}

export function getReconciliationSummary() {
  const unresolvedTransactions = RECONCILIATION_TRANSACTIONS.filter(
    (transaction) => transaction.status !== 'matched',
  );
  const unresolvedCount = unresolvedTransactions.length;
  const unresolvedExposure = unresolvedTransactions.reduce(
    (total, transaction) => total + Math.abs(transaction.amount),
    0,
  );
  const reconciledRate = Math.round(
    ((RECONCILIATION_TRANSACTIONS.length - unresolvedCount) / RECONCILIATION_TRANSACTIONS.length) * 100,
  );

  return {
    unresolvedCount,
    unresolvedExposure,
    reconciledRate,
    requiresHumanDecision: unresolvedCount > 0,
  };
}
