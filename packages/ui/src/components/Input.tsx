/**
 * Input Component
 *
 * Clean text input using ARKELYTHEX design tokens.
 * Provides consistent styling for form fields.
 *
 * @example
 * ```tsx
 * <Input
 *   placeholder="Enter your email"
 *   type="email"
 *   onChange={(e) => setEmail(e.target.value)}
 * />
 * ```
 */

import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
	/** Additional CSS classes */
	className?: string;
}

/**
 * Text input with ARKELYTHEX brand styling.
 * Uses design tokens for consistent theming.
 */
export function Input({ className, ...props }: InputProps) {
	return (
		<input
			className={cn(
				"h-[var(--density-row)] w-full rounded-[var(--radius-md)]",
				"bg-[var(--color-surface-2)]",
				"text-[var(--color-text-primary)]",
				"border border-[var(--color-border)]",
				"px-[var(--density-pad-md)] text-sm",
				"placeholder:text-[var(--color-text-muted)]",
				"transition-colors duration-200",
				"focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]",
				"disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
				className,
			)}
			{...props}
		/>
	);
}
