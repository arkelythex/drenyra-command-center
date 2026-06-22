import { Bot, CheckCircle2, Clock3, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useSwarmStore } from '@/features/intelligence/stores/useSwarmStore';

const statusMeta = {
  idle: {
    label: 'Disponible',
    tone: 'border-border/40 bg-card/60 text-muted-foreground',
    icon: Clock3,
  },
  running: {
    label: 'Procesando',
    tone: 'border-info-subtle bg-info-subtle text-info',
    icon: Bot,
  },
  completed: {
    label: 'Operativo',
    tone: 'border-success-subtle bg-success-subtle text-success',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Revisar',
    tone: 'border-danger-subtle bg-danger-subtle text-danger',
    icon: AlertTriangle,
  },
} as const;

function formatTime(iso?: string) {
  if (!iso) return 'Sin actividad reciente';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Sin actividad reciente';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const AgentLiveStatus = () => {
  const activeRunId = useSwarmStore((state) => state.activeRunId);
  const runsById = useSwarmStore((state) => state.runsById);
  const activeRun = activeRunId ? runsById[activeRunId] : null;
  const latestLog = activeRun?.logs.at(-1) ?? null;
  const status = activeRun?.status ?? 'idle';
  const meta = statusMeta[status];
  const StatusIcon = meta.icon;

  return (
    <Card className="border-border/30 bg-[var(--surface-1)]/84 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-border/40 bg-[var(--surface-2)]/56 text-primary">
              <Bot size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Asistente Arkelythex</p>
              <p className="text-xs text-muted-foreground">Estado del motor de automatización</p>
            </div>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-label font-semibold ${meta.tone}`}>
          <StatusIcon size={12} />
          {meta.label}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/30 bg-background/55 px-3 py-3">
          <p className="text-label font-medium text-muted-foreground">Último evento</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {latestLog?.message ?? 'Sin eventos recientes'}
          </p>
        </div>

        <div className="rounded-2xl border border-border/30 bg-background/55 px-3 py-3">
          <p className="text-label font-medium text-muted-foreground">Última actualización</p>
          <p className="mt-1 text-sm font-medium text-foreground">{formatTime(latestLog?.timestamp)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border/30 bg-[var(--surface-2)]/42 px-3 py-3 text-xs text-muted-foreground">
        {status === 'failed'
          ? 'El motor requiere revisión antes de volver a automatizar tareas.'
          : status === 'running'
            ? 'El motor está procesando una misión activa. Puedes revisar el detalle en Asistente Arkelythex.'
            : 'Listo para consultas, análisis y automatizaciones asistidas.'}
      </div>
    </Card>
  );
};
