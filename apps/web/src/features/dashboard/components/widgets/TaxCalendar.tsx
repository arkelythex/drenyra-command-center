import React from 'react';
import { CalendarClock, ChevronRight, Clock3 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Deadline = {
  id: string;
  task: string;
  dueDate: Date;
  daysLeft: number;
};

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function buildMonthDeadlines(reference: Date): Deadline[] {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const today = startOfDay(reference).getTime();

  const items: Array<{ id: string; task: string; day: number }> = [
    { id: 'sire', task: 'SIRE (RVIE/RCE)', day: 12 },
    { id: 'pdt-621', task: 'PDT 621 (IGV/Renta)', day: 15 },
    { id: 'plame', task: 'PLAME (Planilla)', day: 18 },
    { id: 'ple', task: 'Libros Electrónicos (PLE)', day: 20 },
    { id: 'itan', task: 'Declaración ITAN', day: 25 },
  ];

  return items.map((item) => {
    const dueDate = new Date(year, month, item.day);
    const daysLeft = Math.ceil((startOfDay(dueDate).getTime() - today) / (24 * 60 * 60 * 1000));
    return { ...item, dueDate, daysLeft };
  });
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' }).format(date);
}

function getStatus(daysLeft: number): 'urgent' | 'upcoming' | 'scheduled' | 'overdue' {
  if (daysLeft < 0) return 'overdue';
  if (daysLeft <= 2) return 'urgent';
  if (daysLeft <= 7) return 'upcoming';
  return 'scheduled';
}

export const TaxCalendar: React.FC = () => {
  const deadlines = buildMonthDeadlines(new Date());

  return (
    <Card className="h-full rounded-2xl border border-border/50 bg-[var(--surface-1)]/84 p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-label font-semibold uppercase tracking-[0.14em] text-muted-foreground">Obligaciones SUNAT</p>
          <h3 className="mt-1 text-sm font-semibold tracking-tight text-foreground">Calendario tributario del mes</h3>
        </div>
        <CalendarClock size={16} className="text-muted-foreground" aria-hidden="true" />
      </div>

      <div className="space-y-2">
        {deadlines.map((item) => {
          const status = getStatus(item.daysLeft);
          const badgeClass =
            status === 'urgent'
              ? 'border-danger-subtle bg-danger-subtle text-danger'
              : status === 'upcoming'
                ? 'border-warning-subtle bg-warning-subtle text-warning'
                : status === 'overdue'
                  ? 'border-danger-muted bg-danger-muted text-danger'
                  : 'border-border/60 bg-background/50 text-muted-foreground';

          return (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-border/40 bg-[var(--surface-2)]/42 p-3 transition-colors hover:bg-[var(--surface-2)]/58"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{item.task}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Vence {formatDate(item.dueDate)}</p>
              </div>
              <div className={cn('ml-3 inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-label font-medium', badgeClass)}>
                <Clock3 size={12} aria-hidden="true" />
                {item.daysLeft < 0 ? `${Math.abs(item.daysLeft)} d atraso` : `${item.daysLeft} d`}
              </div>
            </div>
          );
        })}
      </div>

      <Link
        to="/cumplimiento/compliance"
        className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-primary"
      >
        Ver calendario completo
        <ChevronRight size={14} aria-hidden="true" />
      </Link>
    </Card>
  );
};
