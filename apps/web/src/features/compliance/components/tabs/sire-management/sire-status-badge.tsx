import { cn } from '@/lib/utils';
import type { SireStatus } from './sire-management.types';

interface SireStatusBadgeProps {
  status: SireStatus;
}

const STATUS_STYLES: Record<SireStatus, string> = {
  Propuesta: 'status-badge-info',
  'En Proceso': 'status-badge-info',
  'No Registrado': 'status-badge-danger',
  'No Existe': 'status-badge-danger',
  Registrado: 'status-badge-success',
  Sincronizado: 'status-badge-success',
  Observado: 'status-badge-warning',
  Rechazado: 'status-badge-danger',
  Anulado: 'status-badge-warning',
};

export const SireStatusBadge = ({ status }: SireStatusBadgeProps) => {
  return (
    <span
      className={cn(
        'status-badge min-w-[100px] px-3 py-1.5 text-xs font-black uppercase shadow-sm',
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  );
};
