/**
 * CostDashboard — Monitor de Costos de IA en Tiempo Real
 *
 * Polling cada 30s via TanStack Query.
 * Muestra: presupuesto diario/mensual, top agentes, trend 7 días, últimos eventos.
 *
 * @since Feb 2026
 */

import { useQuery } from '@tanstack/react-query';
import { Activity, AlertTriangle, CheckCircle2, TrendingUp, Zap } from 'lucide-react';
import { useMemo } from 'react';
import { AgentCard } from './cost-dashboard/agent-card';
import { fetchCostStats, fetchRecentEvents } from './cost-dashboard/cost-dashboard.api';
import { BudgetGauge } from './cost-dashboard/budget-gauge';
import { EventRow } from './cost-dashboard/event-row';
import { TrendBar } from './cost-dashboard/trend-bar';

interface CostDashboardProps {
  organizationId?: number;
  pollingInterval?: number;
}

export const CostDashboard = ({ organizationId, pollingInterval = 30_000 }: CostDashboardProps) => {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['ai-cost-stats', organizationId],
    queryFn: () => fetchCostStats(organizationId),
    refetchInterval: pollingInterval,
    staleTime: pollingInterval / 2,
  });

  const { data: recent, isLoading: recentLoading } = useQuery({
    queryKey: ['ai-cost-recent', organizationId],
    queryFn: () => fetchRecentEvents(organizationId),
    refetchInterval: pollingInterval,
    staleTime: pollingInterval / 2,
  });

  const agentEntries = useMemo(
    () => (stats ? Object.entries(stats.historical.byAgent).sort(([, a], [, b]) => b.totalCost - a.totalCost) : []),
    [stats],
  );
  const maxTrend = useMemo(
    () => (stats ? Math.max(...stats.historical.trend.map((point) => point.spent), 0.0001) : 0.0001),
    [stats],
  );
  const lastUpdated = useMemo(() => new Date(dataUpdatedAt).toLocaleTimeString('es-PE'), [dataUpdatedAt]);

  if (statsLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 animate-pulse md:grid-cols-2">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="h-32 rounded-2xl border border-border/10 bg-foreground/5" />
        ))}
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <AlertTriangle size={16} className="flex-shrink-0 text-red-500" />
        <p className="text-xs text-muted-foreground">Error cargando métricas de costo. Reintentando...</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-foreground/5">
            <Activity size={16} className="text-foreground/60" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-foreground">Monitor de Costos IA</h3>
            <div className="mt-0.5 flex items-center gap-1.5">
              <div className="h-1 w-1 motion-safe:animate-pulse rounded-full bg-[var(--premium-success)]" />
              <span className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground/40">
                {stats.meta.source === 'database' ? 'DB' : 'Memoria'} · {lastUpdated}
              </span>
            </div>
          </div>
        </div>

        {stats.meta.totalDbEvents > 0 ? (
          <div className="flex items-center gap-1.5 rounded-lg border border-border/20 bg-foreground/5 px-2 py-1">
            <CheckCircle2 size={10} className="text-[var(--premium-success)]" />
            <span className="text-3xs font-black text-foreground/40">
              {stats.meta.totalDbEvents.toLocaleString()} eventos
            </span>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BudgetGauge label="Presupuesto Diario" slice={stats.budget.daily} />
        <BudgetGauge label="Presupuesto Mensual" slice={stats.budget.monthly} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-border/20 bg-foreground/[0.03] p-5">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Tendencia 7 días
            </span>
            <TrendingUp size={12} className="text-foreground/30" />
          </div>

          {stats.historical.trend.length > 0 ? (
            <div className="flex h-20 items-end gap-1.5 pt-8">
              {stats.historical.trend.map((point) => (
                <TrendBar key={point.date} point={point} maxSpent={maxTrend} />
              ))}
            </div>
          ) : (
            <div className="flex h-20 items-center justify-center">
              <span className="text-3xs uppercase tracking-widest text-muted-foreground/40">Sin datos aún</span>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-border/20 bg-foreground/[0.03] p-5">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground">
              Top Agentes
            </span>
            <Zap size={12} className="text-foreground/30" />
          </div>

          <div className="space-y-2">
            {agentEntries.length > 0 ? (
              agentEntries.slice(0, 4).map(([name, agentStats]) => (
                <AgentCard key={name} name={name} stats={agentStats} />
              ))
            ) : (
              <p className="py-4 text-center text-3xs uppercase tracking-widest text-muted-foreground/40">
                Sin actividad registrada
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-border/20 bg-foreground/[0.03] p-5">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            Actividad Reciente
          </span>
          <div className="h-1.5 w-1.5 motion-safe:animate-pulse rounded-full bg-[var(--premium-success)]" />
        </div>

        {recentLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="h-8 animate-pulse rounded-lg bg-foreground/5" />
            ))}
          </div>
        ) : recent && recent.length > 0 ? (
          <div>
            {recent.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-3xs uppercase tracking-widest text-muted-foreground/40">
            Sin eventos recientes
          </p>
        )}
      </div>
    </section>
  );
};
