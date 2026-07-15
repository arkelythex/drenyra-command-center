/**
 * PageShell
 *
 * Consistent page wrapper for width, spacing, background and scrolling behavior.
 */

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageShellProps {
	/**
	 * Layout variant:
	 * - focal: max-w-3xl centered (inbox, lectura, creación)
	 * - operativo: flex workspace con right rail opcional (cierre, revisión, dashboard)
	 * - data-heavy: full-width con padding (facturas, reportes, expedientes)
	 */
	variant?: "focal" | "operativo" | "data-heavy";
	/** Si true, reserva espacio para right rail de 320px (solo operativo) */
	aside?: boolean;
	padding?: "none" | "sm" | "md" | "lg";
	className?: string;
	children: ReactNode;
	as?: "main" | "div";
}

const variantClasses: Record<NonNullable<PageShellProps["variant"]>, string> = {
	focal: "mx-auto w-full max-w-3xl overflow-y-auto",
	operativo: "flex-1 overflow-auto",
	"data-heavy": "w-full overflow-auto",
};

const paddingClasses: Record<NonNullable<PageShellProps["padding"]>, string> = {
	none: "p-0",
	sm: "px-3 py-3 sm:px-4 sm:py-4",
	md: "px-4 py-4 sm:px-6 sm:py-6",
	lg: "px-5 py-5 sm:px-8 sm:py-8",
};

export function PageShell({
	variant = "data-heavy",
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
