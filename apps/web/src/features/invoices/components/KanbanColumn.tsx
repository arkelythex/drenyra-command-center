import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LEGIBILITY } from '@/lib/legibility';

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  total?: string;
  children: ReactNode;
  active?: boolean;
}

export const KanbanColumn = ({ id, title, count, total, children, active }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group/col flex w-[300px] shrink-0 snap-start flex-col transition-[transform,box-shadow] duration-200 md:w-[340px] lg:w-80 xl:w-[360px] 2xl:w-80",
        isOver && "scale-[1.01] ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
        <div className="flex items-center justify-between mb-6 px-3">
            <div className="flex items-center gap-3">
                 <div className={cn(
                     "h-1.5 w-1.5 rounded-full transition-[background-color,box-shadow,transform] duration-300",
                     active ? "bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "bg-muted-foreground/40",
                     isOver && "bg-primary shadow-[0_0_12px_rgba(var(--primary),0.8)] scale-150"
                 )} />
                 <span className={cn(
                     "text-label font-black uppercase tracking-[0.2em] transition-colors",
                     LEGIBILITY.textShadow.light,
                     active ? "text-foreground" : "text-muted-foreground",
                     isOver && "text-primary"
                 )}>
                     {title}
                 </span>
            </div>
            <div className="flex items-center gap-2 font-mono">
                 <span className="rounded border border-border/60 bg-muted/60 px-2 py-0.5 text-label font-black text-foreground backdrop-blur-sm">
                     {count}
                 </span>
                 {total && (
                     <span className="rounded border border-border/60 bg-muted/60 px-2 py-0.5 text-label font-bold tabular-nums text-foreground backdrop-blur-sm">
                         {total}
                     </span>
                 )}
            </div>
        </div>
        
        <div className={cn(
          "no-scrollbar flex flex-1 flex-col gap-4 overflow-y-auto pb-10 transition-[background-color,padding,border-radius]",
          isOver && "bg-primary/5 rounded-xl p-2"
        )}>
            {children}
        </div>
    </div>
  );
};
