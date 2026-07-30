import { AlertTriangle, RotateCcw } from "lucide-react";
import type { MissionBlocker } from "@drenyra/mission-domain";

interface MissionBlockedStateProps {
  blockers: MissionBlocker[];
  onRetry: () => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  WARNING: "border-amber-500/20 bg-amber-500/5",
  ERROR: "border-red-500/20 bg-red-500/5",
  CRITICAL: "border-red-500/30 bg-red-500/10",
};

export function MissionBlockedState({ blockers, onRetry }: MissionBlockedStateProps) {
  if (blockers.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Bloqueos ({blockers.length})
      </h3>
      <div className="space-y-2">
        {blockers.map((blocker) => (
          <div
            key={blocker.id}
            className={`flex items-center gap-2 rounded-lg border p-2 ${SEVERITY_COLORS[blocker.severity] ?? "border-amber-500/20 bg-amber-500/5"}`}
          >
            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-[var(--text-primary)]">
                {blocker.reason}
              </span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] shrink-0">
              {blocker.severity}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
      >
        <RotateCcw size={14} />
        Reintentar
      </button>
    </div>
  );
}
