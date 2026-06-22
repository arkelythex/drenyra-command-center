import { ChevronRight, Play, TrendingUp, Zap } from 'lucide-react';
import { cn, n } from '@/lib/utils';
import { DemoCategoryBadge } from './demo-category-badge';
import type { DemoCard as DemoCardType, DemoId } from './demo-showcase.types';
import { tokensToClasses } from '@/lib/design-tokens';

interface DemoCardProps {
  demo: DemoCardType;
  onOpen: (id: DemoId) => void;
}

export const DemoCard = ({ demo, onOpen }: DemoCardProps) => {
  const Icon = demo.icon;

  return (
    <article
      className={cn(tokensToClasses.borderRadius('card'), "group relative cursor-pointer overflow-hidden border border-border/30 bg-foreground/10 p-1 shadow-xl backdrop-blur-md")}
      onClick={() => onOpen(demo.id)}
    >
      <div className="flex h-full flex-col space-y-5 rounded-[1.8rem] border border-border/10 bg-background/60 p-6">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-foreground/5',
              demo.accentColor,
            )}
          >
            <Icon size={20} strokeWidth={1.5} />
          </div>
          <DemoCategoryBadge category={demo.category} />
        </div>

        <div className="flex-1 space-y-2">
          <h3 className="text-sm font-black uppercase leading-tight tracking-tight text-foreground">{demo.title}</h3>
          <p className="text-label leading-relaxed text-muted-foreground">{demo.tagline}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {demo.amountSaved > 0 ? (
            <div className="rounded-xl border border-border/10 bg-foreground/[0.03] p-2">
              <div className="mb-0.5 flex items-center gap-1">
                <TrendingUp size={10} className="text-[var(--premium-success)]" />
                <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">
                  Rescatado
                </span>
              </div>
              <span className="text-xs font-mono font-black text-[var(--premium-success)]">
                {n(demo.amountSaved)}
              </span>
            </div>
          ) : null}

          <div className="rounded-xl border border-border/10 bg-foreground/[0.03] p-2">
            <div className="mb-0.5 flex items-center gap-1">
              <Zap size={10} className="text-foreground/40" />
              <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground">Tiempo</span>
            </div>
            <span className="text-xs font-mono font-black text-foreground/60">{demo.resolutionTimeSeconds}s</span>
          </div>
        </div>

        <button className="shadow-glow flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-3xs font-black uppercase tracking-[0.2em] text-background transition-[background-color,box-shadow,opacity] duration-150 group-hover:opacity-90 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100">
          <Play size={10} strokeWidth={3} fill="currentColor" />
          Ver demo en vivo
          <ChevronRight size={10} />
        </button>
      </div>
    </article>
  );
};
