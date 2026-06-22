import { X, RotateCcw, History, FileDiff, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * A checkpoint represents a snapshot of an entity at a point in time,
 * recording what changed, by which agent, and why.
 */
export interface Checkpoint {
  id: string;
  entityType: string;
  entityId: string;
  beforeSnapshot: Record<string, unknown>;
  afterSnapshot: Record<string, unknown>;
  diff: string;
  agentId: string;
  reason: string;
  createdAt: string;
  status: string;
}

export interface CheckpointHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  checkpoints: Checkpoint[];
  onRollback: (checkpointId: string) => void;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function CheckpointHistory({ isOpen, onClose, checkpoints, onRollback }: CheckpointHistoryProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Historial de checkpoints"
    >
      <div
        className="mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <div className="flex items-center gap-2">
            <History size={18} className="text-[var(--accent)]" />
            <h2 className="n text-base font-semibold text-[var(--text-primary)]">Historial de cambios</h2>
            <Badge variant="neutral" size="sm">{checkpoints.length} checkpoint{checkpoints.length !== 1 ? "s" : ""}</Badge>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
            aria-label="Cerrar"
          >
            <X size={14} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {checkpoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History size={32} className="mb-3 text-[var(--text-muted)]" />
              <p className="n text-sm font-medium text-[var(--text-primary)]">Sin checkpoints</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">No hay cambios registrados para este elemento.</p>
            </div>
          ) : (
            checkpoints.map((cp) => (
              <div
                key={cp.id}
                className="space-y-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/50 p-4"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileDiff size={14} className="shrink-0 text-[var(--accent)]" />
                      <span className="n text-sm font-medium text-[var(--text-primary)]">
                        {cp.entityType} — {cp.entityId}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">{cp.reason}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRollback(cp.id)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-warning)] transition-colors hover:bg-[var(--color-warning)]/10"
                  >
                    <RotateCcw size={12} />
                    Rollback
                  </button>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {formatDate(cp.createdAt)}
                  </span>
                  <span className="rounded-md bg-[var(--surface-3)] px-1.5 py-0.5 font-mono text-[10px]">{cp.agentId}</span>
                  <Badge variant="neutral" size="sm" className="ml-auto">{cp.status}</Badge>
                </div>

                {/* Diff preview */}
                {cp.diff && (
                  <pre className="overflow-x-auto rounded-lg bg-[#0a0a0e] p-3 text-[11px] leading-relaxed text-[var(--text-secondary)]">
                    {cp.diff}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] px-5 py-3">
          <p className="text-xs text-[var(--text-muted)]">
            Los checkpoints registran cada modificación realizada por agentes.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-3)]"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
