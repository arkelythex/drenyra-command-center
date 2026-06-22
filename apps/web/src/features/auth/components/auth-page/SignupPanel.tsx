import { Building2, Lock, Mail, User } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { SignupFormData } from './schemas';
import { FormField } from './FormField';
import { AuthSubmitButton } from './AuthSubmitButton';

interface SignupPanelProps {
  form: UseFormReturn<SignupFormData>;
  isLoading: boolean;
  onSubmit: (data: SignupFormData) => void;
}

export function SignupPanel({ form, isLoading, onSubmit }: SignupPanelProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        label="Nombre Completo"
        placeholder="Juan Pérez"
        icon={User}
        error={form.formState.errors.name?.message}
        inputProps={form.register('name')}
      />
      <FormField
        label="Email"
        placeholder="tu@empresa.com"
        icon={Mail}
        error={form.formState.errors.email?.message}
        inputProps={form.register('email')}
      />
      <FormField
        label="RUC Empresarial"
        placeholder="20512345678"
        icon={Building2}
        maxLength={11}
        error={form.formState.errors.ruc?.message}
        inputProps={form.register('ruc')}
      />
      <FormField
        label="Contraseña"
        placeholder="••••••••"
        icon={Lock}
        type="password"
        error={form.formState.errors.password?.message}
        inputProps={form.register('password')}
      />
      <AuthSubmitButton label="CREAR CUENTA" isLoading={isLoading} />
    </form>
  );
}
