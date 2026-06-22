/**
 * Button Component
 *
 * Primary interaction element with variants for different visual
 * intensities and semantic states.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Save changes
 * </Button>
 * ```
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

/** Button visual variants */
export type ButtonVariant =
	| "default"
	| "primary"
	| "secondary"
	| "ghost"
	| "danger"
	| "outline";

/** Button size options */
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	/** Visual style variant */
	variant?: ButtonVariant;
	/** Size of the button */
	size?: ButtonSize;
	/** Button content */
	children?: ReactNode;
	/** Whether the button is disabled */
	disabled?: boolean;
}

/**
 * Button with ARKELYTHEX brand styling.
 * Uses design tokens for consistent theming.
 */
export function Button({
	variant = "default",
	size = "md",
	disabled = false,
	className,
	children,
	...props
}: ButtonProps) {
	const baseStyles =
		"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-semibold tracking-[0.01em] select-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-1)] disabled:pointer-events-none disabled:opacity-50";

	const variantStyles: Record<ButtonVariant, string> = {
		default: [
			"bg-[var(--color-surface-3)]",
			"text-[var(--color-text-primary)]",
			"border border-[var(--color-border)]",
			"hover:bg-[var(--color-surface-4)]",
		].join(" "),
		primary: [
			"bg-[var(--color-primary)]",
			"text-[var(--color-accent-secondary)]",
			"border border-transparent",
			"shadow-[var(--shadow-primary)]",
			"hover:bg-[var(--color-primary-hover)]",
			"hover:shadow-[var(--shadow-lg)]",
		].join(" "),
		secondary: [
			"bg-[var(--color-surface-2)]",
			"text-[var(--color-text-primary)]",
			"border border-[var(--color-border-strong)]",
			"hover:bg-[var(--color-surface-3)]",
			"hover:border-[var(--color-border)]",
		].join(" "),
		ghost: [
			"bg-transparent",
			"text-[var(--color-text-secondary)]",
			"border border-transparent",
			"hover:bg-[var(--color-surface-2)]",
			"hover:text-[var(--color-text-primary)]",
		].join(" "),
		danger: [
			"bg-[var(--color-danger)]",
			"text-white",
			"border border-transparent",
			"shadow-[var(--shadow-danger)]",
			"hover:bg-[var(--color-danger-hover)]",
		].join(" "),
		outline: [
			"bg-transparent",
			"text-[var(--color-text-primary)]",
			"border border-[var(--color-border)]",
			"hover:bg-[var(--color-surface-2)]",
			"hover:border-[var(--color-border-strong)]",
		].join(" "),
	};

	const sizeStyles: Record<ButtonSize, string> = {
		sm: "h-8 px-3 text-xs",
		md: "h-10 px-4",
		lg: "h-12 px-6 text-base",
		icon: "h-10 w-10 p-0",
	};

	return (
		<button
			className={cn(
				baseStyles,
				variantStyles[variant],
				sizeStyles[size],
				className,
			)}
			disabled={disabled}
			{...props}
		>
			{children}
		</button>
	);
}
