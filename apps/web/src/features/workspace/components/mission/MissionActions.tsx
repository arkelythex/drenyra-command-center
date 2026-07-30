import { Play, RotateCcw, FileEdit } from "lucide-react";
import type { AccountingMissionStatus } from "@drenyra/mission-domain";

interface MissionActionsProps {
  status: AccountingMissionStatus;
  isReady: boolean;
  isAwaiting: boolean;
  isFinished: boolean;
  onStart: () => void;
  onReset: () => void;
  onRequestRevision: () => void;
}

export function MissionActions({
  status,
  isReady,
  isAwaiting,
  isFinished,
  onStart,
  onReset,
  onRequestRevision,
}: MissionActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {isReady && !isAwaiting && (
        <button
          type="button"
          onClick={onStart}
          className="flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Play size={16} />
          Iniciar misión
        </button>
      )}

      {status === ("REJECTED" as AccountingMissionStatus) && (
        <button
          type="button"
          onClick={onRequestRevision}
          className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
        >
          <FileEdit size={16} />
          Solicitar revisión
        </button>
      )}

      {isFinished && (
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
        >
          <RotateCcw size={16} />
          Nueva misión
        </button>
      )}

      {status === ("FAILED" as AccountingMissionStatus) && (
        <button
          type="button"
          onClick={onStart}
          className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)]"
        >
          <RotateCcw size={16} />
          Reintentar
        </button>
      )}
    </div>
  );
}
