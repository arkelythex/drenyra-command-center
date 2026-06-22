import { useNavigate } from '@tanstack/react-router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  User,
  LogOut,
  Settings,
  Building2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../hooks/useAuth';
import { useAuthSession } from '../hooks/useAuthSession';
import { getInitials, getAvatarColor } from '../utils/avatar.utils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { UXModeToggle } from '@/components/ui/UXModeToggle';
import { captureError } from '@/lib/monitoring';

interface UserMenuProps {
  compact?: boolean;
  className?: string;
}

export function UserMenu({ compact = false, className }: UserMenuProps) {
  const navigate = useNavigate();
  const { user } = useAuthSession();
  const { logout } = useAuthStore();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada', {
        description: 'Has cerrado sesión exitosamente.',
      });
      navigate({ to: '/login' });
    } catch (error) {
      captureError(error instanceof Error ? error : new Error('Logout failed'), {
        source: 'features/auth/UserMenu.handleLogout',
      });
      toast.error('Error al cerrar sesión');
    }
  };

  const initials = getInitials(user.name);
  const avatarColor = getAvatarColor(user.name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50",
          compact
            ? "h-10 rounded-full px-2.5 hover:bg-[var(--surface-3)]"
            : "rounded-lg px-3 py-2 hover:bg-muted/70",
          className,
        )}
        aria-label="Abrir menú de usuario"
      >
        {/* Avatar */}
        <div className="relative">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className={`h-8 w-8 rounded-full ${avatarColor} flex items-center justify-center ring-2 ring-border`}>
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
          )}

          {/* Email verification indicator */}
          {user.emailVerified ? (
            <CheckCircle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-[var(--premium-success)] bg-app-shell rounded-full" />
          ) : (
            <AlertCircle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-amber-500 bg-app-shell rounded-full" />
          )}
        </div>

        {/* User info */}
        <div className={cn("min-w-0 flex-col items-start", compact ? "hidden" : "hidden md:flex")}>
          <span className="text-sm font-medium text-foreground truncate max-w-[120px]">
            {user.name}
          </span>
          {user.role && (
            <span className="text-xs text-muted-foreground/80 uppercase">
              {user.role}
            </span>
          )}
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground/80 transition-opacity",
            compact ? "opacity-70" : "opacity-100",
          )}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-72 bg-[var(--surface-1)] border-[var(--border-subtle)] shadow-md"
      >
        {/* User header */}
        <DropdownMenuLabel className="pb-3">
          <div className="flex items-start gap-3">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <div className={`h-10 w-10 rounded-full ${avatarColor} flex items-center justify-center ring-2 ring-primary/20`}>
                <span className="text-white font-bold">{initials}</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>

              <div className="flex items-center gap-2 mt-1.5">
                {/* Role badge */}
                {user.role && (
                  <Badge variant="secondary" className="text-xs px-2 py-0 h-5">
                    {user.role === 'ADMIN' && '👑 Admin'}
                    {user.role === 'ACCOUNTANT' && '📊 Contador'}
                    {user.role === 'VIEWER' && '👁️ Viewer'}
                  </Badge>
                )}

                {/* Email verification badge */}
                {!user.emailVerified && (
                  <Badge variant="outline" className="text-xs px-2 py-0 h-5 border-amber-500/50 text-amber-600">
                    No verificado
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        {/* RUC info (SUNAT compliance) */}
        {user.ruc && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <div className="px-2 py-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground/80 mb-1">
                <Building2 className="h-3 w-3" />
                <span className="uppercase font-semibold tracking-wide">RUC Empresa</span>
              </div>
              <p className="font-mono text-foreground text-sm">{user.ruc}</p>
            </div>
          </>
        )}

        <DropdownMenuSeparator className="bg-border" />

        <div className="px-2 py-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-label font-medium tracking-[0.04em] text-muted-foreground">
              Apariencia
            </span>
            <span className="text-2xs text-muted-foreground/75">
              Preferencia visual
            </span>
          </div>
          <UXModeToggle />
        </div>

        <DropdownMenuSeparator className="bg-border" />

        {/* Menu items */}
        <DropdownMenuItem
          onClick={() => navigate({ to: '/profile' })}
          className="cursor-pointer focus:bg-muted"
        >
          <User className="mr-2 h-4 w-4" />
          <span>Mi Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => navigate({ to: '/settings' })}
          className="cursor-pointer focus:bg-muted"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Configuración</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer focus:bg-red-500/10 text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
