/**
 * PageShell
 *
 * Consistent page wrapper for width, spacing, background and scrolling behavior.
 */

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageShellProps {
	variant?: "default" | "narrow" | "board" | "fullHeight";
	padding?: "none" | "sm" | "md" | "lg";
	className?: string;
	children: ReactNode;
	/** HTML element: main (default) or div */
	as?: "main" | "div";
}

const variantClasses: Record<NonNullable<PageShellProps["variant"]>, string> = {
	default: "mx-auto w-full max-w-7xl overflow-y-auto",
	narrow: "mx-auto w-full max-w-3xl overflow-y-auto",
	board: "w-full overflow-auto",
	fullHeight: "h-full w-full overflow-hidden",
};

const paddingClasses: Record<NonNullable<PageShellProps["padding"]>, string> = {
	none: "p-0",
	sm: "px-3 py-3 sm:px-4 sm:py-4",
	md: "px-4 py-4 sm:px-6 sm:py-6",
	lg: "px-5 py-5 sm:px-8 sm:py-8",
};

export function PageShell({
	variant = "default",
	padding = "md",
	className,
	children,
	as = "main",
}: PageShellProps) {
	const Component = as;

	return (
		<Component
			className={cn(
				"bg-[var(--surface-1)]",
				"flex min-h-0 flex-col gap-6",
				variantClasses[variant],
				paddingClasses[padding],
				className,
			)}
		>
			{children}
		</Component>
	);
}
