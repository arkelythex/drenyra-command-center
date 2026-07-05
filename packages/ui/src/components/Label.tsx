/**
 * Label Component
 *
 * Form label using Radix UI primitive for accessibility.
 * Provides consistent styling for form labels.
 *
 * @example
 * ```tsx
 * <Label htmlFor="email">Email address</Label>
 * <Input id="email" type="email" />
 * ```
 */

import * as LabelPrimitive from "@radix-ui/react-label";
import type { LabelHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "../lib/utils";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
	/** Additional CSS classes */
	className?: string;
	/** Label text content */
	children?: ReactNode;
}

/**
 * Form label with ARKELYTHEX brand styling.
 * Uses Radix UI for accessible label association.
 */
function Label(
	{ className, children, ...props }: LabelProps,
	ref?: Ref<HTMLLabelElement>,
) {
	return (
		<LabelPrimitive.Root
			ref={ref}
			className={cn(
				"text-sm font-medium text-[var(--color-text-primary)]",
				"select-none",
				className,
			)}
			{...props}
		>
			{children}
		</LabelPrimitive.Root>
	);
}

export { Label };
