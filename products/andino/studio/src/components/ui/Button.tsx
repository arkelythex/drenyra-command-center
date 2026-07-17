import { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'warning';

interface ButtonProps {
  variant: ButtonVariant;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent-400 text-bg-void hover:bg-accent-500 glow-accent',
  secondary: 'bg-bg-surface border border-border-subtle text-text-primary hover:bg-bg-elevated hover:border-border-accent',
  danger: 'bg-error text-white hover:brightness-110',
  warning: 'bg-warning/80 text-white hover:brightness-110',
};

export default function Button({
  variant,
  children,
  onClick,
  disabled = false,
  className = '',
  icon,
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {icon}
      {children}
    </button>
  );
}
