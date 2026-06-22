import React from 'react';
/**
 * Dashboard Artifact - KPI dashboard with compliance scoring
 *
 * Renders primary metric, status circle (rule compliance), and gap analysis.
 *
 * @since Feb 2026
 */

import { FileText, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { HubArtifact } from '@arkelythex/shared/artifacts';
import { registerArtifact } from '../artifact-registry';

type DashboardArt = Extract<HubArtifact, { type: 'dashboard' }>;

export const DashboardArtifact: React.FC<{ artifact: DashboardArt }> = ({ artifact }) => (
  <div className="mt-6 space-y-4 animate-entrance">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* KPI 1: Main metric */}
      <div className="group col-span-2 flex h-48 flex-col justify-between hub-panel-inset p-6">
        <header className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground">{artifact.title}</span>
            {artifact.payload.ruleSource && (
              <span className="text-[8px] font-mono text-primary uppercase mt-1">Fuente: {artifact.payload.ruleSource}</span>
            )}
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-foreground/5 transition-[background-color,border-color,box-shadow,transform] group-hover:shadow-glow">
            <Activity size={16} className="text-foreground" />
          </div>
        </header>
        <div>
          <span className="text-4xl font-black tracking-tighter text-foreground tabular-nums">
            {artifact.payload.primaryMetric.value}
          </span>
          <p className="text-2xs font-bold text-[var(--premium-success)] uppercase mt-1 tracking-widest">
            {artifact.payload.primaryMetric.trend}
          </p>
        </div>
      </div>

      {/* KPI 2: Status circle */}
      <div className="flex flex-col items-center justify-center hub-panel-inset p-6 text-center">
        <div className="relative h-20 w-20 flex items-center justify-center mb-4">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="2" className="text-border/20" />
            <circle
              cx="40" cy="40" r="36"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={226}
              strokeDashoffset={226 - (226 * artifact.payload.statusScore) / 100}
              strokeLinecap="round"
              className={cn(
                'transition-[color,stroke-dashoffset,filter] duration-700 shadow-glow',
                artifact.payload.statusScore > 90 ? 'text-[var(--premium-success)]' : 'text-amber-500'
              )}
            />
          </svg>
          <span className="text-xl font-black text-foreground tabular-nums">{artifact.payload.statusScore}%</span>
        </div>
        <span className="text-3xs font-black uppercase tracking-widest text-muted-foreground">Cumplimiento normativo</span>
      </div>
    </div>

    {/* Gap analysis */}
    {artifact.payload.gapAnalysis && (
      <div className="p-5 hub-panel-inset space-y-4">
        <span className="text-3xs font-black uppercase text-muted-foreground tracking-[0.3em]">Análisis de brechas operativas</span>
        <div className="space-y-3">
          {artifact.payload.gapAnalysis.map((gap, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between text-3xs font-bold uppercase tracking-tight">
                <span className="text-foreground/60">{gap.label}</span>
                <span className="text-foreground">{gap.value}%</span>
              </div>
              <div className="h-1 w-full bg-foreground/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${gap.value}%` }}
                  transition={{ delay: i * 0.1, duration: 1 }}
                  className={cn('h-full', gap.value > 80 ? 'bg-foreground' : 'bg-amber-500')}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    <footer className="flex gap-3">
      <button className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-foreground py-3 text-2xs font-black uppercase tracking-widest text-background shadow-glow transition-[background-color,box-shadow,transform,opacity] hover:opacity-90">
        <FileText size={14} /> Evidencia certificada
      </button>
      <button className="rounded-2xl border border-border/20 bg-foreground/5 px-6 py-3 text-2xs font-black uppercase tracking-widest text-muted-foreground transition-[background-color,border-color,color,box-shadow,transform] hover:bg-foreground/10">
        Ajustar reglas
      </button>
    </footer>
  </div>
);

// Auto-register
registerArtifact('dashboard', DashboardArtifact);
