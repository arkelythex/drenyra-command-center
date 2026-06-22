import {
	AlertTriangle,
	CheckCircle2,
	Clock3,
	PlayCircle,
	XCircle,
} from "lucide-react";
import type { CognitiveActivityEntry } from "../../hooks/cognitive-stream";
import type { AccountingJobRunView } from "../../hooks/useAccountingJobRuns";

export function mapAccountingJobRunToActivity(
	run: AccountingJobRunView,
): CognitiveActivityEntry {
	const status =
		run.status === "FAILED"
			? "error"
			: run.status === "AWAITING_APPROVAL"
				? "warning"
				: run.status === "RUNNING" || run.status === "QUEUED"
					? "pending"
					: run.status === "CANCELLED"
						? "warning"
						: "success";

	const label =
		run.status === "AWAITING_APPROVAL"
			? `${run.jobTitle} pendiente`
			: run.status === "RUNNING"
				? `${run.jobTitle} en curso`
				: run.status === "QUEUED"
					? `${run.jobTitle} en cola`
					: run.status === "FAILED"
						? `${run.jobTitle} falló`
						: run.status === "CANCELLED"
							? `${run.jobTitle} cancelado`
							: `${run.jobTitle} completado`;

	return {
		id: `job-run-${run.id}`,
		runId: run.id,
		type: run.status === "COMPLETED" ? "done" : "run_started",
		label,
		detail: run.summary || run.prompt,
		status,
		timestamp: new Date(run.createdAt).toISOString(),
	};
}

export function getStatusStyles(status: CognitiveActivityEntry["status"]): string {
	if (status === "success")
		return "text-success border-success-subtle bg-success-subtle";
	if (status === "warning")
		return "text-warning border-warning-subtle bg-warning-subtle";
	if (status === "error")
		return "text-danger border-danger-subtle bg-danger-subtle";
	if (status === "pending")
		return "text-info border-info-subtle bg-info-subtle";
	return "text-muted-foreground border-[var(--border-subtle)] bg-black/5 dark:bg-white/5";
}

export function getStatusIcon(status: CognitiveActivityEntry["status"]) {
	if (status === "success") return CheckCircle2;
	if (status === "warning") return AlertTriangle;
	if (status === "error") return XCircle;
	if (status === "pending") return Clock3;
	return PlayCircle;
}
