/**
 * PercentileBars — inline SVG horizontal bar chart for latency percentiles.
 */

"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import type { LatencySummary } from "../../types";
import { formatMs } from "./helpers";

function PercentileBars({ summary }: { summary: LatencySummary }) {
	const bars = useMemo(() => {
		const items = [
			{
				label: "Avg",
				key: "avgLatencyMs" as const,
				color: "var(--color-info, #3b82f6)",
				value: summary.avgLatencyMs,
			},
			{
				label: "P50",
				key: "p50LatencyMs" as const,
				color: "var(--color-success, #22c55e)",
				value: summary.p50LatencyMs,
			},
			{
				label: "P95",
				key: "p95LatencyMs" as const,
				color: "var(--color-warning, #f59e0b)",
				value: summary.p95LatencyMs,
			},
			{
				label: "P99",
				key: "p99LatencyMs" as const,
				color: "var(--color-danger, #ef4444)",
				value: summary.p99LatencyMs,
			},
		];
		const maxVal = Math.max(...items.map((i) => i.value), 1);
		return items.map((item) => ({
			...item,
			pct: (item.value / maxVal) * 100,
			display: formatMs(item.value),
		}));
	}, [summary]);

	return (
		<div className="space-y-3">
			{bars.map((bar) => (
				<div key={bar.key} className="flex items-center gap-3">
					<span className="w-8 text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
						{bar.label}
					</span>
					<div className="flex-1 h-5 rounded-md bg-[var(--surface-3)] overflow-hidden">
						<motion.div
							className="h-full rounded-md"
							style={{ backgroundColor: bar.color }}
							initial={{ width: 0 }}
							animate={{ width: `${bar.pct}%` }}
							transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
						/>
					</div>
					<span className="w-20 text-right font-mono text-xs font-semibold tabular-nums text-[var(--text-primary)]">
						{bar.display}
					</span>
				</div>
			))}
		</div>
	);
}

export { PercentileBars };
