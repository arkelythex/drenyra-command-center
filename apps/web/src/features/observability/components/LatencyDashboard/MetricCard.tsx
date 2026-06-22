/**
 * MetricCard — single metric display + skeleton + metrics cards grid.
 */

"use client";

import { motion } from "framer-motion";
import {
	Activity,
	AlertTriangle,
	ArrowDown,
	ArrowUp,
	Clock,
	Gauge,
	TrendingUp,
	Zap,
} from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { LatencySummary } from "../../types";
import { formatMs } from "./helpers";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MetricCardProps {
	icon: React.FC<{ className?: string }>;
	label: string;
	value: string;
	trend?: "up" | "down" | "neutral";
	trendLabel?: string;
	highlight?: boolean;
	color?: string;
	index: number;
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

function MetricCard({
	icon: Icon,
	label,
	value,
	trend,
	trendLabel,
	highlight,
	color,
	index,
}: MetricCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.06, duration: 0.35, ease: "easeOut" }}
		>
			<Card
				variant="glass"
				padding="md"
				animateOnHover
				className={cn(highlight && "ring-1 ring-[var(--color-warning)]/30")}
			>
				<CardContent className="flex flex-col gap-2 p-0">
					<div className="flex items-center justify-between">
						<Icon
							className={cn("h-5 w-5", color ?? "text-[var(--text-secondary)]")}
						/>
						{trend && (
							<span
								className={cn(
									"inline-flex items-center gap-0.5 text-2xs font-medium",
									trend === "up" && "text-[var(--color-danger)]",
									trend === "down" && "text-[var(--color-success)]",
									trend === "neutral" && "text-[var(--text-tertiary)]",
								)}
							>
								{trend === "up" && <ArrowUp className="h-3 w-3" />}
								{trend === "down" && <ArrowDown className="h-3 w-3" />}
								{trendLabel}
							</span>
						)}
					</div>
					<span className="font-mono text-xl font-semibold tracking-tight tabular-nums text-[var(--text-primary)] leading-none">
						{value}
					</span>
					<span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
						{label}
					</span>
				</CardContent>
			</Card>
		</motion.div>
	);
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function MetricCardSkeleton() {
	return (
		<Card variant="glass" padding="md">
			<CardContent className="flex flex-col gap-2 p-0">
				<Skeleton className="h-5 w-5 rounded-md" />
				<Skeleton className="h-7 w-20 rounded-md" />
				<Skeleton className="h-4 w-24" />
			</CardContent>
		</Card>
	);
}

// ─── Metrics Cards Grid ──────────────────────────────────────────────────────

function MetricsCards({ summary }: { summary: LatencySummary }) {
	const cards: MetricCardProps[] = useMemo(
		() => [
			{
				icon: Gauge,
				label: "Latencia Promedio",
				value: formatMs(summary.avgLatencyMs),
				color: "text-[var(--color-info)]",
				index: 0,
			},
			{
				icon: Zap,
				label: "P50",
				value: formatMs(summary.p50LatencyMs),
				color: "text-[var(--color-success)]",
				index: 1,
			},
			{
				icon: Activity,
				label: "P95",
				value: formatMs(summary.p95LatencyMs),
				color: "text-[var(--color-warning)]",
				index: 2,
			},
			{
				icon: TrendingUp,
				label: "P99",
				value: formatMs(summary.p99LatencyMs),
				color: "text-[var(--color-danger)]",
				index: 3,
			},
			{
				icon: Clock,
				label: "Total Llamadas",
				value: summary.totalCalls.toLocaleString("es-PE"),
				color: "text-[var(--text-primary)]",
				index: 4,
			},
			{
				icon: AlertTriangle,
				label: "Tasa de Error",
				value: `${(summary.errorRate * 100).toFixed(1)}%`,
				color:
					summary.errorRate > 0.05
						? "text-[var(--color-danger)]"
						: "text-[var(--text-secondary)]",
				highlight: summary.errorRate > 0.05,
				index: 5,
			},
		],
		[summary],
	);

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{cards.map((card) => (
				<MetricCard key={card.label} {...card} />
			))}
		</div>
	);
}

export type { MetricCardProps };
export { MetricCard, MetricCardSkeleton, MetricsCards };
