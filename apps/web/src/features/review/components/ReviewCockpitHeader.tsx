'use client';

import type { ReactElement } from 'react';
import { BrainCircuit, Filter, History, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ReviewCockpitHeader({ itemCount }: { itemCount: number }): ReactElement {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-1)] px-8 py-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <BrainCircuit size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter">Review Cockpit</h1>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            <span className="text-2xs font-black uppercase tracking-widest text-muted-foreground/60">
              Enjambre sincronizado · {itemCount} items
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="group relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/40" />
          <input
            placeholder="Buscar misiones..."
            aria-label="Buscar revisión"
            className="h-10 w-64 rounded-full border border-[var(--border-subtle)] bg-black/5 dark:bg-white/5 pl-9 pr-4 text-xs font-semibold outline-none transition-[border-color,box-shadow,background-color] duration-200 focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button variant="ghost" size="icon" aria-label="Filtrar" className="rounded-full hover:bg-muted/50">
          <Filter size={18} />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Historial" className="rounded-full text-muted-foreground hover:bg-muted/50">
          <History size={18} />
        </Button>
      </div>
    </header>
  );
}
