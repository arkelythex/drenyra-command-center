type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'accent';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
  accent: 'bg-accent-400/10 text-accent-400',
};

export default function Badge({ variant, children, pulse = false }: BadgeProps) {
  return (
    <span
      className={`
        inline-block px-2 py-0.5 rounded text-xs font-medium
        ${variantStyles[variant]}
        ${pulse ? 'animate-pulse-glow' : ''}
      `}
    >
      {children}
    </span>
  );
}
