/**
 * LatencyDashboard — AI agent latency monitoring panel.
 *
 * Sections:
 *  A. Latency Metrics Cards (6 cards + stagger animation)
 *  B. Percentile Bars (inline SVG horizontal bar chart)
 *  C. Agent Breakdown Table (sortable per-agent stats)
 *  D. Trend Chart (inline SVG line chart)
 *  E. Recent Events Feed (auto-refreshing events table)
 */

"use client";

import { motion } from "framer-motion";
import {
	Activity,
	AlertTriangle,
	ArrowDown,
	ArrowUp,
	ChevronDown,
	ChevronUp,
	Clock,
	Gauge,
	RefreshCw,
	TrendingUp,
	Zap,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
	useLatencyRecent,
	useLatencySummary,
	useLatencyTrend,
} from "../hooks/useObservability";
import type {
	LatencyRecentEvent,
	LatencySummary,
	LatencyTrendItem,
} from "../types";

// ─── Constants ───────────────────────────────────────────────────────────────

const TREND_CHART_HEIGHT = 220;
const TREND_CHART_PADDING = { top: 16, right: 16, bottom: 32, left: 48 };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
	if (ms < 1) return `${Math.round(ms * 100) / 100} ms`;
	if (ms < 1000) return `${Math.round(ms)} ms`;
	return `${(ms / 1000).toFixed(2)} s`;
}

