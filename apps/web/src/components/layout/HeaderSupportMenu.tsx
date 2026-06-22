import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Command,
  Keyboard,
  LifeBuoy,
  PlugZap,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { KeyboardShortcutsHelp } from '@/components/ui/keyboard-shortcuts-help';
import { cn } from '@/lib/utils';

interface HeaderSupportMenuProps {
  compact?: boolean;
  className?: string;
}

export const HeaderSupportMenu: React.FC<HeaderSupportMenuProps> = ({
  compact = false,
  className,
}) => {
  const navigate = useNavigate();
  const [isShortcutsOpen, setIsShortcutsOpen] = React.useState(false);

  const openCommandPalette = React.useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-command-palette'));
  }, []);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={compact ? 'icon' : 'sm'}
            className={cn(
              compact ? 'h-10 w-10 rounded-xl' : 'h-9 rounded-xl px-3',
              className,
            )}
            aria-label="Ayuda y atajos"
            title="Ayuda y atajos"
          >
            <LifeBuoy className="h-4 w-4" />
            {!compact ? (
              <span className="text-xs font-semibold uppercase tracking-wide">
                Ayuda
              </span>
            ) : null}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-72 border-[var(--border-subtle)] bg-[var(--surface-1)] shadow-md"
        >
          <DropdownMenuLabel className="pb-3">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Ayuda Consistente
              </p>
              <p className="text-sm font-medium leading-relaxed text-foreground/90">
                Mantiene soporte y atajos en la misma posición en toda la app.
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator className="bg-[var(--border-subtle)]" />

          <DropdownMenuItem
            onClick={() => setIsShortcutsOpen(true)}
            className="cursor-pointer focus:bg-muted"
          >
            <Keyboard className="mr-2 h-4 w-4" />
            <span>Atajos de teclado</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={openCommandPalette}
            className="cursor-pointer focus:bg-muted"
          >
            <Command className="mr-2 h-4 w-4" />
            <span>Buscador global</span>
            <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="bg-[var(--border-subtle)]" />

          <DropdownMenuItem
            onClick={() => navigate({ to: '/connections' })}
            className="cursor-pointer focus:bg-muted"
          >
            <PlugZap className="mr-2 h-4 w-4" />
            <span>Estado OSE</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => navigate({ to: '/cumplimiento/compliance' })}
            className="cursor-pointer focus:bg-muted"
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            <span>Centro de cumplimiento</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <KeyboardShortcutsHelp
        open={isShortcutsOpen}
        onOpenChange={setIsShortcutsOpen}
        hideTrigger
      />
    </>
  );
};
