import { toast } from 'sonner';
import type { SimulationDemoEvent } from './simulation-demo-events';

interface SimulationToastCardProps {
  event: SimulationDemoEvent;
  toastId: string | number;
}

export function SimulationToastCard({ event, toastId }: SimulationToastCardProps) {
  return (
    <div className="glass-card pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl p-4 shadow-xl">
      <div className="rounded-lg border border-border/60 bg-muted/25 p-2">
        {event.icon}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="mb-1 text-sm font-black tracking-tight text-foreground">
          {event.title}
        </h4>
        <p className="text-xs font-medium leading-relaxed text-muted-foreground">
          {event.message}
        </p>
      </div>
      <button
        type="button"
        onClick={() => toast.dismiss(toastId)}
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted/60 hover:text-foreground"
        aria-label={`Cerrar aviso: ${event.title}`}
      >
        <div className="h-1.5 w-1.5 rounded-full bg-current opacity-55" />
      </button>
    </div>
  );
}
