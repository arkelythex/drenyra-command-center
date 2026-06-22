import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { DashboardMetric } from "../../types/intelligence.types";

const COLOR_STYLES: Record<
	string,
	{ bg: string; icon: string; text: string; border: string }
> = {
	primary: {
		bg: "bg-[var(--color-primary)]/10",
		icon: "text-[var(--color-primary)]",
		text: "text-[var(--text-primary)]",
		border: "border-[var(--color-primary)]/20",
	},
	success: {
		bg: "bg-[var(--color-success)]/10",
		icon: "text-[var(--color-success)]",
		text: "text-[var(--color-success)]",
		border: "border-[var(--color-success)]/20",
	},
	warning: {
		bg: "bg-[var(--color-warning)]/10",
		icon: "text-[var(--color-warning)]",
		text: "text-[var(--color-warning)]",
		border: "border-[var(--color-warning)]/20",
	},
	danger: {
		bg: "bg-[var(--color-danger)]/10",
		icon: "text-[var(--color-danger)]",
		text: "text-[var(--color-danger)]",
		border: "border-[var(--color-danger)]/20",
	},
	info: {
		bg: "bg-[var(--color-info)]/10",
		icon: "text-[var(--color-info)]",
		text: "text-[var(--color-info)]",
		border: "border-[var(--color-info)]/20",
	},
};

export function MetricCard({ metric }: { metric: DashboardMetric }) {
	const style = COLOR_STYLES[metric.color] ?? COLOR_STYLES.primary;

	return (
		<div
			className={`rounded-xl border ${style.border} ${style.bg}/60 backdrop-blur-sm p-5 transition-all hover:shadow-sm`}
		>
			<div className="flex items-start justify-between">
				<div className="space-y-1">
					<p className="text-xs font-medium text-[var(--text-secondary)] tracking-wide uppercase">
						{metric.label}
					</p>
					<p className="n font-black tracking-tight text-foreground leading-none">
						{typeof metric.value === "number"
							? metric.value.toLocaleString()
							: metric.value}
					</p>
					{metric.trendValue && (
						<p
							className={`text-xs font-medium ${metric.trend === "up" ? "text-[var(--color-danger)]" : metric.trend === "down" ? "text-[var(--color-success)]" : "text-[var(--text-muted)]"}`}
						>
							{metric.trendValue}
						</p>
					)}
				</div>
				<div
					className={`flex items-center justify-center w-10 h-10 rounded-lg ${style.bg}`}
				>
					{metric.trend === "up" ? (
						<TrendingUp className={`w-5 h-5 ${style.icon}`} />
					) : metric.trend === "down" ? (
						<TrendingDown className={`w-5 h-5 ${style.icon}`} />
					) : (
						<Minus className={`w-5 h-5 ${style.icon}`} />
					)}
				</div>
			</div>
		</div>
	);
}

export function MetricCardSkeleton() {
	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/40 p-5 animate-pulse">
			<div className="flex items-start justify-between">
				<div className="space-y-2">
					<div className="h-3 w-20 bg-[var(--surface-2)] rounded" />
					<div className="h-7 w-28 bg-[var(--surface-2)] rounded" />
				</div>
				<div className="w-10 h-10 rounded-lg bg-[var(--surface-2)]" />
			</div>
		</div>
	);
}
