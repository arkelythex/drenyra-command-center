import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
	children?: ReactNode;
	variant?: "default" | "bordered" | "glass";
}

export function Panel({
	className,
	children,
	variant = "default",
	...props
}: PanelProps) {
	const variantStyle = {
		default: "border border-[var(--color-border)] bg-[var(--color-surface-1)]",
		bordered:
			"border-2 border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]",
		glass:
			"border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]/80 backdrop-blur-sm",
	}[variant];

	return (
		<div
			className={cn(
				"rounded-[var(--radius-xl)] p-[var(--n-pad-lg)]",
				variantStyle,
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}

export function PanelHeader({
	className,
	children,
	...props
}: {
	className?: string;
	children?: ReactNode;
}) {
	return (
		<div
			className={cn(
				"mb-[var(--n-gap-md)] flex items-center justify-between",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}