function timeAgo(date: string): string {
	const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

function formatDate(date: string): string {
	const d = new Date(date);
	return new Intl.DateTimeFormat("es-PE", {
		day: "numeric",
		month: "short",
	}).format(d);
}

function _truncateId(id: string, len = 12): string {
	if (id.length <= len) return id;
	return `${id.slice(0, 8)}…`;
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

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

// ─── Percentile Bars (Inline SVG) ────────────────────────────────────────────

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

// ─── Agent Breakdown Table ───────────────────────────────────────────────────

type SortField = "agentType" | "avgLatencyMs" | "p95LatencyMs" | "callCount";
type SortDir = "asc" | "desc";

function SortHeader({
	sortField,
	sortDir,
	toggleSort,
	field,
	label,
}: {
	sortField: SortField;
	sortDir: SortDir;
	toggleSort: (field: SortField) => void;
	field: SortField;
	label: string;
}) {
	const isActive = sortField === field;
	return (
		<th
			className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors"
			onClick={() => toggleSort(field)}
		>
			<span className="inline-flex items-center gap-1">
				{label}
				{isActive &&
					(sortDir === "asc" ? (
						<ChevronUp className="h-3 w-3" />
					) : (
						<ChevronDown className="h-3 w-3" />
					))}
			</span>
		</th>
	);
}

function AgentTable({ summary }: { summary: LatencySummary }) {
	const [sortField, setSortField] = useState<SortField>("avgLatencyMs");
	const [sortDir, setSortDir] = useState<SortDir>("desc");

	const toggleSort = useCallback(
		(field: SortField) => {
			if (sortField === field) {
				setSortDir((d) => (d === "asc" ? "desc" : "asc"));
			} else {
				setSortField(field);
				setSortDir("desc");
			}
		},
		[sortField],
	);

	const sorted = useMemo(() => {
		const agents = summary.byAgent ?? [];
		return [...agents].sort((a, b) => {
			const aVal = a[sortField];
			const bVal = b[sortField];
			const cmp =
				typeof aVal === "string"
					? (aVal as string).localeCompare(bVal as string)
					: (aVal as number) - (bVal as number);
			return sortDir === "asc" ? cmp : -cmp;
		});
	}, [summary.byAgent, sortField, sortDir]);

	const maxCallCount = useMemo(
		() => Math.max(...(summary.byAgent ?? []).map((a) => a.callCount), 1),
		[summary.byAgent],
	);

	if (sorted.length === 0) {
		return (
			<div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
				<Activity className="h-6 w-6 text-[var(--text-tertiary)]" />
				<p className="text-xs text-[var(--text-secondary)]">
					No agent data available
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full">
				<thead>
					<tr className="border-b border-[var(--border-subtle)]">
						<SortHeader
							sortField={sortField}
							sortDir={sortDir}
							toggleSort={toggleSort}
							field="agentType"
							label="Agent"
						/>
						<SortHeader
							sortField={sortField}
							sortDir={sortDir}
							toggleSort={toggleSort}
							field="avgLatencyMs"
							label="Avg"
						/>
						<SortHeader
							sortField={sortField}
							sortDir={sortDir}
							toggleSort={toggleSort}
							field="p95LatencyMs"
							label="P95"
						/>
						<SortHeader
							sortField={sortField}
							sortDir={sortDir}
							toggleSort={toggleSort}
							field="callCount"
							label="Calls"
						/>
						<th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
							Usage
						</th>
					</tr>
				</thead>
				<tbody>
					{sorted.map((agent) => (
						<motion.tr
							key={agent.agentType}
							layout
							className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--surface-2)]/50"
						>
							<td className="px-4 py-3">
								<span className="text-xs font-medium text-[var(--text-primary)]">
									{agent.agentType}
								</span>
							</td>
							<td className="px-4 py-3">
								<span className="font-mono tabular-nums text-xs text-[var(--text-secondary)]">
									{formatMs(agent.avgLatencyMs)}
								</span>
							</td>
							<td className="px-4 py-3">
								<span className="font-mono tabular-nums text-xs text-[var(--text-secondary)]">
									{formatMs(agent.p95LatencyMs)}
								</span>
							</td>
							<td className="px-4 py-3">
								<span className="font-mono tabular-nums text-xs text-[var(--text-secondary)]">
									{agent.callCount}
								</span>
							</td>
							<td className="px-4 py-3">
								<div className="flex items-center gap-2">
									<div className="h-1.5 w-full max-w-[80px] rounded-full bg-[var(--surface-3)] overflow-hidden">
										<motion.div
											className="h-full rounded-full bg-[var(--color-info)]"
											initial={{ width: 0 }}
											animate={{
												width: `${(agent.callCount / maxCallCount) * 100}%`,
											}}
											transition={{ duration: 0.5, ease: "easeOut" }}
										/>
									</div>
									<span className="font-mono tabular-nums text-2xs text-[var(--text-tertiary)]">
										{maxCallCount > 0
											? Math.round((agent.callCount / maxCallCount) * 100)
											: 0}
										%
									</span>
								</div>
							</td>
						</motion.tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

// ─── Trend Chart (Inline SVG) ────────────────────────────────────────────────

function TrendChart({ data }: { data: LatencyTrendItem[] }) {
	if (!data || data.length === 0) {
		return (
			<div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
				<TrendingUp className="h-8 w-8 text-[var(--text-tertiary)]" />
				<p className="text-xs text-[var(--text-secondary)]">
					No trend data available yet
				</p>
			</div>
		);
	}

	const width = 800; // viewBox width, scales responsively
	const chartW = width - TREND_CHART_PADDING.left - TREND_CHART_PADDING.right;
	const chartH =
		TREND_CHART_HEIGHT - TREND_CHART_PADDING.top - TREND_CHART_PADDING.bottom;

	// Find max value across avg and p95
	const maxVal = Math.max(
		...data.flatMap((d) => [d.avgLatencyMs, d.p95LatencyMs]),
		1,
	);
	// Round up to nice number
	const yMax = Math.ceil(maxVal / 100) * 100 || 100;

	const xScale = (i: number) =>
		TREND_CHART_PADDING.left + (i / Math.max(data.length - 1, 1)) * chartW;
	const yScale = (v: number) =>
		TREND_CHART_PADDING.top + chartH - (v / yMax) * chartH;

	// Generate Y-axis ticks
	const yTicks = 4;
	const yStep = yMax / yTicks;

	// Polylines
	const avgLine = data
		.map((d, i) => `${xScale(i)},${yScale(d.avgLatencyMs)}`)
		.join(" ");
	const p95Line = data
		.map((d, i) => `${xScale(i)},${yScale(d.p95LatencyMs)}`)
		.join(" ");

	// Area under avg (gradient fill)
	const avgArea = `${avgLine} ${xScale(data.length - 1)},${yScale(0)} ${xScale(0)},${yScale(0)}`;

	// P95 area
	const p95Area = `${p95Line} ${xScale(data.length - 1)},${yScale(0)} ${xScale(0)},${yScale(0)}`;

	return (
		<svg
			viewBox={`0 0 ${width} ${TREND_CHART_HEIGHT}`}
			className="w-full h-auto"
			preserveAspectRatio="xMidYMid meet"
			role="img"
			aria-label="Latency trend chart"
		>
			{/* Grid lines */}
			{Array.from({ length: yTicks + 1 }).map((_, i) => {
				const y = yScale(i * yStep);
				return (
					<g key={i}>
						<line
							x1={TREND_CHART_PADDING.left}
							y1={y}
							x2={width - TREND_CHART_PADDING.right}
							y2={y}
							stroke="var(--border-subtle)"
							strokeWidth={1}
						/>
						<text
							x={TREND_CHART_PADDING.left - 6}
							y={y + 3}
							textAnchor="end"
							className="fill-[var(--text-tertiary)]"
							fontSize={10}
							fontFamily="ui-monospace, monospace"
						>
							{formatMs(i * yStep)}
						</text>
					</g>
				);
			})}

			{/* P95 area */}
			<defs>
				<linearGradient id="p95-gradient" x1="0" y1="0" x2="0" y2="1">
					<stop
						offset="0%"
						stopColor="var(--color-warning)"
						stopOpacity={0.2}
					/>
					<stop
						offset="100%"
						stopColor="var(--color-warning)"
						stopOpacity={0.02}
					/>
				</linearGradient>
				<linearGradient id="avg-gradient" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="var(--color-info)" stopOpacity={0.2} />
					<stop
						offset="100%"
						stopColor="var(--color-info)"
						stopOpacity={0.02}
					/>
				</linearGradient>
			</defs>

			<polygon points={p95Area} fill="url(#p95-gradient)" />
			<polygon points={avgArea} fill="url(#avg-gradient)" />

			{/* P95 line */}
			<polyline
				points={p95Line}
				fill="none"
				stroke="var(--color-warning)"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
				className="drop-shadow-sm"
			/>

			{/* Avg line */}
			<polyline
				points={avgLine}
				fill="none"
				stroke="var(--color-info)"
				strokeWidth={2}
				strokeLinecap="round"
				strokeLinejoin="round"
				className="drop-shadow-sm"
			/>

			{/* X-axis labels */}
			{data.map((d, i) => {
				// Show at most ~8 labels
				if (
					data.length > 8 &&
					i % Math.ceil(data.length / 8) !== 0 &&
					i !== data.length - 1
				)
					return null;
				return (
					<text
						key={d.date}
						x={xScale(i)}
						y={TREND_CHART_HEIGHT - 6}
						textAnchor="middle"
						className="fill-[var(--text-tertiary)]"
						fontSize={10}
					>
						{formatDate(d.date)}
					</text>
				);
			})}

			{/* Legend */}
			<g transform={`translate(${width - 120}, 8)`}>
				<rect
					x={0}
					y={0}
					width={10}
					height={10}
					rx={2}
					fill="var(--color-info)"
				/>
				<text
					x={14}
					y={9}
					className="fill-[var(--text-secondary)]"
					fontSize={10}
				>
					Avg
				</text>
				<rect
					x={60}
					y={0}
					width={10}
					height={10}
					rx={2}
					fill="var(--color-warning)"
				/>
				<text
					x={74}
					y={9}
					className="fill-[var(--text-secondary)]"
					fontSize={10}
				>
					P95
				</text>
			</g>
		</svg>
	);
}

// ─── Recent Events Feed ──────────────────────────────────────────────────────

function RecentEventsTable({ events }: { events: LatencyRecentEvent[] }) {
	if (!events || events.length === 0) {
		return (
			<div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
				<Activity className="h-8 w-8 text-[var(--text-tertiary)]" />
				<p className="text-sm text-[var(--text-secondary)]">No recent events</p>
				<p className="text-2xs text-[var(--text-tertiary)]">
					Latency events will appear here as agents process requests.
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto">
			<table className="w-full">
				<thead>
					<tr className="border-b border-[var(--border-subtle)]">
						<th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
							Time
						</th>
						<th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
							Agent
						</th>
						<th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
							Model
						</th>
						<th className="px-4 py-2.5 text-right text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
							Latency
						</th>
						<th className="px-4 py-2.5 text-right text-2xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
							Status
						</th>
					</tr>
				</thead>
				<tbody>
					{events.map((event) => (
						<motion.tr
							key={event.id}
							layout
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--surface-2)]/50"
						>
							<td className="px-4 py-3">
								<span className="font-mono tabular-nums text-xs text-[var(--text-secondary)]">
									{timeAgo(event.createdAt)}
								</span>
							</td>
							<td className="px-4 py-3">
								<span className="text-xs font-medium text-[var(--text-primary)]">
									{event.agentType}
								</span>
							</td>
							<td className="px-4 py-3">
								<span className="font-mono text-2xs text-[var(--text-tertiary)]">
									{event.modelUsed}
								</span>
							</td>
							<td className="px-4 py-3 text-right">
								<span className="font-mono tabular-nums text-xs font-semibold text-[var(--text-primary)]">
									{formatMs(event.latencyMs)}
								</span>
							</td>
							<td className="px-4 py-3 text-right">
								<span
									className={cn(
										"inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider",
										event.status === "success"
											? "border-[var(--color-success)]/25 bg-[var(--color-success)]/10 text-[var(--color-success)]"
											: "border-[var(--color-danger)]/25 bg-[var(--color-danger)]/10 text-[var(--color-danger)]",
									)}
								>
									{event.status}
								</span>
							</td>
						</motion.tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

// ─── Loading State Skeleton ──────────────────────────────────────────────────

function LatencyDashboardSkeleton() {
	return (
		<div className="space-y-6">
			{/* Cards skeleton */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<MetricCardSkeleton key={i} />
				))}
			</div>

			{/* Charts skeleton */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<Card variant="glass" padding="lg" className="lg:col-span-1">
					<CardHeader className="mb-2">
						<Skeleton className="h-4 w-28" />
					</CardHeader>
					<CardContent className="space-y-3 p-0">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="h-5 w-full rounded-md" />
						))}
					</CardContent>
				</Card>
				<Card variant="glass" padding="lg" className="lg:col-span-2">
					<CardHeader className="mb-2">
						<Skeleton className="h-4 w-32" />
					</CardHeader>
					<CardContent className="p-0">
						<Skeleton className="h-[220px] w-full rounded-lg" />
					</CardContent>
				</Card>
			</div>

			{/* Table skeleton */}
			<Card variant="glass" padding="none">
				<CardHeader className="px-4 pt-4 pb-2">
					<Skeleton className="h-4 w-36" />
				</CardHeader>
				<CardContent className="p-0">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton
							key={i}
							className="h-10 w-full rounded-none border-b border-[var(--border-subtle)]"
						/>
					))}
				</CardContent>
			</Card>
		</div>
	);
}

// ─── Error State ─────────────────────────────────────────────────────────────

function LatencyErrorState({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="flex flex-col items-center gap-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-10 text-center">
			<AlertTriangle className="h-8 w-8 text-[var(--color-danger)]" />
			<div>
				<p className="text-sm font-medium text-[var(--color-danger)]">
					Failed to load latency metrics
				</p>
				<p className="mt-1 text-2xs text-[var(--text-tertiary)]">
					Ensure the AI Control Plane API is reachable.
				</p>
			</div>
			<Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
				<RefreshCw className="h-3.5 w-3.5" />
				Retry
			</Button>
		</div>
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

// ─── Main Component ──────────────────────────────────────────────────────────

export function LatencyDashboard() {
	const {
		data: summary,
		isLoading: summaryLoading,
		isError: summaryError,
		refetch: refetchSummary,
	} = useLatencySummary();
	const { data: trend, isLoading: trendLoading } = useLatencyTrend();
	const { data: recentEvents, isLoading: eventsLoading } = useLatencyRecent();

	// Global loading state (summary is the critical data)
	if (summaryLoading) {
		return <LatencyDashboardSkeleton />;
	}

	if (summaryError || !summary) {
		return <LatencyErrorState onRetry={() => refetchSummary()} />;
	}

	return (
		<div className="space-y-6">
			{/* A. Latency Metrics Cards */}
			<section aria-label="Latency Metrics">
				<MetricsCards summary={summary} />
			</section>

			{/* B. Percentile Bars + C. Agent Breakdown */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<section aria-label="Percentile Distribution" className="lg:col-span-1">
					<Card variant="glass" padding="lg" className="h-full">
						<CardHeader className="mb-3">
							<CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
								Percentile Distribution
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<PercentileBars summary={summary} />
						</CardContent>
					</Card>
				</section>

				<section aria-label="Agent Breakdown" className="lg:col-span-2">
					<Card variant="glass" padding="none" className="h-full">
						<CardHeader className="px-4 pt-4 pb-2">
							<CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
								Agent Breakdown
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<AgentTable summary={summary} />
						</CardContent>
					</Card>
				</section>
			</div>

			{/* D. Trend Chart */}
			<section aria-label="Latency Trend">
				<Card variant="glass" padding="lg">
					<CardHeader className="mb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
								Latency Trend (Daily)
							</CardTitle>
							{trendLoading && (
								<span className="text-2xs text-[var(--text-tertiary)]">
									Loading…
								</span>
							)}
						</div>
					</CardHeader>
					<CardContent className="p-0">
						{trend && trend.length > 0 ? (
							<TrendChart data={trend} />
						) : (
							<div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
								<TrendingUp className="h-8 w-8 text-[var(--text-tertiary)]" />
								<p className="text-xs text-[var(--text-secondary)]">
									No trend data available yet
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			</section>

			{/* E. Recent Events Feed */}
			<section aria-label="Recent Events">
				<Card variant="glass" padding="none">
					<CardHeader className="px-4 pt-4 pb-2">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-semibold text-[var(--text-primary)]">
								Recent Events
							</CardTitle>
							{eventsLoading && (
								<span className="text-2xs text-[var(--text-tertiary)]">
									Refreshing…
								</span>
							)}
						</div>
					</CardHeader>
					<CardContent className="p-0">
						<RecentEventsTable events={recentEvents ?? []} />
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
