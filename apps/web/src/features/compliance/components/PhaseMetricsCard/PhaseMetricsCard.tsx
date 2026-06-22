/**
 * PhaseMetricsCard — Displays Phase 1 (reliability) or Phase 2 (copilot) metrics.
 *
 * @example
 * ```tsx
 * <PhaseMetricsCard
 *   title="Phase 1 · Reliability"
 *   score={91.2}
 *   icon={ShieldCheck}
 *   details={["SUNAT COMPLIANT", "2 open issues", "100% reproducibility"]}
 * />
 * ```
 */

import type { LucideIcon } from "lucide-react";

interface PhaseMetricsCardProps {
	/** Display title for the section (e.g., "Phase 1 · Reliability") */
	title: string;
	/** Score as a percentage number (e.g., 91.2) */
	score: number;
	/** Lucide icon component to render */
	icon: LucideIcon;
	/** Subtitle/objective description */
	subtitle: string;
	/** Bullet-point detail lines rendered below the score */
	details: string[];
}

export function PhaseMetricsCard({
	title,
	score,
	icon: Icon,
	subtitle,
	details,
}: PhaseMetricsCardProps) {
	return (
		<section className="space-y-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/70 p-4">
			<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
				<Icon className="h-4 w-4" />
				{title}
			</div>
			<p className="font-mono text-3xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
				{score.toFixed(1)}%
			</p>
			<p className="text-sm text-[var(--text-secondary)]">{subtitle}</p>
			<ul className="space-y-1">
				{details.map((detail, i) => (
					<li key={i} className="text-sm text-[var(--text-secondary)]">
						{detail}
					</li>
				))}
			</ul>
		</section>
	);
}
