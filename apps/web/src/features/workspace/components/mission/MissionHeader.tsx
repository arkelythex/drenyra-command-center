import { Loader2, AlertTriangle, FileText } from "lucide-react";
import type { AccountingMissionStatus } from "@drenyra/mission-domain";

interface MissionHeaderProps {
  status: AccountingMissionStatus;
  isMockMode: boolean;
  elapsedMs: number;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  QUEUED: "En cola",
  RUNNING: "Ejecutando misión…",
  BLOCKED: "Misión bloqueada",
  AWAITING_APPROVAL: "Esperando aprobación",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  REVISION_REQUESTED: "Revisión solicitada",
  COMPLETED: "Completada",
  FAILED: "Fallida",
  UNKNOWN: "Estado desconocido",
};

export function MissionHeader({ status, isMockMode, elapsedMs }: MissionHeaderProps) {
  const label = STATUS_LABELS[status] ?? status;
  const isRunning = status === "RUNNING" as AccountingMissionStatus;
  const isBlocked = status === "BLOCKED" as AccountingMissionStatus;
  const isAwaiting = status === "AWAITING_APPROVAL" as AccountingMissionStatus;
  const elapsedSec = Math.floor(elapsedMs / 1000);

  return (
    <div className="flex items-center gap-2">
      {isRunning && (
        <Loader2 size={16} className="animate-spin text-[var(--accent)]" />
      )}
      {isBlocked && (
        <AlertTriangle size={16} className="text-amber-500" />
      )}
      {isAwaiting && (
        <AlertTriangle size={16} className="text-amber-500" />
      )}
      {status === ("DRAFT" as AccountingMissionStatus) && (
        <FileText size={16} className="text-[var(--text-muted)]" />
      )}
      {isMockMode && (
        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-500">
          SIMULACIÓN
        </span>
      )}
      <span className="text-sm font-medium text-[var(--text-primary)]">
        {label}
      </span>
      {elapsedMs > 0 && (
        <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
          {elapsedSec}s
        </span>
      )}
    </div>
  );
}
