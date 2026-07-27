import {
	CheckCircle,
	FileEdit,
	FilePlus,
	RefreshCw,
	Search,
	XCircle,
	XSquare,
	CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChangeSetSummary } from "../../types/change-set";
import { CHANGE_SET_STATUS_MAP } from "../../types/change-set";

interface ChangeSetCardProps {
	changeSet: ChangeSetSummary;
	onClick?: (id: string) => void;
	compact?: boolean;
}

const iconMap: Record<string, typeof FileEdit> = {
	FileEdit,
	FilePlus,
	Search,
	RefreshCw,
	CheckCircle,
	CheckSquare,
	XCircle,
	XSquare,
};

const colorMap: Record<string, string> = {
	gray: "border-gray-500/20 bg-gray-500/5",
	blue: "border-blue-500/20 bg-blue-500/5",
	purple: "border-purple-500/20 bg-purple-500/5",
	amber: "border-amber-500/20 bg-amber-500/5",
	green: "border-green-500/20 bg-green-500/5",
	emerald: "border-emerald-500/20 bg-emerald-500/5",
	red: "border-red-500/20 bg-red-500/5",
};

const riskColors: Record<string, string> = {
	low: "text-green-600 bg-green-500/10",
	medium: "text-amber-600 bg-amber-500/10",
	high: "text-orange-600 bg-orange-500/10",
	critical: "text-red-600 bg-red-500/10",
};

/**
 * ChangeSetCard — shows a change set with status, risk, and progress.
 *
 * Compact variant for sidebar/pane lists.
 * Full variant for the Change Set detail view.
 */
export function ChangeSetCard({
	changeSet,
	onClick,
	compact = false,
}: ChangeSetCardProps) {
	const statusInfo = CHANGE_SET_STATUS_MAP[changeSet.status];
	const StatusIcon = iconMap[statusInfo.icon] ?? FileEdit;
	const colorClass = colorMap[statusInfo.color] ?? colorMap.gray;
	const riskClass = riskColors[changeSet.risk] ?? riskColors.low;

	const progressPercent =
		changeSet.totalChanges > 0
			? Math.round(
					((changeSet.approvedChanges + changeSet.rejectedChanges) /
						changeSet.totalChanges) *
						100,
				)
			: 0;

	if (compact) {
		return (
			<button
				type="button"
				onClick={() => onClick?.(changeSet.id)}
				className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-[var(--surface-2)]"
			>
				<div
					className={cn(
						"flex h-6 w-6 items-center justify-center rounded-md",
						colorClass,
					)}
				>
					<StatusIcon
						size={12}
						className={cn("text-[var(--text-secondary)]")}
					/>
				</div>
				<div className="min-w-0 flex-1">
					<div className="truncate font-medium text-[var(--text-primary)]">
						{changeSet.label}
					</div>
					<div className="text-[10px] text-[var(--text-muted)]">
						{changeSet.status === "approved" || changeSet.status === "posted"
							? `${changeSet.approvedChanges}/${changeSet.totalChanges} cambios`
							: `${changeSet.totalChanges} cambios`}
					</div>
				</div>
				<span
					className={cn(
						"rounded px-1 py-0.5 text-[9px] font-bold uppercase",
						riskClass,
					)}
				>
					{changeSet.risk}
				</span>
			</button>
		);
	}

	return (
		<button
			type="button"
			onClick={() => onClick?.(changeSet.id)}
			className={cn(
				"w-full rounded-xl border p-4 text-left transition-all hover:shadow-sm",
				colorClass,
			)}
		>
			{/* Header */}
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-2 min-w-0">
					<div
						className={cn(
							"flex h-8 w-8 items-center justify-center rounded-lg",
							colorClass,
						)}
					>
						<StatusIcon size={16} className="text-[var(--text-primary)]" />
					</div>
					<div className="min-w-0">
						<div className="truncate text-sm font-semibold text-[var(--text-primary)]">
							{changeSet.label}
						</div>
						<div className="truncate text-xs text-[var(--text-secondary)]">
							{changeSet.companyName} · {changeSet.period}
						</div>
					</div>
				</div>
				<span
					className={cn(
						"shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
						riskClass,
					)}
				>
					{changeSet.risk}
				</span>
			</div>

			{/* Status badge */}
			<div className="mt-2 flex items-center gap-2">
				<StatusIcon size={12} className="text-[var(--text-muted)]" />
				<span className="text-xs font-medium text-[var(--text-secondary)]">
					{statusInfo.label}
				</span>
				{changeSet.requiresSeniorReview && (
					<span className="rounded bg-purple-500/10 px-1.5 py-0.5 text-[9px] font-medium text-purple-500">
						Requiere senior
					</span>
				)}
			</div>

			{/* Progress bar */}
			<div className="mt-3">
				<div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
					<span>Progreso de revisión</span>
					<span>
						{changeSet.approvedChanges + changeSet.rejectedChanges}/
						{changeSet.totalChanges}
					</span>
				</div>
				<div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
					<div
						className={cn(
							"h-full rounded-full transition-all",
							changeSet.status === "approved" || changeSet.status === "posted"
								? "bg-green-500"
								: changeSet.status === "rejected"
									? "bg-red-500"
									: "bg-blue-500",
						)}
						style={{ width: `${progressPercent}%` }}
					/>
				</div>
			</div>

			{/* Meta */}
			<div className="mt-3 flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
				<span>Impacto: S/ {changeSet.estimatedImpact.toLocaleString()}</span>
				<span>·</span>
				<span>{changeSet.evidenceCount} evidencias</span>
				<span>·</span>
				<span>Confianza: {(changeSet.agentConfidence * 100).toFixed(0)}%</span>
			</div>
		</button>
	);
}
