import { Paperclip, Plus, type LucideIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { QuickCommand } from './quick-commands';

interface PlusToolsMenuProps {
  isOpen: boolean;
  isRecording: boolean;
  quickCommands: ReadonlyArray<QuickCommand>;
  commandHint: string;
  onOpenChange: (open: boolean) => void;
  onAttachFile: () => void;
  onToggleRecording: () => void;
  onQuickCommand: (command: string) => void;
}

export function PlusToolsMenu({
  isOpen,
  isRecording,
  quickCommands,
  commandHint,
  onOpenChange,
  onAttachFile,
  onToggleRecording,
  onQuickCommand,
}: PlusToolsMenuProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group/plus flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-black/10 dark:bg-white/10 text-muted-foreground hover:bg-black/15 dark:hover:bg-white/15 hover:text-foreground"
          aria-label="Abrir herramientas"
        >
          <Plus
            size={16}
            strokeWidth={2.5}
            className={cn(isOpen ? 'rotate-45' : '')}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={12}
        className="w-[min(20rem,calc(100vw-2rem))] rounded-3xl border border-[var(--border-default)] bg-[var(--color-surface-1)] p-3 shadow-2xl data-[state=open]:animate-none data-[state=closed]:animate-none"
      >
        <div className="mb-3 border-b border-border/20 pb-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-label font-medium text-muted-foreground">
              Herramientas
            </span>
            <span className="ui-keycap rounded-full px-2 py-1 text-3xs font-medium">
              /
            </span>
          </div>
          <p className="mt-2 text-label leading-relaxed text-muted-foreground">
            Adjuntos, voz y acciones rápidas para tareas contables.
          </p>
        </div>

        <div className="grid gap-2">
          <span className="px-1 text-2xs font-medium text-muted-foreground">
            Entrada
          </span>
          <ToolMenuButton
            icon={Paperclip}
            title="Adjuntar archivo"
            description="Agrega XML, PDF o respaldo contable."
            accentClassName="text-info"
            meta="archivo"
            onClick={onAttachFile}
          />
        </div>

        <div className="mt-3 border-t border-border/20 pt-3">
          <span className="mb-2 block px-1 text-2xs font-medium text-muted-foreground">
            Atajos
          </span>
          <div className="grid grid-cols-1 gap-2">
              {quickCommands.slice(0, 3).map((hint) => (
                <button
                  key={hint.label}
                type="button"
                onClick={() => onQuickCommand(hint.command)}
                className={cn(
                  'flex items-start gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors duration-150',
                  hint.emphasis === 'high'
                    ? 'border-primary/25 bg-primary/10 text-foreground hover:bg-primary/14'
                    : 'border-[var(--border-subtle)] bg-black/5 dark:bg-white/5 text-foreground hover:bg-black/10 dark:hover:bg-white/10',
                )}
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-current/10 bg-current/8">
                  <hint.icon size={13} strokeWidth={2.25} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-xs font-semibold">{hint.label}</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-3xs font-medium',
                      hint.emphasis === 'high' ? 'bg-primary/10 text-primary' : 'ui-keycap',
                      )}
                    >
                      {commandHint}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'mt-1 block truncate text-2xs',
                      hint.emphasis === 'high' ? 'text-foreground/70' : 'text-muted-foreground',
                    )}
                  >
                    {hint.command}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ToolMenuButtonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accentClassName: string;
  meta: string;
  onClick: () => void;
}

function ToolMenuButton({
  icon: Icon,
  title,
  description,
  accentClassName,
  meta,
  onClick,
}: ToolMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-black/5 dark:bg-white/5 px-3 py-2.5 text-left text-foreground transition-colors duration-150 hover:bg-black/10 dark:hover:bg-white/10"
    >
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30',
          accentClassName,
        )}
      >
        <Icon size={14} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-xs font-semibold">{title}</span>
          <span className="ui-keycap rounded-full px-2 py-0.5 text-3xs font-medium">
            {meta}
          </span>
        </div>
        <span className="mt-1 block text-2xs leading-relaxed text-muted-foreground">{description}</span>
      </div>
    </button>
  );
}
