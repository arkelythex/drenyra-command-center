import { BrainCircuit } from 'lucide-react';
import type { AgentStats } from './cost-dashboard.types';

interface AgentCardProps {
  name: string;
  stats: AgentStats;
}

export const AgentCard = ({ name, stats }: AgentCardProps) => (
  <div className="flex items-center justify-between rounded-xl border border-border/10 bg-foreground/[0.02] p-3 transition-all hover:border-border/30">
    <div className="flex items-center gap-3">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/20 bg-foreground/5">
        <BrainCircuit size={12} className="text-foreground/50" />
      </div>
      <div>
        <span className="text-2xs font-black uppercase tracking-tight text-foreground/70">
          {name.replace('-agent', '').replace('-', ' ')}
        </span>
        <p className="text-[8px] text-muted-foreground">{stats.calls} llamadas</p>
      </div>
    </div>

    <div className="text-right">
      <span className="text-label font-mono font-black text-foreground tabular-nums">
        ${stats.totalCost.toFixed(4)}
      </span>
      <p className="text-[8px] font-mono text-muted-foreground/50">
        ø ${stats.avgCostPerCall.toFixed(5)}
      </p>
    </div>
  </div>
);
