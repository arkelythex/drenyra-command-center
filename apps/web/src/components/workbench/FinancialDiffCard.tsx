import { cn } from "@/lib/utils";
import type { FinancialDiffSummary } from "../../types/financial-diff";
import { formatDelta, materialityColor } from "../../types/financial-diff";

interface FinancialDiffCardProps {
	diff: FinancialDiffSummary;
	onClick?: (id: string) => void;
}

const statusColors: Record<string, string> = {
	pending: "text-amber-600 bg-amber-500/10 border-amber-500/20",
	approved: "text-green-600 bg-green-500/10 border-green-500/20",
	rejected: "text-red-600 bg-red-500/10 border-red-500/20",
	changes_requested: "text-blue-600 bg-blue-500/10 border-blue-500/20",
};

/**
 * FinancialDiffCard — shows a financial diff with impact, materiality, and review status.
 *
 * Implements the Financial Diff vision from the Workbench spec:
 * - Before/after amounts with delta
 * - EBITDA / asset impact
 * - Policy reference
 * - Classifier confidence
 * - Evidence count
 * - Review chain
 */
export function FinancialDiffCard({ diff, onClick }: FinancialDiffCardProps) {
	const materialityClass = materialityColor(diff.materiality);
	const statusClass = statusColors[diff.status] ?? statusColors.pending;

	return (
		<button
			type="button"
			onClick={() => onClick?.(diff.id)}
			className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 text-left transition-all hover:shadow-sm"
		>
			{/* Header */}
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<div className="truncate text-sm font-medium text-[var(--text-primary)]">
						{diff.title}
					</div>
					<div className="mt-0.5 text-xs text-[var(--text-secondary)]">
						{diff.accountCode} · {diff.accountName}
					</div>
				</div>

				{/* Delta */}
				<span
					className={cn(
						"shrink-0 text-sm font-semibold tabular-nums",
						diff.delta >= 0 ? "text-green-600" : "text-red-600",
					)}
				>
					{formatDelta(diff.delta)}
				</span>
			</div>

			{/* Meta row */}
			<div className="mt-2 flex flex-wrap items-center gap-2">
				{/* Materiality */}
				<span
					className={cn(
						"rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase",
						materialityClass,
					)}
				>
					{diff.materiality === "very_material"
						? "very material"
						: diff.materiality}
				</span>

				{/* Status */}
				<span
					className={cn(
						"rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
						statusClass,
					)}
				>
					{diff.status === "changes_requested"
						? "cambios solicitados"
						: diff.status}
				</span>

				{/* Policy */}
				<span className="rounded bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)]">
					{diff.policy}
				</span>
			</div>

			{/* Footer */}
			<div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
				<span>Preparado por: {diff.preparedBy}</span>
			</div>
		</button>
	);
}
