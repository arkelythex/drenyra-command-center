import { cn } from '@/lib/utils';
import {
  RUN_FILTERS,
  EMPTY_STATE_MESSAGE,
  MAX_VISIBLE_RUNS,
} from '../hub-context-aside.data';
import { ContextRunCard } from './ContextRunCard';
import type { AccountingJobRunView } from '../../../../lib/accounting-job-run-utils';
import type { RunFilter } from '../hub-context-aside.types';

interface ContextRunsSectionProps {
  runs: AccountingJobRunView[];
  runFilter: RunFilter;
  isLoadingRuns: boolean;
  isUpdatingJobRun: boolean;
  onFilterChange: (filter: RunFilter) => void;
  onApprove: (runId: string, jobTitle: string) => void;
  onReject: (runId: string, jobTitle: string) => void;
}

export function ContextRunsSection({
  runs,
  runFilter,
  isLoadingRuns,
  isUpdatingJobRun,
  onFilterChange,
  onApprove,
  onReject,
}: ContextRunsSectionProps) {
  const filteredRuns = runFilter === 'ALL' ? runs : runs.filter((r) => r.status === runFilter);
  const visibleRuns = filteredRuns.slice(0, MAX_VISIBLE_RUNS);

  const filterCounts = {
    ALL: runs.length,
    AWAITING_APPROVAL: runs.filter((r) => r.status === 'AWAITING_APPROVAL').length,
    RUNNING: runs.filter((r) => r.status === 'RUNNING').length,
    COMPLETED: runs.filter((r) => r.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <span className="px-1 text-label font-medium text-[var(--text-secondary)]">
          Misiones recientes
        </span>

        <div className="flex flex-wrap gap-1.5">
          {RUN_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => onFilterChange(filter.id)}
              className={cn(
                'rounded-full border px-2 py-1 text-2xs font-medium transition-[border-color,color,background-color] duration-150',
                runFilter === filter.id
                  ? 'border-primary/20 bg-primary/10 text-primary'
                  : 'border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)]',
              )}
            >
              {filter.label} · {filterCounts[filter.id]}
            </button>
          ))}
        </div>
      </div>

      {isLoadingRuns ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-3 text-label text-[var(--text-secondary)]">
          Cargando trabajos del control plane...
        </div>
      ) : visibleRuns.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-3 text-label text-[var(--text-secondary)]">
          {EMPTY_STATE_MESSAGE[runFilter]}
        </div>
      ) : (
        <div className="space-y-2">
          {visibleRuns.map((run) => (
            <ContextRunCard
              key={run.id}
              run={run}
              isUpdatingJobRun={isUpdatingJobRun}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
