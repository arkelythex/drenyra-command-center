import { AlertTriangle, Clock, FileText, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SireStatusBadge } from './sire-status-badge';
import type { SireRowIcon, SireTableRowData } from './sire-management.types';

interface SireTableRowProps {
  row: SireTableRowData;
}

const ROW_ICONS: Record<SireRowIcon, LucideIcon> = {
  alert: AlertTriangle,
  clock: Clock,
  file: FileText,
};

export const SireTableRow = ({ row }: SireTableRowProps) => {
  const Icon = ROW_ICONS[row.icon];

  return (
    <tr
      className={cn(
        'group transition-colors duration-200',
        row.isCritical ? 'bg-danger-subtle hover:bg-danger-muted/60' : 'hover:bg-muted/20',
      )}
    >
      <td className="px-10 py-6">
        <div className="flex items-center gap-5">
          <div
            className={cn(
              'h-11 w-11 shrink-0 rounded-xl border shadow-sm transition-[background-color,border-color,color,transform] duration-200',
              'flex items-center justify-center',
              row.isCritical
                ? 'border-danger-subtle bg-danger-muted text-danger group-hover:scale-[1.03] group-hover:bg-danger-soft'
                : 'border-border/40 bg-background text-muted-foreground group-hover:border-foreground/20 group-hover:text-foreground',
            )}
          >
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded border border-border/30 bg-muted/30 px-1.5 py-0.5 font-mono text-label font-black text-foreground/50">
                {row.date}
              </span>
              <p className="font-mono text-xs font-black uppercase tracking-tight text-foreground">{row.id}</p>
            </div>
            <p className="truncate text-label font-black uppercase tracking-wide text-muted-foreground/80">
              {row.provider}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-6 text-center align-middle">
        <SireStatusBadge status={row.sunatStatus} />
      </td>
      <td className="px-4 py-6 text-center align-middle">
        <SireStatusBadge status={row.internalStatus} />
      </td>
      <td className="px-4 py-6 text-right align-middle font-mono text-sm font-black tracking-tighter tabular-nums text-foreground">
        {row.amount}
      </td>
      <td className="px-10 py-6 text-right align-middle">
        <Button
          variant={row.isCritical ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            'h-9 rounded-lg px-5 text-xs font-black uppercase tracking-widest transition-[background-color,border-color,color,transform,box-shadow] duration-200',
            row.isCritical
              ? 'bg-danger text-white shadow-sm hover:-translate-y-0.5 hover:bg-danger/90'
              : 'border border-transparent text-muted-foreground hover:border-border/50 hover:bg-background hover:text-foreground',
          )}
        >
          {row.isCritical ? 'Corregir' : 'Auditar'}
        </Button>
      </td>
    </tr>
  );
};
