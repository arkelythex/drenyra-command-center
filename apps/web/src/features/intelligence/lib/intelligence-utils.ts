import type { AnomalySeverity } from "@drenyra/drenyra-orchestrator";
import type {
	AnomalyDisplayItem,
	ComplianceDisplayItem,
	DashboardMetric,
} from "../types/intelligence.types";

/** Format a number as PEN currency */
export function formatPEN(value: number): string {
	return new Intl.NumberFormat("es-PE", {
		style: "currency",
		currency: "PEN",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
}

/** Format a number as a percentage */
export function formatPct(value: number): string {
	return `${value.toFixed(1)}%`;
}

/** Format a confidence score */
export function formatConfidence(value: number): string {
	return `${Math.round(value * 100)}%`;
}

/** Format a date for display */
export function formatDisplayDate(dateStr: string): string {
	try {
		return new Date(dateStr).toLocaleDateString("es-PE", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	} catch {
		return dateStr;
	}
}

/** Format ISO date to relative time like "3 days ago" */
export function formatRelativeTime(dateStr: string): string {
	const now = new Date();
	const date = new Date(dateStr);
	const diffMs = now.getTime() - date.getTime();
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays < 0) return `en ${Math.abs(diffDays)} días`;
	if (diffDays === 0) return "hoy";
	if (diffDays === 1) return "ayer";
	if (diffDays < 7) return `hace ${diffDays} días`;
	if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semanas`;
	return `hace ${Math.floor(diffDays / 30)} meses`;
}

/** Get the display label for a severity level */
export function getSeverityLabel(severity: AnomalySeverity): string {
	const labels: Record<AnomalySeverity, string> = {
		low: "Bajo",
		medium: "Medio",
		high: "Alto",
		critical: "Crítico",
	};
	return labels[severity] ?? severity;
}

/** Get severity level as a numeric score for sorting */
export function getSeverityScore(severity: AnomalySeverity): number {
	const scores: Record<AnomalySeverity, number> = {
		low: 0,
		medium: 1,
		high: 2,
		critical: 3,
	};
	return scores[severity] ?? 0;
}

/** Sort anomalies by severity (critical first), then by date (newest first) */
export function sortAnomaliesBySeverity(
	items: AnomalyDisplayItem[],
): AnomalyDisplayItem[] {
	return [...items].sort((a, b) => {
		const severityDiff =
			getSeverityScore(b.severity) - getSeverityScore(a.severity);
		if (severityDiff !== 0) return severityDiff;
		return new Date(b.date).getTime() - new Date(a.date).getTime();
	});
}

/** Sort compliance items — overdue first, then by due date ascending */
export function sortComplianceByUrgency(
	items: ComplianceDisplayItem[],
): ComplianceDisplayItem[] {
	return [...items].sort((a, b) => {
		const urgencyOrder = { overdue: 0, pending: 1, filed: 2, exempt: 3 };
		const aOrder = urgencyOrder[a.status] ?? 4;
		const bOrder = urgencyOrder[b.status] ?? 4;
		if (aOrder !== bOrder) return aOrder - bOrder;
		return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
	});
}

/** Calculate metric trends from anomaly data */
export function calculateMetrics(
	anomalies: AnomalyDisplayItem[],
): DashboardMetric[] {
	const criticalCount = anomalies.filter(
		(a) => a.severity === "critical" || a.severity === "high",
	).length;
	const mediumCount = anomalies.filter((a) => a.severity === "medium").length;

	return [
		{
			id: "critical-anomalies",
			label: "Anomalías Críticas",
			value: criticalCount,
			icon: "AlertTriangle",
			color: criticalCount > 0 ? "danger" : "success",
			trend: criticalCount > 0 ? "up" : "neutral",
		},
		{
			id: "medium-anomalies",
			label: "Anomalías Medias",
			value: mediumCount,
			icon: "AlertCircle",
			color: mediumCount > 0 ? "warning" : "success",
			trend: neutralUp(mediumCount),
		},
		{
			id: "total-anomalies",
			label: "Total Anomalías",
			value: anomalies.length,
			icon: "ListChecks",
			color:
				anomalies.length > 10
					? "danger"
					: anomalies.length > 0
						? "warning"
						: "success",
			trend: neutralUp(anomalies.length),
		},
	];
}

function neutralUp(value: number): "up" | "neutral" {
	return value > 0 ? "up" : "neutral";
}
