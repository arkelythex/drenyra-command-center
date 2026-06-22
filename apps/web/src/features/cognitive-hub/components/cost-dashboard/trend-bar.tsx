import { motion } from 'framer-motion';
import type { TrendPoint } from './cost-dashboard.types';

interface TrendBarProps {
  point: TrendPoint;
  maxSpent: number;
}

export const TrendBar = ({ point, maxSpent }: TrendBarProps) => {
  const height = maxSpent > 0 ? (point.spent / maxSpent) * 100 : 0;

  return (
    <div className="group flex flex-1 flex-col items-center gap-1.5">
      <div className="relative flex h-16 w-full items-end">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${height}%` }}
          transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
          className="w-full rounded-t-sm bg-foreground/20 transition-colors group-hover:bg-foreground/40"
        />

        {height > 0 ? (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-2 py-0.5 text-[8px] font-black text-background opacity-0 transition-all group-hover:opacity-100">
            ${point.spent.toFixed(4)}
          </div>
        ) : null}
      </div>

      <span className="origin-left rotate-45 text-[7px] font-mono text-muted-foreground/40">
        {point.date.slice(5)}
      </span>
    </div>
  );
};
