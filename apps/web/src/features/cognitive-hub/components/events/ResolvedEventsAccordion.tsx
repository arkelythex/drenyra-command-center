import { AnimatePresence, motion } from 'framer-motion';
import { BrainCircuit, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ResolvedHubEvent } from '../hub-events.constants';

interface ResolvedEventsAccordionProps {
  events: ReadonlyArray<ResolvedHubEvent>;
  expanded: boolean;
  onToggle: () => void;
  onSelectEvent: (event: ResolvedHubEvent) => void;
}

export const ResolvedEventsAccordion = ({
  events,
  expanded,
  onToggle,
  onSelectEvent,
}: ResolvedEventsAccordionProps) => {
  return (
    <section className="rounded-2xl border border-border/30 bg-card/60">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-primary/70" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {events.length} procesos resueltos
            </p>
            <p className="text-label text-muted-foreground">
              Ocultos por defecto para reducir ruido visual.
            </p>
          </div>
        </div>
        <ChevronRight
          size={16}
          className={cn('text-muted-foreground transition-transform duration-300', expanded && 'rotate-90')}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 overflow-hidden px-4 pb-4"
          >
            {events.map((event) => {
              const Icon = event.icon;
              return (
                <div
                  key={event.id}
                  onClick={() => onSelectEvent(event)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectEvent(event); } }}
                  className="group flex cursor-pointer items-center justify-between rounded-xl border border-border/25 bg-background/55 p-4 transition-colors hover:border-border/40"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-xl border border-border/25 bg-card/65',
                        event.color,
                      )}
                    >
                      <Icon size={16} />
                    </div>
                    <p className="text-sm font-medium tracking-tight text-foreground/85">
                      <span className="mr-2 text-label font-medium text-muted-foreground">
                        {event.agent}
                      </span>
                      {event.msg}
                    </p>
                  </div>
                  <div className="flex h-8 items-center gap-2 rounded-full border border-border/25 bg-card/65 px-3 text-2xs font-medium text-muted-foreground transition-colors group-hover:text-foreground/75">
                    <BrainCircuit size={12} />
                    Ver detalle
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
};
