import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import { formatPEN, formatRelativeTime } from "../../lib/intelligence-utils";
import type { AnomalyDisplayItem } from "../../types/intelligence.types";
import { SeverityBadge } from "../widgets/SeverityBadge";

interface AnomalyWidgetProps {
	items: AnomalyDisplayItem[];
	isLoading: boolean;
}

export function AnomalyWidget({ items, isLoading }: AnomalyWidgetProps) {
	if (isLoading) return <AnomalyWidgetSkeleton />;

	const criticalCount = items.filter(
		(i) => i.severity === "critical" || i.severity === "high",
	).length;
	const hasIssues = items.length > 0;

	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 backdrop-blur-sm p-6">
			<div className="flex items-center justify-between mb-5">
				<div className="flex items-center gap-3">
					<div
						className={`p-2 rounded-lg ${hasIssues ? "bg-[var(--color-danger)]/10" : "bg-[var(--color-success)]/10"}`}
					>
						<AlertTriangle
							className={`w-5 h-5 ${hasIssues ? "text-[var(--color-danger)]" : "text-[var(--color-success)]"}`}
						/>
					</div>
					<div>
						<h3 className="n font-semibold tracking-tight text-foreground">
							Detección de Anomalías
						</h3>
						<p className="text-xs text-[var(--text-secondary)]">
							{hasIssues
								? `${items.length} anomalía${items.length !== 1 ? "s" : ""} detectada${items.length !== 1 ? "s" : ""} (${criticalCount} crítica${criticalCount !== 1 ? "s" : ""})`
								: "Sin anomalías detectadas"}
						</p>
					</div>
				</div>
			</div>

			{hasIssues ? (
				<div className="space-y-2">
					{items.slice(0, 5).map((anomaly) => (
						<AnomalyRow key={anomaly.id} item={anomaly} />
					))}
					{items.length > 5 && (
						<p className="text-xs text-[var(--text-muted)] text-center pt-2">
							+{items.length - 5} anomalías más
						</p>
					)}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-8 text-[var(--text-muted)]">
					<Info className="w-8 h-8 mb-2 opacity-50" />
					<p className="text-sm">
						Todo en orden — no se detectaron anomalías fiscales
					</p>
				</div>
			)}
		</div>
	);
}

function AnomalyRow({ item }: { item: AnomalyDisplayItem }) {
	const amountColor =
		item.severity === "critical" || item.severity === "high"
			? "text-[var(--color-danger)]"
			: "text-[var(--text-primary)]";

	return (
		<div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-2)]/50 hover:bg-[var(--surface-2)] transition-colors">
			<div className="flex items-center gap-3 min-w-0 flex-1">
				{item.severity === "critical" ? (
					<AlertTriangle className="w-4 h-4 text-[var(--color-danger)] shrink-0" />
				) : item.severity === "high" ? (
					<AlertCircle className="w-4 h-4 text-[var(--color-danger)] shrink-0" />
				) : (
					<Info className="w-4 h-4 text-[var(--color-warning)] shrink-0" />
				)}
				<div className="min-w-0">
					<p className="text-sm font-medium text-[var(--text-primary)] truncate">
						{item.description}
					</p>
					<p className="text-xs text-[var(--text-muted)]">
						{item.entity} · {formatRelativeTime(item.date)}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-3 shrink-0 ml-4">
				<span
					className={`font-mono text-sm font-semibold tabular-nums tracking-tight ${amountColor}`}
				>
					{formatPEN(item.amount)}
				</span>
				<SeverityBadge severity={item.severity} />
			</div>
		</div>
	);
}

function AnomalyWidgetSkeleton() {
	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/40 p-6 animate-pulse">
			<div className="flex items-center gap-3 mb-5">
				<div className="w-9 h-9 rounded-lg bg-[var(--surface-2)]" />
				<div className="space-y-1.5">
					<div className="h-4 w-44 bg-[var(--surface-2)] rounded" />
					<div className="h-3 w-28 bg-[var(--surface-2)] rounded" />
				</div>
			</div>
			<div className="space-y-2">
				{[...Array(3)].map((_, i) => (
					<div key={i} className="h-12 bg-[var(--surface-2)]/50 rounded-lg" />
				))}
			</div>
		</div>
	);
}
