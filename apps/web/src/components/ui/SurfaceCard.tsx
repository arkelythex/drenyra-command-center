/**
 * SurfaceCard
 *
 * Unified section surface with semantic variants and optional interactivity.
 */

import { type HTMLAttributes, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SurfaceCardProps {
	variant?:
		| "default"
		| "muted"
		| "interactive"
		| "danger"
		| "warning"
		| "success";
	padding?: "none" | "sm" | "md" | "lg" | "xl";
	className?: string;
	children: ReactNode;
	/** Para variant interactive, on hover */
	onClick?: () => void;
	onKeyDown?: (e: KeyboardEvent) => void;
	role?: string;
	"aria-label"?: string;
}

const variantClasses: Record<
	NonNullable<SurfaceCardProps["variant"]>,
	string
> = {
	default:
		"border border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-primary)]",
	muted:
		"border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-primary)]",
	interactive:
		"border border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-primary)] cursor-pointer transition-colors hover:bg-[var(--surface-2)]",
	danger:
		"border border-[var(--danger)]/35 bg-[var(--danger)]/10 text-[var(--text-primary)]",
	warning:
		"border border-[var(--warning)]/35 bg-[var(--warning)]/10 text-[var(--text-primary)]",
	success:
		"border border-[var(--success)]/35 bg-[var(--success)]/10 text-[var(--text-primary)]",
};

const paddingClasses: Record<
	NonNullable<SurfaceCardProps["padding"]>,
	string
> = {
	none: "p-0",
	sm: "p-3",
	md: "p-4",
	lg: "p-6",
	xl: "p-8",
};

export function SurfaceCard({
	variant = "default",
	padding = "md",
	className,
	children,
	onClick,
	onKeyDown,
	role,
	"aria-label": ariaLabel,
}: SurfaceCardProps) {
	const isInteractive = Boolean(onClick);

	const handleKeyDown: HTMLAttributes<HTMLDivElement>["onKeyDown"] = (
		event,
	) => {
		if (isInteractive && (event.key === "Enter" || event.key === " ")) {
			event.preventDefault();
			onClick?.();
		}
		onKeyDown?.(event);
	};

	return (
		<div
			className={cn(
				"rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--info)]/40 focus-visible:ring-offset-2",
				variantClasses[variant],
				paddingClasses[padding],
				className,
			)}
			onClick={onClick}
			onKeyDown={handleKeyDown}
			role={isInteractive ? (role ?? "button") : role}
			tabIndex={isInteractive ? 0 : undefined}
			aria-label={ariaLabel}
		>
			{children}
		</div>
	);
}
