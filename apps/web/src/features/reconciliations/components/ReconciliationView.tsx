import { ChevronDown, Landmark } from 'lucide-react';
import { useSidebarLayout } from '@/stores/sidebar-layout.store';
import { useHaptics, useFinancialHaptics } from '@/hooks/useHaptics';
import { useReconciliationWorkspace } from '../hooks/use-reconciliation-workspace';
import { getReconciliationSummary, formatReconciliationMoney } from '../reconciliation.utils';

// Sections
import { ReconciliationHeader } from './sections/ReconciliationHeader';
import { ReconciliationExecutiveSummary } from './sections/ReconciliationExecutiveSummary';
import { ReconciliationEvidenceRail } from './sections/ReconciliationEvidenceRail';
import { ReconciliationMatchWorkspace } from './sections/ReconciliationMatchWorkspace';
import { ReconciliationQueuePanel } from './sections/ReconciliationQueuePanel';
import { RECONCILIATION_LEDGER_ENTRIES } from '../reconciliation.data';

export const ReconciliationView = () => {
  const { setIsMobileOpen } = useSidebarLayout();
  const { trigger } = useHaptics();
  const financialHaptics = useFinancialHaptics();
  const {
    activeCandidate,
    activeTransaction,
    setSelectedCandidateId,
    setSelectedTransactionId,
    transactions,
  } = useReconciliationWorkspace();
  const { reconciledRate, requiresHumanDecision, unresolvedCount, unresolvedExposure } =
    getReconciliationSummary();

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden font-sans text-foreground">

      <ReconciliationHeader
        setIsMobileOpen={setIsMobileOpen}
        triggerHaptic={trigger}
      />

      <div className="flex shrink-0 items-center justify-between gap-8 border-b border-border/50 bg-[var(--surface-1)] px-6 py-3">
        <div className="flex items-center gap-4">
          <span className="text-label font-black text-muted-foreground uppercase tracking-[0.2em]">Cuenta activa</span>
          <button
            onClick={() => trigger('light')}
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm font-black text-foreground shadow-sm transition-colors hover:border-info-subtle hover:text-info hover:shadow-md"
          >
            <Landmark size={14} className="text-info" /> BCP SOLES <ChevronDown size={14} className="opacity-50" />
          </button>
        </div>
        <div className="flex items-center gap-6 border-l border-border/60 pl-6 h-8">
          <div className="flex items-center gap-2">
            <div className="ui-dot-success h-2 w-2 rounded-full" />
            <span className="text-label font-black uppercase tracking-widest text-success">98% conciliado</span>
          </div>
          <div className="flex items-center gap-2 opacity-60">
            <div className="ui-dot-warning h-2 w-2 rounded-full" />
            <span className="text-label font-black uppercase tracking-widest text-foreground">2 pendientes</span>
          </div>
        </div>
      </div>

      <ReconciliationExecutiveSummary
        unmatchedCount={unresolvedCount}
        unmatchedExposure={formatReconciliationMoney(unresolvedExposure)}
        reconciledRate={reconciledRate}
        decisionRequiresHuman={requiresHumanDecision}
      />

      {activeTransaction ? (
        <div className="grid min-h-0 flex-1 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <ReconciliationQueuePanel
            formatMoney={formatReconciliationMoney}
            selectedTransactionId={activeTransaction.id}
            transactions={transactions}
            onSelect={(transactionId) => {
              trigger('light');
              setSelectedTransactionId(transactionId);
            }}
          />
          <ReconciliationMatchWorkspace
            activeCandidate={activeCandidate}
            activeTransaction={activeTransaction}
            formatMoney={formatReconciliationMoney}
            ledgerEntries={RECONCILIATION_LEDGER_ENTRIES}
            onSelectCandidate={(candidateId) => {
              trigger('light');
              setSelectedCandidateId(candidateId);
            }}
          />
          <ReconciliationEvidenceRail
            activeCandidate={activeCandidate}
            activeTransaction={activeTransaction}
            onDecision={(decision) => {
              if (decision === 'approve') {
                financialHaptics.onSave();
                return;
              }
              trigger('light');
            }}
          />
        </div>
      ) : null}

    </div>
  );
};
