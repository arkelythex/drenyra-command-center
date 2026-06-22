import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { cn } from '@/lib/utils';

interface HeaderActivityClusterProps {
  onNotificationsClick?: () => void;
  className?: string;
}

export const HeaderActivityCluster: React.FC<HeaderActivityClusterProps> = ({
  onNotificationsClick,
  className,
}) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-[var(--border-default)] bg-[var(--bg-secondary)] px-1.5 py-1 shadow-sm',
        className,
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={onNotificationsClick}
        className="h-10 rounded-full px-3.5 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
        aria-label="Abrir actividad y notificaciones"
        title="Actividad"
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <Bell className="h-4 w-4" />
          <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--premium-action-cyan)]" />
        </span>
        <span className="hidden xl:inline text-label font-medium tracking-tight">
          Actividad
        </span>
      </Button>

      <div className="h-5 w-px bg-[var(--border-subtle)]" aria-hidden="true" />

      <UserMenu compact className="hover:bg-black/5 dark:hover:bg-white/5" />
    </div>
  );
};
