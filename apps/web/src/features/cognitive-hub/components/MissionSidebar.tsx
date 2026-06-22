import { useCallback } from "react";
import { X, Target, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface MissionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MOCK_MISSIONS = [
  {
    id: "m1",
    label: "Conciliación bancaria Q1",
    status: "active" as const,
    progress: 72,
    agent: "Agente Contable",
  },
  {
    id: "m2",
    label: "Validación SUNAT pendientes",
    status: "pending" as const,
    progress: 45,
    agent: "Agente Fiscal",
  },
  {
    id: "m3",
    label: "Revisión de detracciones",
    status: "completed" as const,
    progress: 100,
    agent: "Agente Compliance",
  },
];

const STATUS_CONFIG = {
  active: { color: "text-[var(--color-info)]", bg: "bg-[var(--color-info)]/10", icon: Target },
  pending: { color: "text-[var(--color-warning)]", bg: "bg-[var(--color-warning)]/10", icon: Clock },
  completed: { color: "text-[var(--color-success)]", bg: "bg-[var(--color-success)]/10", icon: CheckCircle2 },
} as const;

export function MissionSidebar({ isOpen, onClose }: MissionSidebarProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  if (!isOpen) return null;

  return (
    <aside
      className="flex h-full w-80 flex-col border-l border-[var(--border-subtle)] bg-[var(--surface-1)]"
      onKeyDown={handleKeyDown}
      aria-label="Panel de misiones"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-[var(--accent)]" />
          <span className="n text-sm font-semibold text-[var(--text-primary)]">Misiones activas</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
          aria-label="Cerrar panel"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {MOCK_MISSIONS.map((mission) => {
          const statusConf = STATUS_CONFIG[mission.status];
          const StatusIcon = statusConf.icon;
          return (
            <div
              key={mission.id}
              className="group cursor-pointer space-y-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/50 p-3 transition-colors hover:border-[var(--border-default)] hover:bg-[var(--surface-2)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="n text-sm font-medium text-[var(--text-primary)]">{mission.label}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">{mission.agent}</p>
                </div>
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", statusConf.bg)}>
                  <StatusIcon size={14} className={statusConf.color} />
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", statusConf.bg)}
                  style={{ width: `${mission.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <Badge variant={mission.status === "active" ? "info" : mission.status === "pending" ? "warning" : "success"} size="sm">
                  {mission.status === "active" ? "En curso" : mission.status === "pending" ? "Pendiente" : "Completado"}
                </Badge>
                <span className="text-xs text-[var(--text-muted)]">{mission.progress}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
