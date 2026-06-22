/**
 * Badge Component
 *
 * Status indicator with semantic color variants.
 * Used for labels, tags, and status indicators.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge variant="danger">Overdue</Badge>
 * ```
 */

import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";

/** Badge visual variants */
export type BadgeVariant =
	| "default"
	| "secondary"
	| "success"
	| "info"
	| "warning"
	| "danger"
	| "accent"
	| "outline"
	| "soft";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	/** Visual style variant */
	variant?: BadgeVariant;
	/** Badge content */
	children?: React.ReactNode;
}

/**
 * Badge with semantic color variants.
 * Uses design tokens for consistent theming.
 */
export function Badge({
	variant = "default",
	className,
	children,
	...props
}: BadgeProps) {
	const variantStyles: Record<BadgeVariant, string> = {
		default: [
			"border-[var(--color-border)]",
			"bg-[var(--color-surface-3)]",
			"text-[var(--color-text-secondary)]",
		].join(" "),
		secondary: [
			"border-[var(--color-border)]",
			"bg-[var(--color-surface-2)]",
			"text-[var(--color-text-muted)]",
		].join(" "),
		outline: [
			"border-[var(--color-border)]",
			"bg-transparent",
			"text-[var(--color-text-secondary)]",
		].join(" "),
		soft: [
			"border-transparent",
			"bg-[var(--color-surface-3)]",
			"text-[var(--color-text-secondary)]",
		].join(" "),
		success: [
			"border-[rgba(var(--color-success-rgb),0.3)]",
			"bg-[rgba(var(--color-success-rgb),0.15)]",
			"text-[var(--color-success)]",
		].join(" "),
		info: [
			"border-[rgba(var(--color-info-rgb),0.3)]",
			"bg-[rgba(var(--color-info-rgb),0.15)]",
			"text-[var(--color-info)]",
		].join(" "),
		warning: [
			"border-[rgba(var(--color-warning-rgb),0.3)]",
			"bg-[rgba(var(--color-warning-rgb),0.15)]",
			"text-[var(--color-warning)]",
		].join(" "),
		danger: [
			"border-[rgba(var(--color-danger-rgb),0.3)]",
			"bg-[rgba(var(--color-danger-rgb),0.15)]",
			"text-[var(--color-danger)]",
		].join(" "),
		accent: [
			"border-[rgba(var(--color-accent-rgb),0.3)]",
			"bg-[rgba(var(--color-accent-rgb),0.15)]",
			"text-[var(--color-accent)]",
		].join(" "),
	};

	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-[var(--radius-full)]",
				"border px-2.5 py-0.5",
				"text-[10px] font-semibold uppercase tracking-[0.08em]",
				"transition-colors",
				variantStyles[variant],
				className,
			)}
			{...props}
		>
			{children}
		</span>
	);
}
