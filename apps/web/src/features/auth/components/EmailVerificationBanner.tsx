import { useState, useEffect } from 'react';
import { X, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { captureError } from '@/lib/monitoring';
import { useAuthSession } from '../hooks/useAuthSession';

/**
 * EmailVerificationBanner
 *
 * Displays a sticky banner at the top of the page when user's email is not verified.
 * Provides a button to resend verification email and ability to dismiss (persists in localStorage).
 *
 * @example
 * ```tsx
 * <MainLayout>
 *   <EmailVerificationBanner />
 *   <Header />
 *   {children}
 * </MainLayout>
 * ```
 */
export function EmailVerificationBanner() {
  const { user, isAuthenticated } = useAuthSession();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem('email-verification-banner-dismissed');
    if (dismissed === 'true') {
       
      setIsDismissed(true);
    }
  }, []);

  // Reset dismissal when email becomes verified
  useEffect(() => {
    if (user?.emailVerified) {
      localStorage.removeItem('email-verification-banner-dismissed');
       
      setIsDismissed(false);
    }
  }, [user?.emailVerified]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('email-verification-banner-dismissed', 'true');
  };

  const handleResendEmail = async () => {
    if (!user?.email) return;

    setIsResending(true);
    try {
      await authClient.sendVerificationEmail({
        email: user.email,
        callbackURL: `${window.location.origin}/verify-email`,
      });

      toast.success('Email de verificación enviado', {
        description: `Revisa tu bandeja de entrada en ${user.email}`,
        duration: 5000,
      });
    } catch (error) {
      captureError(error instanceof Error ? error : new Error('Verification email resend failed'), {
        email: user.email,
        source: 'features/auth/EmailVerificationBanner.handleResendEmail',
      });
      toast.error('Error al enviar email', {
        description: 'No pudimos enviar el email de verificación. Intenta nuevamente.',
      });
    } finally {
      setIsResending(false);
    }
  };

  // Don't show banner if:
  // - User not authenticated
  // - Email is already verified
  // - User dismissed the banner
  if (!isAuthenticated || !user || user.emailVerified || isDismissed) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-b border-yellow-500/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 gap-4">
          {/* Icon & Message */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-100">
                Email no verificado
              </p>
              <p className="text-xs text-yellow-200/70 mt-0.5">
                Verifica tu email para desbloquear todas las funcionalidades
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-100 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isResending ? 'Enviando...' : 'Reenviar email'}
              </span>
              <span className="sm:hidden">
                {isResending ? 'Enviando...' : 'Reenviar'}
              </span>
            </button>

            <button
              onClick={handleDismiss}
              className="p-2 text-yellow-200/50 hover:text-yellow-100 hover:bg-yellow-500/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
              aria-label="Cerrar banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
