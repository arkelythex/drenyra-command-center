import type { LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/atoms/text';
import { cn } from '@/lib/utils';
import { baseInputClass } from './styles';

interface FormFieldProps {
  label: string;
  placeholder: string;
  icon: LucideIcon;
  error?: string;
  type?: string;
  maxLength?: number;
  inputProps: Record<string, unknown>;
}

export function FormField({
  label,
  placeholder,
  icon: Icon,
  error,
  type,
  maxLength,
  inputProps,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Text variant="label" className="ml-1 text-sm font-medium text-muted-foreground">
        {label}
      </Text>
      <div className="relative group">
        <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70 transition-colors group-focus-within:text-foreground" />
        <Input
          {...inputProps}
          type={type}
          maxLength={maxLength}
          placeholder={placeholder}
          className={cn(baseInputClass)}
        />
      </div>
      {error ? (
        <Text variant="label" className="text-sm text-red-600 ml-1 font-medium">
          {error}
        </Text>
      ) : null}
    </div>
  );
}
