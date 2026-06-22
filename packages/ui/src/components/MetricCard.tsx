import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

export type MetricCardTone =
	| "default"
	| "success"
	| "warning"
	| "danger"
	| "info";
export type MetricCardVariant = "default" | "bordered" | "glass";
export type MetricCardTrend = "up" | "down" | "neutral";

export interface MetricCardProps extends HTMLAttributes<HTMLDivElement> {
	icon?: ReactNode;
	label: string;
	value: string;
	tone?: MetricCardTone;
	variant?: MetricCardVariant;
	trend?: MetricCardTrend;
	trendLabel?: string;
	children?: ReactNode;
}

const toneStyles: Record<MetricCardTone, string> = {
	default: "text-[var(--color-text-primary)]",
	success: "text-[var(--color-success)]",
	warning: "text-[var(--color-warning)]",
	danger: "text-[var(--color-danger)]",
	info: "text-[var(--color-info)]",
};

const variantStyles: Record<MetricCardVariant, string> = {
	default: "border border-[var(--color-border)] bg-[var(--color-surface-1)]",
	bordered:
		"border-2 border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]",
	glass:
		"border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]/80 backdrop-blur-sm",
};

const trendIcons: Record<MetricCardTrend, ReactNode> = {
	up: (
		<svg
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M6 10V2M6 2L2 6M6 2L10 6"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	),
	down: (
		<svg
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M6 2v8M6 10l4-4M6 10L2 6"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	),
	neutral: (
		<svg
			width="12"
			height="12"
			viewBox="0 0 12 12"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M2 6h8"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
		</svg>
	),
};

export function MetricCard({
	icon,
	label,
	value,
	tone = "default",
	variant = "default",
	trend,
	trendLabel,
	children,
	className,
	...props
}: MetricCardProps) {
	return (
		<div
			className={cn(
				"rounded-[var(--radius-xl)] p-[var(--n-pad-lg)]",
				variantStyles[variant],
				className,
			)}
			{...props}
		>
			<div className="flex items-start justify-between">
				{icon && (
					<div
						className={cn(
							"flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface-3)]",
							toneStyles[tone],
						)}
					>
						{icon}
					</div>
				)}
				{trend && (
					<span
						className={cn(
							"flex items-center gap-0.5 text-xs font-medium",
							toneStyles[tone],
						)}
					>
						{trendIcons[trend]}
						{trendLabel && <span>{trendLabel}</span>}
					</span>
				)}
			</div>
			<div className="mt-[var(--n-gap-sm)]">
				<p className="font-mono text-2xl font-black tabular-nums tracking-tighter text-[var(--color-text-primary)] leading-none">
					{value}
				</p>
				<p className="mt-1 text-xs text-[var(--color-text-secondary)]">
					{label}
				</p>
			</div>
			{children}
		</div>
	);
}
