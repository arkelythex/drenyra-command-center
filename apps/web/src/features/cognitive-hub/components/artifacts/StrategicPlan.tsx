import { CheckCircle2, Circle, Play, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlanStep } from '../../hooks/useTaskPlanner';

interface StrategicPlanProps {
  steps: PlanStep[];
  onConfirm: () => void;
}

/**
 * StrategicPlan: Visualización de roadmap de ejecución.
 * Estética: Binary Elite 2026.
 */
export const StrategicPlan = ({ steps, onConfirm }: StrategicPlanProps) => {
  return (
    <div className="mt-6 p-6 rounded-3xl bg-foreground/[0.03] border border-border/20 backdrop-blur-3xl space-y-6">
      <header className="flex items-center justify-between border-b border-border/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-2xs font-black uppercase tracking-[0.3em] text-foreground">Proposed Execution Roadmap</span>
        </div>
        <span className="text-3xs font-mono text-muted-foreground uppercase opacity-40">Plan v1.4</span>
      </header>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex gap-4 group">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                step.status === 'completed' ? "bg-foreground border-foreground text-background" : "bg-background border-border text-muted-foreground/20"
              )}>
                {step.status === 'completed' ? <CheckCircle2 size={12} /> : <Circle size={8} fill="currentColor" />}
              </div>
              {idx < steps.length - 1 && <div className="w-px flex-1 bg-border/20" />}
            </div>
            <div className="flex-1 pb-4">
              <span className="text-2xs font-black uppercase text-foreground/80 tracking-widest">{step.label}</span>
              <p className="text-label text-muted-foreground mt-1 leading-relaxed italic">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <footer className="pt-4 flex gap-3">
        <button 
          onClick={onConfirm}
          className="flex-1 py-3 rounded-2xl bg-foreground text-background text-2xs font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-glow flex items-center justify-center gap-2"
        >
          <Play size={12} fill="currentColor" /> Authorized Deployment
        </button>
        <button className="px-6 py-3 rounded-2xl bg-foreground/5 border border-border/20 text-2xs font-black uppercase tracking-widest text-muted-foreground hover:bg-foreground/10 transition-all">
          Refine
        </button>
      </footer>
    </div>
  );
};
