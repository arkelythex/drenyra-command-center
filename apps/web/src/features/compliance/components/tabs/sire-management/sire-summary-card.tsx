import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useHaptics } from '@/hooks/useHaptics';

interface SireSummaryCardProps {
  icon: ReactNode;
  title: string;
  badge: string;
  count: number | string;
  unit: string;
  variant: 'default' | 'alert';
}

export const SireSummaryCard = ({
  icon,
  title,
  badge,
  count,
  unit,
  variant,
}: SireSummaryCardProps) => {
  const isAlert = variant === 'alert';
  const { trigger } = useHaptics();

  return (
    <Card
      variant="bordered"
      padding="none"
      onClick={() => trigger('light')}
      className={cn(
        'group cursor-pointer rounded-2xl transition-[border-color,background-color,box-shadow] duration-150',
        isAlert
          ? 'border-danger-subtle bg-danger-subtle hover:border-danger-muted'
          : 'border-border/70 bg-card/95 hover:border-border',
      )}
    >
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div
            className={cn(
              'rounded-xl border p-3 transition-colors',
              isAlert
                ? 'border-danger-subtle bg-danger-muted text-danger'
                : 'border-border/60 bg-muted/30 text-foreground',
            )}
          >
            {icon}
          </div>
          <span
            className={cn(
              'rounded-lg border px-2.5 py-1 text-2xs font-semibold tracking-[0.06em]',
              isAlert
                ? 'border-danger-subtle bg-danger-muted text-danger'
                : 'border-border/60 bg-muted/30 text-muted-foreground',
            )}
          >
            {badge}
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-label font-medium tracking-[0.06em] text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-3">
            <span
              className="font-mono text-3xl font-semibold tracking-tight tabular-nums text-foreground"
            >
              {count}
            </span>
            <span className="text-label font-medium tracking-[0.05em] text-muted-foreground">{unit}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
