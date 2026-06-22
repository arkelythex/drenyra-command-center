import { Calendar as CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InvoiceDateFieldsProps {
  issueDate: string;
  dueDate: string;
  onIssueDateChange: (date: string) => void;
  onDueDateChange: (date: string) => void;
}

export function InvoiceDateFields({
  issueDate,
  dueDate,
  onIssueDateChange,
  onDueDateChange,
}: InvoiceDateFieldsProps) {
  return (
    <>
      <div className="space-y-4 flex flex-col">
        <Label className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-2 pl-1">
          <CalendarIcon size={12} className="text-primary" />
          Fecha de Emisión
        </Label>
        <div className="relative group">
          <Input
            aria-label="Fecha de emisión"
            className="h-14 rounded-2xl border-border bg-card/80 px-6 font-mono text-label font-black text-foreground shadow-md shadow-black/5 backdrop-blur-md transition-[background-color,border-color,box-shadow,color] hover:bg-card hover:border-primary/30"
            onChange={(event) => onIssueDateChange(event.target.value)}
            type="date"
            value={issueDate}
          />
          <CalendarIcon className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary opacity-40 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100" />
        </div>
      </div>

      <div className="space-y-4 flex flex-col">
        <Label className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground/70 flex items-center gap-2 pl-1">
          <CalendarIcon size={12} className="text-[var(--premium-action-cyan)]" />
          Fecha de Vencimiento
        </Label>
        <div className="relative group">
          <Input
            aria-label="Fecha de vencimiento"
            className="h-14 rounded-2xl border-border bg-card/80 px-6 font-mono text-label font-black text-foreground shadow-md shadow-black/5 backdrop-blur-md transition-[background-color,border-color,box-shadow,color] hover:bg-card hover:border-[rgba(var(--premium-info-rgb),0.30)]"
            onChange={(event) => onDueDateChange(event.target.value)}
            type="date"
            value={dueDate}
          />
          <CalendarIcon className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--premium-action-cyan)] opacity-40 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100" />
        </div>
      </div>
    </>
  );
}
