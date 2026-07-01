import { AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";
import {
	formatDisplayDate,
	formatPEN,
	sortComplianceByUrgency,
} from "../../lib/intelligence-utils";
import type { ComplianceDisplayItem } from "../../types/intelligence.types";
import { ComplianceStatusBadge } from "../widgets/SeverityBadge";

interface ComplianceWidgetProps {
	items: ComplianceDisplayItem[];
	isLoading: boolean;
}

export function ComplianceWidget({ items, isLoading }: ComplianceWidgetProps) {
	if (isLoading) return <ComplianceWidgetSkeleton />;

	const sorted = sortComplianceByUrgency(items);
	const overdueCount = items.filter((i) => i.status === "overdue").length;
	const pendingCount = items.filter((i) => i.status === "pending").length;
	const hasIssues = overdueCount > 0 || pendingCount > 0;

	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80  p-6">
			<div className="flex items-center justify-between mb-5">
				<div className="flex items-center gap-3">
					<div
						className={`p-2 rounded-lg ${hasIssues ? "bg-[var(--color-warning)]/10" : "bg-[var(--color-success)]/10"}`}
					>
						<CalendarClock
							className={`w-5 h-5 ${hasIssues ? "text-[var(--color-warning)]" : "text-[var(--color-success)]"}`}
						/>
					</div>
					<div>
						<h3 className="n font-semibold tracking-tight text-foreground">
							Calendario de Compliance
						</h3>
						<p className="text-xs text-[var(--text-secondary)]">
							{overdueCount > 0
								? `${overdueCount} vencida${overdueCount !== 1 ? "s" : ""} · ${pendingCount} pendiente${pendingCount !== 1 ? "s" : ""}`
								: pendingCount > 0
									? `${pendingCount} obligacion${pendingCount !== 1 ? "es" : ""} pendiente${pendingCount !== 1 ? "s" : ""}`
									: "Todo al día"}
						</p>
					</div>
				</div>
			</div>

			{sorted.length > 0 ? (
				<div className="space-y-2">
					{sorted.slice(0, 5).map((item) => (
						<ComplianceRow key={item.id} item={item} />
					))}
					{sorted.length > 5 && (
						<p className="text-xs text-[var(--text-muted)] text-center pt-2">
							+{sorted.length - 5} obligaciones más
						</p>
					)}
				</div>
			) : (
				<div className="flex flex-col items-center justify-center py-8 text-[var(--text-muted)]">
					<CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
					<p className="text-sm">No hay obligaciones pendientes</p>
				</div>
			)}
		</div>
	);
}

function ComplianceRow({ item }: { item: ComplianceDisplayItem }) {
	const isUrgent =
		item.status === "overdue" ||
		item.severity === "critical" ||
		item.severity === "high";

	return (
		<div
			className={`flex items-center justify-between p-3 rounded-lg ${isUrgent ? "bg-[var(--color-danger)]/5" : "bg-[var(--surface-2)]/50"} hover:bg-[var(--surface-2)] transition-colors`}
		>
			<div className="flex items-center gap-3 min-w-0 flex-1">
				{item.status === "overdue" ? (
					<AlertTriangle className="w-4 h-4 text-[var(--color-danger)] shrink-0" />
				) : item.status === "pending" ? (
					<CalendarClock className="w-4 h-4 text-[var(--color-warning)] shrink-0" />
				) : (
					<CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0" />
				)}
				<div className="min-w-0">
					<p className="text-sm font-medium text-[var(--text-primary)] truncate">
						{item.obligation}
					</p>
					<p className="text-xs text-[var(--text-muted)]">
						Vence: {formatDisplayDate(item.dueDate)}
						{item.legalReference && ` · ${item.legalReference}`}
					</p>
				</div>
			</div>
			<div className="flex items-center gap-3 shrink-0 ml-4">
				{item.amount != null && item.amount > 0 && (
					<span className="font-mono text-xs font-semibold tabular-nums tracking-tight text-[var(--text-primary)]">
						{formatPEN(item.amount)}
					</span>
				)}
				<ComplianceStatusBadge status={item.status} />
			</div>
		</div>
	);
}

function ComplianceWidgetSkeleton() {
	return (
		<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/40 p-6 animate-pulse">
			<div className="flex items-center gap-3 mb-5">
				<div className="w-9 h-9 rounded-lg bg-[var(--surface-2)]" />
				<div className="space-y-1.5">
					<div className="h-4 w-44 bg-[var(--surface-2)] rounded" />
					<div className="h-3 w-32 bg-[var(--surface-2)] rounded" />
				</div>
			</div>
			<div className="space-y-2">
				{[...Array(4)].map((_, i) => (
					<div key={i} className="h-12 bg-[var(--surface-2)]/50 rounded-lg" />
				))}
			</div>
		</div>
	);
}
