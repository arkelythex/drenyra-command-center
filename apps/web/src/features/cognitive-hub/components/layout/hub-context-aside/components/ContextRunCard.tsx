import { cn } from '@/lib/utils';
import { RUN_STATUS_LABEL, RUN_STATUS_TONE } from '../hub-context-aside.data';
import type { AccountingJobRunView } from '../../../../lib/accounting-job-run-utils';

interface ContextRunCardProps {
  run: AccountingJobRunView;
  isUpdatingJobRun: boolean;
  onApprove: (runId: string, jobTitle: string) => void;
  onReject: (runId: string, jobTitle: string) => void;
}

export function ContextRunCard({ run, isUpdatingJobRun, onApprove, onReject }: ContextRunCardProps) {
  const statusLabel = RUN_STATUS_LABEL[run.status] ?? 'Listo';
  const statusTone = RUN_STATUS_TONE[run.status] ?? 'text-[var(--color-success)]';

  return (
    <div className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-[var(--text-primary)]">{run.jobTitle}</span>
        <span className={cn('shrink-0 text-2xs font-medium', statusTone)}>{statusLabel}</span>
      </div>
      <p className="truncate text-2xs text-[var(--text-secondary)]">{run.summary || run.prompt}</p>
      <p className="mt-1 text-2xs text-[var(--text-secondary)]/70">
        {new Date(run.updatedAt).toLocaleString([], {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>
      {run.status === 'AWAITING_APPROVAL' ? (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={isUpdatingJobRun}
            onClick={() => onApprove(run.id, run.jobTitle)}
            className="rounded-full border border-[var(--color-success)]/20 bg-[var(--color-success)]/10 px-2.5 py-1 text-2xs font-medium text-[var(--color-success)] transition-[border-color,color,background-color] duration-150 hover:border-[var(--color-success)]/35 hover:bg-[var(--color-success)]/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Aprobar
          </button>
          <button
            type="button"
            disabled={isUpdatingJobRun}
            onClick={() => onReject(run.id, run.jobTitle)}
            className="rounded-full border border-danger/20 bg-danger/10 px-2.5 py-1 text-2xs font-medium text-danger transition-[border-color,color,background-color] duration-150 hover:border-danger/35 hover:bg-danger/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Rechazar
          </button>
        </div>
      ) : null}
    </div>
  );
}
