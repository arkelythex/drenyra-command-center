import type { AnomalySeverity } from "@arkelythex/drenyra-orchestrator";
import {
	SEVERITY_COLORS,
	SEVERITY_LABELS,
} from "../../lib/intelligence-constants";

export function SeverityBadge({ severity }: { severity: AnomalySeverity }) {
	const colors = SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.low;
	const label = SEVERITY_LABELS[severity] ?? severity;

	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
		>
			<span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
			{label}
		</span>
	);
}

export function ComplianceStatusBadge({ status }: { status: string }) {
	const colors: Record<string, { bg: string; text: string; label: string }> = {
		pending: {
			bg: "bg-[var(--color-warning)]/10",
			text: "text-[var(--color-warning)]",
			label: "Pendiente",
		},
		filed: {
			bg: "bg-[var(--color-success)]/10",
			text: "text-[var(--color-success)]",
			label: "Presentado",
		},
		overdue: {
			bg: "bg-[var(--color-danger)]/10",
			text: "text-[var(--color-danger)]",
			label: "Vencido",
		},
		exempt: {
			bg: "bg-[var(--color-muted)]/10",
			text: "text-[var(--text-muted)]",
			label: "Exonerado",
		},
	};
	const c = colors[status] ?? colors.pending;

	return (
		<span
			className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${c.bg} ${c.text}`}
		>
			{c.label}
		</span>
	);
}

export function ConfidenceBar({ value }: { value: number }) {
	const pct = Math.round(value * 100);
	const color =
		pct >= 80
			? "var(--color-success)"
			: pct >= 50
				? "var(--color-warning)"
				: "var(--color-danger)";

	return (
		<div className="flex items-center gap-2">
			<div className="flex-1 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
				<div
					className="h-full rounded-full transition-all duration-500"
					style={{ width: `${pct}%`, backgroundColor: color }}
				/>
			</div>
			<span className="text-xs font-medium text-[var(--text-secondary)] tabular-nums w-8 text-right">
				{pct}%
			</span>
		</div>
	);
}
