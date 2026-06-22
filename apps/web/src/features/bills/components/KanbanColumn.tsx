import React from 'react';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  title: string;
  count: number;
  total?: string;
  children: React.ReactNode;
  active?: boolean;
}

export const KanbanColumn = ({ title, count, total, children, active }: KanbanColumnProps) => {
  return (
    <div className="group/col relative flex w-[300px] shrink-0 flex-col md:w-[332px] lg:w-[340px] xl:w-[352px]">
        <div className="mb-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    active ? "bg-[var(--color-success)]" : "bg-border"
                )} />
                <span className={cn(
                    "text-label font-semibold uppercase tracking-[0.2em] transition-colors",
                    active ? "text-foreground" : "text-muted-foreground"
                )}>
                    {title}
                </span>
            </div>
            <div className="flex items-center gap-2 font-mono">
                <span className="rounded-full border border-border bg-card px-2 py-0.5 text-label font-medium text-muted-foreground shadow-sm">
                    {count}
                </span>
                {total && (
                    <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-label font-medium text-foreground shadow-sm tabular-nums">
                        {total}
                    </span>
                )}
            </div>
        </div>
        
        <div className="no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto pb-10">
            {children}
        </div>
    </div>
  );
};
