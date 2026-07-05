/**
 * Context card components extracted from RightPanel.
 *
 * Reusable cards for displaying context summaries, diff changes,
 * report metrics, and label-value pairs.
 */

import { cn } from "@/lib/utils";

// ─── Label-value pair ─────────────────────────────────────────────────────────

export function LabelValue({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between">
			<span className="text-xs text-[var(--text-muted)]">{label}</span>
			{children}
		</div>
	);
}

// ─── Context summary card ─────────────────────────────────────────────────────

export function ContextSummaryCard({
	label,
	value,
	trend,
	isCompact,
}: {
	label: string;
	value: string;
	trend?: "up" | "down" | "neutral";
	isCompact?: boolean;
}) {
	return (
		<div
			className={cn(
				"rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3",
				isCompact && "p-2",
			)}
		>
			<p className="text-3xs text-[var(--text-muted)]">{label}</p>
			<p
				className={cn(
					"mt-1 font-mono text-sm font-semibold tabular-nums text-[var(--text-primary)]",
					isCompact && "text-xs",
					trend === "up" && "text-[var(--color-success)]",
					trend === "down" && "text-[var(--color-danger)]",
				)}
			>
				{value}
			</p>
		</div>
	);
}

// ─── Diff context card ────────────────────────────────────────────────────────

export function DiffContextCard({
	title,
	changes,
}: {
	title: string;
	changes: Array<{ field: string; before: string; after: string }>;
}) {
	return (
		<div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
			<h4 className="mb-2 text-xs font-medium text-[var(--text-primary)]">
				{title}
			</h4>
			<div className="space-y-1.5">
				{changes.map((c, i) => (
					<div key={i} className="grid grid-cols-[1fr_auto_1fr] gap-2 text-3xs">
						<span className="text-[var(--text-muted)] truncate">{c.field}</span>
						<span className="text-[var(--color-danger)] line-through">
							{c.before}
						</span>
						<span className="text-[var(--color-success)]">{c.after}</span>
					</div>
				))}
			</div>
		</div>
	);
}

// ─── Report context card ──────────────────────────────────────────────────────

export function ReportContextCard({
	title,
	metrics,
}: {
	title: string;
	metrics: Array<{
		label: string;
		value: string;
		trend?: "up" | "down" | "neutral";
	}>;
}) {
	return (
		<div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
			<h4 className="mb-2 text-xs font-medium text-[var(--text-primary)]">
				{title}
			</h4>
			<div className="grid grid-cols-2 gap-2">
				{metrics.map((m, i) => (
					<ContextSummaryCard
						key={i}
						label={m.label}
						value={m.value}
						trend={m.trend}
						isCompact
					/>
				))}
			</div>
		</div>
	);
}

// ─── Legacy constants (kept for backward compat) ──────────────────────────────

export const LABEL_VALUE_CLASS = "flex items-center justify-between";
export const LABEL_TEXT_CLASS = "text-xs text-[var(--text-muted)]";
