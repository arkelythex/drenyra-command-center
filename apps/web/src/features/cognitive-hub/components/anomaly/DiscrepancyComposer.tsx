import { n } from "@/lib/utils";
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Database, FileCode2, Scale, Sparkles, X } from 'lucide-react';
import type { DiscrepancyCommitStatus } from './use-discrepancy-resolution.store';
import type { DiscrepancyScenario } from './discrepancy-scenario';

interface DiscrepancyComposerProps {
  isOpen: boolean;
  scenario: DiscrepancyScenario | null;
  commitStatus: DiscrepancyCommitStatus;
  undoSecondsLeft?: number;
  onClose: () => void;
  onAcceptSuggestion: () => void;
}

export const DiscrepancyComposer = ({
  isOpen,
  scenario,
  commitStatus,
  undoSecondsLeft = 0,
  onClose,
  onAcceptSuggestion,
}: DiscrepancyComposerProps) => {
  if (!scenario) return null;

  const isPendingUndo = commitStatus === 'pending_undo';
  const isCommitted = commitStatus === 'committed';
  const isError = commitStatus === 'error';
  const flaggedCount = scenario.rows.filter((row) => row.status === 'flagged').length;
  const updatedCount = scenario.rows.filter((row) => row.status === 'updated').length;
  const totalDelta = scenario.rows.reduce((acc, row) => {
    const original = Number(row.original.replace(/[^\d.-]/g, ''));
    const corrected = Number(row.corrected.replace(/[^\d.-]/g, ''));
    if (!Number.isFinite(original) || !Number.isFinite(corrected)) return acc;
    return acc + Math.abs(original - corrected);
  }, 0);

  return (
    <AnimatePresence initial={false}>
      {isOpen ? (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.22 }}
          className="mt-4 rounded-[var(--radius-lg)] border border-info-subtle bg-info-subtle p-4 md:p-5"
          aria-label="Herramienta de conciliación SUNAT vs ERP"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="chip chip-info">1. Propuesta</span>
            <span className="chip chip-warning">2. Impacto</span>
            <span className="chip chip-success">3. Confirmación</span>
          </div>

          <header className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-info" />
              <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-secondary">
                Herramienta de Conciliación: Discrepancia IGV
              </h4>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
              aria-label="Cerrar herramienta de conciliación"
            >
              <X size={14} />
            </button>
          </header>

          <div className="mb-4 grid gap-2 rounded-[var(--radius-md)] border border-warning-subtle bg-warning-subtle p-3 sm:grid-cols-3">
            <div>
              <p className="text-2xs uppercase tracking-[0.1em] text-muted">Rows con conflicto</p>
              <p className="text-lg font-semibold tabular-nums text-warning">{flaggedCount}</p>
            </div>
            <div>
              <p className="text-2xs uppercase tracking-[0.1em] text-muted">Rows ajustables</p>
              <p className="text-lg font-semibold tabular-nums text-info">{updatedCount}</p>
            </div>
            <div>
              <p className="text-2xs uppercase tracking-[0.1em] text-muted">Delta estimado</p>
              <p className="text-lg font-semibold tabular-nums text-danger">{n(totalDelta)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <article className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-3">
              <div className="mb-2 flex items-center gap-2">
                <FileCode2 size={13} className="text-info" />
                <span className="text-2xs font-semibold uppercase tracking-[0.1em] text-secondary">
                  SUNAT XML
                </span>
              </div>
              <pre className="max-h-64 overflow-auto rounded-md bg-black/5 dark:bg-white/5 p-3 font-mono text-label leading-relaxed text-muted-foreground">
                {scenario.xmlLines.join('\n')}
              </pre>
            </article>

            <article className="rounded-lg border border-warning-subtle bg-warning-subtle p-3">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles size={13} className="text-warning" />
                <span className="text-2xs font-semibold uppercase tracking-[0.1em] text-secondary">
                  Explicación IA
                </span>
              </div>
              <div className="space-y-3 text-xs text-muted-foreground">
                <p>{scenario.explanation}</p>
                <p className="rounded-md border border-warning-subtle bg-warning-soft px-2 py-1.5 text-warning">
                  Sugerencia: {scenario.recommendation}
                </p>

                <div className="space-y-2 rounded-md border border-border bg-black/20 p-2.5">
                  <p className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    <Scale size={11} />
                    Sustento normativo
                  </p>
                  <div className="space-y-1.5">
                    {scenario.legalReferences.map((reference) => (
                      <a
                        key={reference.id}
                        href={reference.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="group/ref relative block rounded-md border border-[var(--border-default)] bg-[var(--surface-1)] px-2 py-1.5 text-label text-foreground transition-colors hover:border-warning-subtle hover:text-warning"
                      >
                        {reference.label}
                        <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-0 z-50 hidden w-72 rounded-md border border-warning-subtle bg-[var(--surface-1)] p-2.5 text-2xs leading-relaxed text-muted-foreground shadow-lg group-hover/ref:block">
                          <strong className="block text-warning">{reference.label}</strong>
                          <span className="mt-1 block">{reference.excerpt}</span>
                          <span className="mt-1 block text-muted-foreground">
                            Vigencia: {reference.effectiveDate}
                          </span>
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onAcceptSuggestion}
                disabled={isPendingUndo || isCommitted}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-success px-3 py-2 text-label font-semibold uppercase tracking-[0.1em] text-[var(--color-text-inverse)] transition-colors hover:bg-success disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 size={14} />
                {isPendingUndo
                  ? `Pendiente de confirmación (${undoSecondsLeft}s)`
                  : isCommitted
                    ? 'Ajuste confirmado'
                    : 'Aplicar corrección'}
              </button>
              {isError ? (
                <p className="mt-2 text-label text-danger">
                  Error al confirmar. Revisa impacto y vuelve a intentar la confirmación.
                </p>
              ) : null}
              {isPendingUndo ? (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
                  <div
                    className="h-full bg-warning transition-[width] duration-200 ease-linear"
                    style={{ width: `${Math.min(100, Math.max(0, (undoSecondsLeft / 10) * 100))}%` }}
                  />
                </div>
              ) : null}
            </article>

            <article className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-3">
              <div className="mb-2 flex items-center gap-2">
                <Database size={13} className="text-info" />
                <span className="text-2xs font-semibold uppercase tracking-[0.1em] text-secondary">
                  ERP Local
                </span>
              </div>
              <pre className="max-h-64 overflow-auto rounded-md bg-black/5 dark:bg-white/5 p-3 font-mono text-label leading-relaxed text-muted-foreground">
                {scenario.erpLines.join('\n')}
              </pre>
            </article>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
};
