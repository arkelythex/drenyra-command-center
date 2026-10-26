/**
 * Badge Component
 *
 * Status label with semantic variants. Variants are declared once with CVA and
 * use theme utilities only (never raw colors or `var(--*)`), so a new theme or
 * accent needs no change here. The label keeps the case it was written in and
 * never wraps: a state must stay readable at a glance.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Cobrada</Badge>
 * <Badge variant="danger">Vencida el 15 oct</Badge>
 * ```
 */

import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";

const badgeVariants = cva(
	"inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
	{
		variants: {
			variant: {
				default: "border-border bg-muted text-foreground",
				secondary: "border-border bg-muted text-muted-foreground",
				outline: "border-border bg-transparent text-muted-foreground",
				soft: "border-transparent bg-muted text-muted-foreground",
				success: "border-success/30 bg-success/10 text-success",
				info: "border-info/30 bg-info/10 text-info",
				warning: "border-warning/30 bg-warning/10 text-warning",
				danger: "border-danger/30 bg-danger/10 text-danger",
				accent: "border-brand/30 bg-brand/10 text-brand",
			},
		},
		defaultVariants: { variant: "default" },
	},
);

export type BadgeVariant = NonNullable<
	VariantProps<typeof badgeVariants>["variant"]
>;

export interface BadgeProps
	extends HTMLAttributes<HTMLSpanElement>,
		VariantProps<typeof badgeVariants> {
	children?: React.ReactNode;
}

export function Badge({ variant, className, children, ...props }: BadgeProps) {
	return (
		<span className={cn(badgeVariants({ variant }), className)} {...props}>
			{children}
		</span>
	);
}
