import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { CognitiveActivityEntry } from "../../hooks/cognitive-stream";
import { useAccountingJobRuns } from "../../hooks/useAccountingJobRuns";
import { TimelineControlPlane } from "./components/TimelineControlPlane";
import { TimelineEntry } from "./components/TimelineEntry";
import {
	getStatusStyles,
	mapAccountingJobRunToActivity,
} from "./ToolExecutionTimeline.data";
import type { ToolExecutionTimelineProps } from "./ToolExecutionTimeline.types";

export function ToolExecutionTimeline({
	entries,
	activeRunId,
	onClear,
}: ToolExecutionTimelineProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const shouldHydrateControlPlane = isExpanded || activeRunId !== null;
	const { runs } = useAccountingJobRuns(6, {
		includeControlPlane: shouldHydrateControlPlane,
	});
	const byId = new Map<string, CognitiveActivityEntry>();

	for (const entry of entries) {
		byId.set(entry.id, entry);
	}

	for (const run of runs) {
		const mapped = mapAccountingJobRunToActivity(run);
		byId.set(mapped.id, mapped);
	}

	const mergedEntries = Array.from(byId.values()).sort(
		(left, right) =>
			new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
	);
	const visibleEntries = mergedEntries
		.filter((entry) => !activeRunId || entry.runId === activeRunId)
		.slice(-5)
		.reverse();
	const attentionEntries = visibleEntries.filter(
		(entry) =>
			entry.status === "warning" ||
			entry.status === "error" ||
			entry.status === "pending",
	);
	const successEntries = visibleEntries.filter(
		(entry) => entry.status === "success",
	);
	const infoEntries = visibleEntries.filter((entry) => entry.status === "info");
	const hasAttentionItems = attentionEntries.length > 0;
	const focusedRun =
		runs.find((run) => run.id === activeRunId) ??
		runs.find((run) => run.controlPlane?.representativePath);

	useEffect(() => {
		if (hasAttentionItems) setIsExpanded(true);
		if (activeRunId) setIsExpanded(true);
	}, [activeRunId, hasAttentionItems]);

	if (visibleEntries.length === 0) return null;

	return (
		<div
			className={cn(
				"mb-3 max-h-[min(220px,28vh)] overflow-y-auto rounded-2xl border p-3 transition-[background-color,border-color,box-shadow,opacity] duration-150",
				hasAttentionItems
					? "border-warning/20 bg-warning/8"
					: "border-[var(--border-subtle)] bg-[var(--surface-1)]",
			)}
		>
			<div className="mb-2 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<p className="text-label font-medium text-foreground">
						Ejecución reciente
					</p>
					<span
						className={cn(
							"rounded-full border px-2 py-0.5 text-2xs font-medium",
							hasAttentionItems
								? "border-warning/20 bg-warning/10 text-warning"
								: "border-[var(--color-success)]/20 bg-[var(--color-success)]/10 text-[var(--color-success)]",
						)}
					>
						{hasAttentionItems
							? `${attentionEntries.length} requieren revisión`
							: "Sin pendientes"}
					</span>
				</div>
				<div className="flex items-center gap-3">
					{activeRunId && isExpanded ? (
						<span className="text-3xs font-mono text-muted-foreground">
							run {activeRunId.slice(0, 8)}
						</span>
					) : null}
					{runs.length > 0 ? (
						<span className="rounded-full border border-border/30 px-2 py-1 text-3xs font-medium text-muted-foreground">
							{runs.length} jobs
						</span>
					) : null}
					<button
						type="button"
						onClick={() => setIsExpanded((prev) => !prev)}
						className="rounded-full border border-border/30 px-2 py-1 text-2xs font-medium text-muted-foreground transition-[border-color,color,background-color] duration-150 hover:border-border/50 hover:text-foreground"
					>
						{isExpanded ? "Ocultar" : "Ver detalle"}
					</button>
					{onClear ? (
						<button
							type="button"
							onClick={onClear}
							className="rounded-full border border-border/30 px-2 py-1 text-2xs font-medium text-muted-foreground transition-[border-color,color,background-color] duration-150 hover:border-border/50 hover:text-foreground"
						>
							Limpiar
						</button>
					) : null}
				</div>
			</div>

			{!isExpanded ? (
				<p className="text-xs text-muted-foreground">
					{hasAttentionItems
						? "Hay eventos con intervención humana pendiente."
						: `Última ejecución estable · ${successEntries.length} acciones completadas`}
				</p>
			) : (
				<div className="space-y-2">
					{visibleEntries.map((entry) => (
						<TimelineEntry key={entry.id} entry={entry} />
					))}
					{!hasAttentionItems &&
					(successEntries.length > 0 || infoEntries.length > 0) ? (
						<p className="pt-1 text-2xs text-muted-foreground">
							Se muestran eventos recientes para trazabilidad operativa.
						</p>
					) : null}
					{focusedRun?.controlPlane ? (
						<TimelineControlPlane controlPlane={focusedRun.controlPlane} />
					) : null}
				</div>
			)}
		</div>
	);
}
