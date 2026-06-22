import { ArrowUpRight } from 'lucide-react';
import type { NavigationItem } from '@/lib/navigation';

interface CommandViewProps {
  results: readonly NavigationItem[];
  onSelect: (item: NavigationItem) => void;
}

export function CommandView({ results, onSelect }: CommandViewProps) {
  return (
    <div className="space-y-2 overflow-y-auto p-3 custom-scrollbar">
      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
          No hay resultados para este comando.
        </p>
      ) : (
        results.map((item) => (
          <button
            key={item.to}
            type="button"
            onClick={() => onSelect(item)}
            className="flex w-full items-center justify-between rounded-xl border border-border/60 bg-background/40 px-3 py-2 text-left transition-colors hover:bg-background/70"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.to}</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))
      )}
    </div>
  );
}
