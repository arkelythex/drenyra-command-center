import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { BudgetSlice } from './cost-dashboard.types';

interface BudgetGaugeProps {
  label: string;
  slice: BudgetSlice;
}

export const BudgetGauge = ({ label, slice }: BudgetGaugeProps) => {
  const isWarning = slice.percentage > 70;
  const isCritical = slice.percentage > 90;

  return (
    <div className="space-y-4 rounded-2xl border border-border/20 bg-foreground/[0.03] p-5">
      <div className="flex items-center justify-between">
        <span className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            'text-xs font-mono font-black tabular-nums',
            isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-[var(--premium-success)]',
          )}
        >
          ${slice.spent.toFixed(4)}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, slice.percentage)}%` }}
          transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
          className={cn(
            'h-full rounded-full',
            isCritical
              ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
              : isWarning
                ? 'bg-amber-500'
                : 'bg-[var(--premium-success)]',
          )}
        />
      </div>

      <div className="flex items-center justify-between text-3xs font-mono text-muted-foreground/50">
        <span>Restante: ${slice.remaining.toFixed(2)}</span>
        <span>Límite: ${slice.limit}</span>
      </div>
    </div>
  );
};
