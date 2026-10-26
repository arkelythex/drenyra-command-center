/**
 * Button Component
 *
 * Primary interaction element. Variants and sizes are declared once with CVA.
 * `brand` is the main action of a screen (the user's accent); `asChild` renders
 * the single child (a link, say) with the button's look instead of nesting an
 * interactive element inside a button.
 *
 * @example
 * ```tsx
 * <Button variant="brand" size="touch" onClick={save}>Guardar</Button>
 * <Button variant="outline" asChild><a href="/login">Volver</a></Button>
 * ```
 */

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-sm font-medium tracking-normal select-none transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
	{
		variants: {
			variant: {
				default:
					"bg-[var(--color-surface-3)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-4)]",
				primary:
					"bg-[var(--color-primary)] text-brand-foreground border border-transparent hover:bg-[var(--color-primary-hover)]",
				brand:
					"bg-brand text-brand-foreground border border-transparent hover:bg-brand/90",
				secondary:
					"bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] hover:bg-[var(--color-surface-3)] hover:border-[var(--color-border)]",
				ghost:
					"bg-transparent text-[var(--color-text-secondary)] border border-transparent hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]",
				danger:
					"bg-[var(--color-danger)] text-destructive-foreground border border-transparent shadow-[var(--shadow-danger)] hover:bg-[var(--color-danger-hover)]",
				outline:
					"bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-border-strong)]",
			},
			size: {
				sm: "h-8 px-3 text-xs",
				md: "h-10 px-4",
				/** 44px: the minimum comfortable touch target. */
				touch: "h-11 px-4",
				lg: "h-12 px-6 text-base",
				icon: "h-10 w-10 p-0",
			},
		},
		defaultVariants: { variant: "default", size: "md" },
	},
);

/** Button visual variants */
export type ButtonVariant = NonNullable<
	VariantProps<typeof buttonVariants>["variant"]
>;

/** Button size options */
export type ButtonSize = NonNullable<
	VariantProps<typeof buttonVariants>["size"]
>;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	/** Visual style variant */
	variant?: ButtonVariant;
	/** Size of the button */
	size?: ButtonSize;
	/** Render the child element with the button's look. */
	asChild?: boolean;
	/** Button content */
	children?: ReactNode;
}

export function Button({
	variant,
	size,
	asChild = false,
	className,
	children,
	...props
}: ButtonProps) {
	const Comp = asChild ? Slot : "button";
	return (
		<Comp
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		>
			{children}
		</Comp>
	);
}

export { buttonVariants };
