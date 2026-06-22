import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { captureError } from '@/lib/monitoring';
import { toast } from 'sonner';
import { AuthLayout } from './AuthLayout';
import { MotionDiv, entranceVariants, containerVariants } from '@/components/ui/motion-primitives';
import { Text } from '@/components/atoms/text';
import { resetPasswordSchema, type ResetPasswordFormData } from '../schemas/reset-password.schema';

function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;

  const labels = ['Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-[var(--premium-action-blue)]', 'bg-[var(--premium-success)]'];

  return {
    score,
    label: labels[score] || 'Muy débil',
    color: colors[score] || 'bg-red-500'
  };
}

export const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password');
  const passwordStrength = password ? getPasswordStrength(password) : null;

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error('Token inválido', {
        description: 'El enlace de restablecimiento es inválido o ha expirado.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: data.password,
        token,
      });

      if (error) {
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
          toast.error('Token expirado o inválido', {
            description: 'Por favor solicita un nuevo enlace de restablecimiento.',
          });
        } else {
          toast.error('Error al restablecer contraseña', {
            description: error.message || 'Por favor intenta nuevamente.',
          });
        }
        return;
      }

      toast.success('Contraseña actualizada', {
        description: 'Tu contraseña ha sido restablecida exitosamente.',
      });

      setTimeout(() => {
        navigate({ to: '/login' });
      }, 2000);

    } catch (error) {
      captureError(error instanceof Error ? error : new Error('Reset password request failed'), {
        hasToken: Boolean(token),
        source: 'features/auth/ResetPasswordForm.onSubmit',
      });
      toast.error('Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Error" subtitle="Enlace inválido">
        <MotionDiv className="text-center space-y-4">
          <Text className="text-foreground/90">
            El enlace de restablecimiento es inválido o ha expirado.
          </Text>
          <Button variant="outline" asChild>
            <a href="/forgot-password">Solicitar nuevo enlace</a>
          </Button>
        </MotionDiv>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Nueva Contraseña" subtitle="Ingresa tu nueva contraseña.">
      <MotionDiv
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        tagName="form"
      >
        <MotionDiv variants={entranceVariants} className="space-y-3">
          <Text variant="label" className="text-foreground ml-1 text-sm font-medium">Nueva Contraseña</Text>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/80 group-focus-within:text-primary transition-colors duration-300" />
            <Input
              {...register('password')}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="h-14 rounded-xl border-border bg-card/70 pl-12 pr-12 text-base font-medium text-foreground transition-[background-color,border-color,box-shadow] duration-300 placeholder:text-muted-foreground/70"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground focus:outline-none transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {passwordStrength && (
            <div className="space-y-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className={'h-1 flex-1 rounded-full transition-[background-color,transform,opacity] duration-300 ' + (index < passwordStrength.score ? passwordStrength.color : 'bg-border')}
                  />
                ))}
              </div>
              <Text variant="label" className="text-muted-foreground ml-1 text-xs">
                Fortaleza: {passwordStrength.label}
              </Text>
            </div>
          )}
          {errors.password && <Text variant="label" className="text-red-400 ml-1 text-xs">{errors.password.message}</Text>}
        </MotionDiv>

        <MotionDiv variants={entranceVariants} className="space-y-3">
          <Text variant="label" className="text-foreground ml-1 text-sm font-medium">Confirmar Contraseña</Text>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/80 group-focus-within:text-primary transition-colors duration-300" />
            <Input
              {...register('confirmPassword')}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              className="h-14 rounded-xl border-border bg-card/70 pl-12 pr-12 text-base font-medium text-foreground transition-[background-color,border-color,box-shadow] duration-300 placeholder:text-muted-foreground/70"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/80 hover:text-foreground focus:outline-none transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && <Text variant="label" className="text-red-400 ml-1 text-xs">{errors.confirmPassword.message}</Text>}
        </MotionDiv>

        <MotionDiv variants={entranceVariants}>
          <Button
            type="submit"
            disabled={isLoading}
            className="group relative h-14 w-full overflow-hidden rounded-xl border-none bg-primary text-sm font-bold uppercase tracking-widest text-primary-foreground shadow-lg transition-[background-color,box-shadow,opacity] duration-200 hover:opacity-90 motion-reduce:transition-none"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <span className="flex items-center gap-3 relative z-10">
                RESTABLECER CONTRASEÑA
                <ArrowRight size={20} strokeWidth={2.5} className="transition-colors" />
              </span>
            )}
          </Button>
        </MotionDiv>
      </MotionDiv>
    </AuthLayout>
  );
};
