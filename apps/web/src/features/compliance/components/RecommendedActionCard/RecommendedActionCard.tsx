/**
 * RecommendedActionCard — Renders a single recommended action with appropriate controls.
 *
 * - One-click actions: shows an "Ejecutar" button.
 * - Review-required actions: shows Approve / Reject / Escalate buttons.
 * - Always shows a "Timeline" button to open the trace dialog.
 *
 * Does NOT own dialog state — receives open/close callbacks from parent.
 */

import {
	ArrowUpCircle,
	CheckCircle,
	Clock,
	Loader2,
	PlayCircle,
	XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { confidenceBadgeClasses } from "../shared/confidence";
import type { RoadmapDecisionType, RoadmapMvpAction } from "../shared/types";

interface RecommendedActionCardProps {
	action: RoadmapMvpAction;
	/** IDs of actions currently being executed */
	runningIds: Set<string>;
	/** IDs of actions currently being decided (HITL) */
	decidingIds: Set<string>;
	onRun: (action: RoadmapMvpAction) => void;
	onOpenHitlDialog: (
		action: RoadmapMvpAction,
		decision: RoadmapDecisionType,
	) => void;
	onOpenTimeline: (traceId: string) => void;
}

export function RecommendedActionCard({
	action,
	runningIds,
	decidingIds,
	onRun,
	onOpenHitlDialog,
	onOpenTimeline,
}: RecommendedActionCardProps) {
	const isRunning = runningIds.has(action.id);
	const isDeciding = decidingIds.has(action.id);

	return (
		<article className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/60 p-4 md:flex-row md:items-start md:justify-between">
			{/* Metadata */}
			<div className="min-w-0 space-y-1">
				<p className="text-sm font-semibold text-[var(--text-primary)]">
					{action.title}
				</p>
				<p className="text-sm text-[var(--text-secondary)]">
					{action.description}
				</p>
				<div className="flex flex-wrap items-center gap-2">
					<span className={confidenceBadgeClasses(action.confidence)}>
						{(action.confidence * 100).toFixed(0)}% confianza
					</span>
					<span className="text-xs text-[var(--text-tertiary)]">
						{action.impact}
					</span>
					<span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-1)] px-2 py-0.5 text-label font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
						{action.automationLevel === "one-click" ? "One-click" : "Review"}
					</span>
				</div>
			</div>

			{/* Action buttons */}
			<div className="flex shrink-0 flex-wrap gap-2">
				{action.automationLevel === "one-click" ? (
					<Button
						size="sm"
						variant="primary"
						disabled={isRunning}
						onClick={() => onRun(action)}
					>
						{isRunning ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<PlayCircle className="mr-2 h-4 w-4" />
						)}
						{isRunning ? "Ejecutando..." : "Ejecutar"}
					</Button>
				) : (
					<>
						<Button
							size="sm"
							variant="primary"
							disabled={isDeciding}
							onClick={() => onOpenHitlDialog(action, "APPROVE")}
						>
							<CheckCircle className="mr-1.5 h-3.5 w-3.5" />
							Aprobar
						</Button>
						<Button
							size="sm"
							variant="destructive"
							disabled={isDeciding}
							onClick={() => onOpenHitlDialog(action, "REJECT")}
						>
							<XCircle className="mr-1.5 h-3.5 w-3.5" />
							Rechazar
						</Button>
						<Button
							size="sm"
							variant="outline"
							disabled={isDeciding}
							onClick={() => onOpenHitlDialog(action, "ESCALATE")}
						>
							<ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" />
							Escalar
						</Button>
					</>
				)}

				<Button
					size="sm"
					variant="ghost"
					onClick={() => onOpenTimeline(action.traceId)}
					title="Ver timeline completo"
				>
					<Clock className="mr-1.5 h-3.5 w-3.5" />
					Timeline
				</Button>
			</div>
		</article>
	);
}
