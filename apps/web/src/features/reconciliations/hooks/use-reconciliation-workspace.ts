import React from 'react';
import { RECONCILIATION_TRANSACTIONS } from '../reconciliation.data';

function getInitialTransactionId() {
  return (
    RECONCILIATION_TRANSACTIONS.find((transaction) => transaction.status !== 'matched')?.id ??
    RECONCILIATION_TRANSACTIONS[0]?.id ??
    ''
  );
}

function getInitialCandidateId() {
  return RECONCILIATION_TRANSACTIONS.find((transaction) => transaction.status !== 'matched')
    ?.candidates[0]?.id;
}

export function useReconciliationWorkspace() {
  const [selectedTransactionId, setSelectedTransactionId] = React.useState(getInitialTransactionId);
  const [selectedCandidateId, setSelectedCandidateId] = React.useState<string | undefined>(
    getInitialCandidateId,
  );

  const activeTransaction =
    RECONCILIATION_TRANSACTIONS.find((transaction) => transaction.id === selectedTransactionId) ??
    RECONCILIATION_TRANSACTIONS[0];

  const activeCandidate =
    activeTransaction?.candidates.find((candidate) => candidate.id === selectedCandidateId) ??
    activeTransaction?.candidates[0];

  React.useEffect(() => {
    if (!activeTransaction) {
      return;
    }

    setSelectedCandidateId(activeTransaction.candidates[0]?.id);
  }, [activeTransaction]);

  return {
    activeCandidate,
    activeTransaction,
    selectedTransactionId,
    setSelectedCandidateId,
    setSelectedTransactionId,
    transactions: RECONCILIATION_TRANSACTIONS,
  };
}
