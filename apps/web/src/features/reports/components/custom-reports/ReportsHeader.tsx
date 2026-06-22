import { FileText, Filter, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ReportsHeaderProps {
  onFocusSearch: () => void;
  onOpenFilters: () => void;
  onCreateReport: () => void;
}

export const ReportsHeader = ({ onFocusSearch, onOpenFilters, onCreateReport }: ReportsHeaderProps) => {
  return (
    <header className="sticky top-0 z-[40] flex shrink-0 flex-col items-center justify-between gap-6 border-b border-border bg-card/90 px-6 py-6 shadow-sm backdrop-blur-md md:flex-row">
      <div className="group relative flex w-full items-center gap-6 md:w-auto">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm transition-[transform,box-shadow,background-color] duration-300 group-hover:scale-[1.02]">
          <FileText size={28} strokeWidth={2.5} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="mb-2 text-2xl font-black uppercase leading-none tracking-tighter text-foreground">
            Reportes personalizados
          </h1>
          <div className="flex items-center gap-3">
            <Badge variant="info" className="h-6 gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-current" />
              Centro de reportes
            </Badge>
            <span className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground/70">
              Datos exportables
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-row items-center justify-end gap-4 md:w-auto">
        <div className="group relative flex-1 md:w-80">
          <Search className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 transition-colors duration-300 group-focus-within:text-primary" />
          <input
            aria-label="Buscar reporte"
            onFocus={onFocusSearch}
            placeholder="Buscar reporte o plantilla"
            className="h-12 w-full rounded-2xl border border-border bg-card/70 pl-12 pr-6 text-sm font-semibold tracking-tight shadow-inner transition-[background-color,border-color,box-shadow] duration-300 placeholder:text-muted-foreground/70 focus:border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={onOpenFilters}
          aria-label="Filtrar"
          className="hidden h-12 w-12 rounded-2xl border-border text-foreground hover:bg-muted sm:flex"
        >
          <Filter size={18} strokeWidth={2.5} />
        </Button>
        <Button
          onClick={onCreateReport}
          className="h-12 rounded-2xl bg-primary px-8 text-2xs font-black uppercase tracking-[0.2em] text-primary-foreground shadow-lg shadow-primary/20 transition-[background-color,box-shadow,transform,opacity] duration-200 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} className="mr-3" /> Nuevo reporte
        </Button>
      </div>
    </header>
  );
};
