'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Text } from '@/components/atoms/text';
import { CashflowCard } from '../widgets/CashflowCard';
import type { CashflowTask } from '../../hooks/useCashflow';

interface CashflowBoardColumnProps {
  column: { id: string; title: string; taskIds: string[] };
  tasks: CashflowTask[];
  formatMoney: (amount: number) => string;
  dynamicShadow: string;
  glassClassName: string;
  baseZIndex: number;
}

export function CashflowBoardColumn({
  column,
  tasks,
  formatMoney,
  dynamicShadow,
  glassClassName,
  baseZIndex,
}: CashflowBoardColumnProps): JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const totalAmount = tasks.reduce((sum, task) => sum + task.amount, 0);

  return (
    <div className="flex h-full max-h-full w-[300px] shrink-0 flex-col md:w-[340px] lg:w-80 xl:w-[360px] 2xl:w-80">
      <div
        className={cn(
          'group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-xl transition-colors duration-500',
          isOver
            ? 'border-[rgba(var(--premium-info-rgb),0.40)] ring-2 ring-primary/20'
            : 'hover:border-[rgba(var(--premium-info-rgb),0.20)]',
        )}
      >
        <div
          className={`sticky top-0 border-b border-border/50 bg-muted/20 p-6 ${glassClassName}`}
          style={{ zIndex: baseZIndex }}
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  column.id === 'pending'
                    ? 'bg-orange-500'
                    : column.id === 'audit'
                      ? 'bg-[var(--premium-action-blue)]'
                      : column.id === 'scheduled'
                        ? 'bg-[var(--premium-action-blue)]'
                        : 'bg-[var(--premium-success)]',
                )}
                style={{ boxShadow: dynamicShadow }}
              />
              <Text variant="label" className="text-label tracking-[0.2em] opacity-70">
                {column.title}
              </Text>
            </div>
            <span className="flex h-6 min-w-[24px] items-center justify-center rounded-lg border border-border/50 bg-background text-label font-black text-foreground shadow-sm">
              {tasks.length}
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="mr-1 text-sm font-medium text-muted-foreground">Total:</span>
            <Text variant="data" className="text-2xl tracking-tight text-foreground">
              {formatMoney(totalAmount)}
            </Text>
          </div>

          <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-background/50">
            <div
              className={cn(
                'h-full rounded-full transition-[width,background-color,box-shadow] duration-700 ease-out',
                column.id === 'pending'
                  ? 'w-3/4 bg-orange-500'
                  : column.id === 'audit'
                    ? 'w-1/2 bg-[var(--premium-action-blue)]'
                    : column.id === 'scheduled'
                      ? 'w-1/4 bg-[var(--premium-action-blue)]'
                      : 'w-full bg-[var(--premium-success)]',
              )}
            />
          </div>
        </div>

        <div
          ref={setNodeRef}
          className={cn(
            'custom-scrollbar relative flex-1 space-y-3 overflow-y-auto p-4 transition-colors',
            isOver ? 'bg-[rgba(var(--premium-info-rgb),0.02)]' : '',
          )}
        >
          {isOver ? (
            <div className="pointer-events-none absolute inset-0 z-0 m-2 rounded-[1.5rem] border-2 border-dashed border-[rgba(var(--premium-info-rgb),0.30)]" />
          ) : null}

          <div className="relative z-10 space-y-3">
            {tasks.map((task, index) => (
              <CashflowCard key={task.id} task={task} index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
