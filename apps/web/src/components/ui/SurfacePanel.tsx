import type React from "react";
import { cn } from "@/lib/utils";

export type SurfacePanelVariant =
	| "default"
	| "muted"
	| "financial"
	| "alert"
	| "elevated"
	| "interactive";

export interface SurfacePanelProps
	extends React.HTMLAttributes<HTMLDivElement> {
	variant?: SurfacePanelVariant;
	padding?: "none" | "sm" | "md" | "lg" | "xl";
}

/**
 * Flat editorial surface, the single card/panel primitive.
 * Fiscal Editorial: hairline border, no decorative blur.
 *
 * `interactive` makes the panel keyboard-operable when `onClick` is given:
 * it exposes `role="button"`, is focusable and activates on Enter/Space.
 */
export function SurfacePanel({
	className,
	variant = "default",
	padding = "md",
	children,
	onClick,
	onKeyDown,
	role,
	...props
}: SurfacePanelProps) {
	const isInteractive = variant === "interactive" && Boolean(onClick);

	const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
		if (isInteractive && (event.key === "Enter" || event.key === " ")) {
			event.preventDefault();
			onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>);
		}
		onKeyDown?.(event);
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: role, tabIndex and key handling are applied only when `interactive` + `onClick`
		<div
			className={cn(
				"rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-card text-foreground shadow-[var(--shadow-1)]",
				padding === "sm" && "p-3",
				padding === "md" && "p-4",
				padding === "lg" && "p-6",
				padding === "xl" && "p-8",
				padding === "none" && "p-0",
				variant === "financial" && "border-t-2 border-t-[var(--accent)]",
				variant === "alert" && "border-l-2 border-l-[var(--danger)]",
				(variant === "elevated" || variant === "muted") && "bg-muted",
				variant === "interactive" &&
					"cursor-pointer transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--info)]/40 focus-visible:ring-offset-2",
				className,
			)}
			onClick={onClick}
			onKeyDown={handleKeyDown}
			role={isInteractive ? (role ?? "button") : role}
			tabIndex={isInteractive ? 0 : undefined}
			{...props}
		>
			{children}
		</div>
	);
}

SurfacePanel.displayName = "SurfacePanel";
