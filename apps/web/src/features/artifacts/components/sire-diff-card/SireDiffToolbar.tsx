import type { ReactNode } from 'react';
import { Copy, FileSpreadsheet } from 'lucide-react';
import type { SireStatusFilter } from './types';

const FILTERS: readonly SireStatusFilter[] = ['ALL', 'MISMATCH', 'MISSING_LOCAL', 'MISSING_SUNAT', 'MATCH'];

interface SireDiffToolbarProps {
  statusFilter: SireStatusFilter;
  showMatches: boolean;
  matchRowsHidden: number;
  onStatusFilterChange: (next: SireStatusFilter) => void;
  onToggleMatches: () => void;
  onCopyTable: () => void;
  onExportExcel: () => void;
}

export function SireDiffToolbar({
  statusFilter,
  showMatches,
  matchRowsHidden,
  onStatusFilterChange,
  onToggleMatches,
  onCopyTable,
  onExportExcel,
}: SireDiffToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onStatusFilterChange(value)}
            className={`h-7 rounded-lg border px-2 text-3xs font-black uppercase tracking-wider ${
              statusFilter === value
                ? 'border-primary/30 bg-primary/15 text-primary'
                : 'border-border bg-card/70 text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onToggleMatches}
        className="h-7 rounded-lg border border-border bg-card/70 px-2 text-3xs font-black uppercase tracking-wider text-muted-foreground hover:bg-muted/70 hover:text-foreground"
      >
        {showMatches ? 'Ocultar Match' : `Mostrar Match (${matchRowsHidden})`}
      </button>

      <ActionButton icon={<Copy size={11} className="mr-1" />} label="Copiar Tabla" onClick={onCopyTable} />
      <ActionButton icon={<FileSpreadsheet size={11} className="mr-1" />} label="Exportar Excel" onClick={onExportExcel} />
      <span className="text-3xs font-black uppercase tracking-wider text-primary/70">↑↓ fila | Cmd/Ctrl+K edit | Cmd/Ctrl+Enter aplicar</span>
    </div>
  );
}

interface ActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 items-center rounded-lg border border-border bg-card/70 px-2 text-3xs font-black uppercase tracking-wider text-muted-foreground hover:bg-muted/70 hover:text-foreground"
    >
      {icon}
      {label}
    </button>
  );
}
