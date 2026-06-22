/**
 * MetricCard Molecule - KPI Display Component 2026
 *
 * Displays a key metric with optional trend and AI confidence.
 * Optimized for dashboard widgets and financial summaries.
 *
 * @example
 * ```tsx
 * <MetricCard
 *   label="Revenue"
 *   value="S/ 125,000"
 *   change="+12%"
 *   status="success"
 *   aiConfidence={94}
 * />
 * ```
 */

import { motion } from "framer-motion";
import type * as React from "react";
import { AIConfidenceBar } from "@/components/atoms/ai-indicator";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/atoms/text";
import type { StatusVariant } from "@/lib/design-tokens/semantic-tokens";
import { cn } from "@/lib/utils";

export interface MetricCardProps {
	label: string;
	value: string | number;
	prefix?: string;
	suffix?: string;
	change?: string | number;
	changeLabel?: string;
	status?: StatusVariant;
	trend?: "up" | "down" | "neutral";
	aiConfidence?: number;
	icon?: React.ReactNode;
	sparkline?: React.ReactNode;
	loading?: boolean;
	className?: string;
}

function MetricCard({
	label,
	value,
	prefix,
	suffix,
	change,
	changeLabel,
	status = "neutral",
	trend,
	aiConfidence,
	icon,
	sparkline,
	loading,
	className,
}: MetricCardProps) {
	const trendColor =
		trend === "up"
			? "text-[rgb(var(--premium-success-rgb))]"
			: trend === "down"
				? "text-[rgb(var(--premium-danger-rgb))]"
				: "text-muted";

	return (
		<motion.div
			className={cn(
				"rounded-xl p-5 bg-surface-1 border border-[var(--color-stroke-1)]",
				"hover:border-[var(--color-stroke-2)] hover:shadow-lg transition-[background-color,border-color,box-shadow,transform] duration-200",
				className,
			)}
			initial={{ opacity: 0, scale: 0.98 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.2 }}
		>
			<div className="flex items-start justify-between gap-3 mb-3">
				<div className="flex items-center gap-2">
					{icon && (
						<div className="p-2 rounded-lg bg-surface-2 text-muted">{icon}</div>
					)}
					<Text variant="caption" muted className="uppercase tracking-wide">
						{label}
					</Text>
				</div>

				{status !== "neutral" && (
					<Badge status={status} size="xs" variant="soft" />
				)}
			</div>

			<div className="flex items-baseline gap-1">
				{prefix && (
					<Text variant="h3" className="text-muted">
						{prefix}
					</Text>
				)}

				<Text variant="h2" weight="bold" className="text-primary tabular-nums">
					{loading ? "—" : value}
				</Text>

				{suffix && (
					<Text variant="bodySm" className="text-muted">
						{suffix}
					</Text>
				)}
			</div>

			{(change || aiConfidence !== undefined) && (
				<div className="mt-3 flex items-center justify-between gap-4">
					{change !== undefined && (
						<div className="flex items-center gap-1.5">
							<span className={cn("text-sm font-medium", trendColor)}>
								{trend === "up" && "↑"}
								{trend === "down" && "↓"}
								{trend === "neutral" && "→"}
								{change}
							</span>
							{changeLabel && (
								<Text variant="caption" muted>
									{changeLabel}
								</Text>
							)}
						</div>
					)}

					{aiConfidence !== undefined && (
						<div className="flex-1 max-w-[120px]">
							<AIConfidenceBar score={aiConfidence} showLabel={false} />
						</div>
					)}
				</div>
			)}

			{sparkline && <div className="mt-4 h-12">{sparkline}</div>}
		</motion.div>
	);
}

export { MetricCard };
