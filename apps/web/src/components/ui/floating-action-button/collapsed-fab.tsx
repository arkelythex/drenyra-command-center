import { Plus } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QuickAction } from './types';

interface CollapsedFabProps {
  isOpen: boolean;
  className?: string;
  actions: readonly QuickAction[];
  onMainClick: () => void;
  onSelectAction: (actionId: string) => void;
}

export function CollapsedFab({ isOpen, className, actions, onMainClick, onSelectAction }: CollapsedFabProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      layoutId="omnibar-container"
      className={cn('fixed bottom-6 right-6 z-50 lg:hidden', className)}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
      transition={{ duration: prefersReducedMotion ? 0.1 : 0.16, ease: 'easeOut' }}
    >
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: prefersReducedMotion ? 0.1 : 0.16, ease: 'easeOut' }}
            className="absolute bottom-20 right-0 flex flex-col items-end space-y-3"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: prefersReducedMotion ? 0 : index * 0.03, duration: 0.14, ease: 'easeOut' }}
                className="flex items-center gap-4"
              >
                <span className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/95 px-3 py-1.5 text-xs font-medium tracking-wide text-primary shadow-md backdrop-blur-lg">
                  {action.label}
                </span>

                <Button
                  size="icon"
                  aria-label={action.label}
                  className="group relative h-11 w-11 overflow-hidden rounded-full border border-[var(--glass-border)] bg-[var(--glass-surface)] shadow-md backdrop-blur-lg transition-[background-color,border-color,box-shadow,transform] duration-150"
                  onClick={() => onSelectAction(action.id)}
                >
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-r opacity-20 transition-opacity duration-150 group-hover:opacity-30',
                      action.color,
                    )}
                  />
                  <action.icon size={20} className="relative z-10 text-primary" />
                </Button>
                </motion.div>
                ))}
                </motion.div>
                ) : null}
                </AnimatePresence>

                <Button
                size="icon"
                aria-label={isOpen ? 'Cerrar acciones rapidas' : 'Abrir acciones rapidas'}
                className={cn(
                'group relative h-[3.75rem] w-[3.75rem] overflow-hidden rounded-full border border-[var(--glass-border)] bg-gradient-to-br from-[var(--info)] to-[var(--info)]/80 text-white shadow-[var(--shadow-lg)] transition-[transform,box-shadow] duration-150',
                isOpen && 'rotate-45',
                )}
                onClick={onMainClick}
                >
                <div className="pointer-events-none absolute -left-1/2 -top-1/2 h-[200%] w-[200%] rotate-45 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                <Plus size={28} className="relative z-10 text-white" strokeWidth={1.5} />
                </Button>
    </motion.div>
  );
}
