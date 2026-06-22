
import { AutoReconcilePanel } from './reconciliation/AutoReconcilePanel';

interface ReconciliationPanelProps {
  accountId: string | null;
  unreconciledCount: number;
}

export const ReconciliationPanel = ({ accountId, unreconciledCount }: ReconciliationPanelProps) => {
  if (!accountId) return null;
  return (
    <div className="space-y-4">
      <AutoReconcilePanel accountId={accountId} unreconciledCount={unreconciledCount} />
    </div>
  );
};

