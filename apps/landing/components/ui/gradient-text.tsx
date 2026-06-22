import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** @deprecated Use `bright` | `muted` | `inverse` — aliases kept for docs pages */
export type GradientTextVariant =
	| "accent"
	| "primary"
	| "silver"
	| "inverse"
	| "bright"
	| "muted";

export interface GradientTextProps {
	children: ReactNode;
	className?: string;
	as?: ElementType;
	variant?: GradientTextVariant;
}

const GRADIENTS: Record<GradientTextVariant, string> = {
	accent: "from-muted-foreground to-foreground",
	primary: "from-foreground to-muted-foreground",
	silver: "from-foreground/90 via-muted-foreground to-foreground/60",
	inverse: "from-foreground to-foreground/60",
	bright: "from-foreground to-muted-foreground",
	muted: "from-muted-foreground to-foreground/70",
};

/**
 * Grayscale gradient text. RSC-compatible.
 */
export function GradientText<T extends ElementType = "span">({
	children,
	className,
	as,
	variant = "bright",
	...rest
}: GradientTextProps & Omit<ComponentPropsWithoutRef<T>, keyof GradientTextProps>) {
	const Component = as ?? ("span" as T);

	return (
		<Component
			className={cn(
				"bg-gradient-to-r bg-clip-text text-transparent",
				GRADIENTS[variant],
				className,
			)}
			{...rest}
		>
			{children}
		</Component>
	);
}
