import type React from "react";
import { cn } from "@/lib/utils";

export type SurfacePanelVariant =
	| "default"
	| "financial"
	| "alert"
	| "elevated";

export interface SurfacePanelProps
	extends React.HTMLAttributes<HTMLDivElement> {
	variant?: SurfacePanelVariant;
	padding?: "none" | "sm" | "md" | "lg";
}

/**
 * Flat editorial surface — canonical replacement for GlassCard.
 * Fiscal Editorial: hairline border, no decorative blur.
 */
export function SurfacePanel({
	className,
	variant = "default",
	padding = "md",
	children,
	...props
}: SurfacePanelProps) {
	return (
		<div
			className={cn(
				"rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-primary)] shadow-[var(--shadow-1)]",
				padding === "sm" && "p-3",
				padding === "md" && "p-4",
				padding === "lg" && "p-6",
				padding === "none" && "p-0",
				variant === "financial" && "border-t-2 border-t-[var(--accent)]",
				variant === "alert" && "border-l-2 border-l-[var(--danger)]",
				variant === "elevated" && "bg-[var(--surface-2)]",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

SurfacePanel.displayName = "SurfacePanel";
