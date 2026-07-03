import { useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { diffDetailQueryOptions } from "./query-options";
import type { DiffDetailDTO } from "./diffs.types";

const DIFF_TYPE_LABELS: Record<string, string> = {
	journalEntry: "Asiento nuevo",
	journalModify: "Modif. asiento",
	taxImpact: "Impacto IGV",
	reconciliation: "Conciliación",
	compliance: "Cumplimiento",
	risk: "Riesgo",
};

const DIFF_STATUS_CONFIG: Record<string, { color: string; label: string }> = {
	pending: { color: "text-[var(--color-warning)]", label: "Pendiente" },
	approved: { color: "text-[var(--color-success)]", label: "Aprobado" },
	rejected: { color: "text-[var(--color-danger)]", label: "Rechazado" },
	info_requested: {
		color: "text-[var(--color-warning)]",
		label: "Info requerida",
	},
};

export function AccountingDiffView() {
	const { id } = useSearch({ from: "/diffs/" as never }) as { id?: string };

	const { data, isLoading, error } = useQuery(
		diffDetailQueryOptions(id ?? ""),
		{ enabled: !!id },
	);

	if (!id) {
		return (
			<div className="flex h-full items-center justify-center text-sm text-[var(--text-tertiary)]">
				Selecciona un diff de la cola de revisión
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex h-full items-center justify-center text-sm text-[var(--color-danger)]">
				Error al cargar el diff
			</div>
		);
	}

	return <DiffContent diff={data} />;
}

function DiffContent({ diff }: { diff: DiffDetailDTO }) {
	return (
		<div className="flex h-full flex-col overflow-auto p-6">
			{/* Header */}
			<div className="mb-6">
				<div className="mb-2 flex items-center gap-2">
					<span className="rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
						{DIFF_TYPE_LABELS[diff.type] ?? diff.type}
					</span>
					<span className={DIFF_STATUS_CONFIG[diff.status]?.color ?? ""}>
						{DIFF_STATUS_CONFIG[diff.status]?.label ?? diff.status}
					</span>
				</div>
				<h2 className="text-lg font-semibold text-[var(--text-primary)]">
					{diff.title}
				</h2>
			</div>

			{/* Split diff view */}
			<div className="mb-6 grid grid-cols-2 gap-4">
				<div className="rounded-xl border border-[var(--border-subtle)] bg-red-50/30 p-4">
					<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-danger)]">
						Antes
					</h3>
					{diff.changes.map((change, i) => (
						<div
							key={i}
							className="mb-2 rounded-lg bg-white/50 p-2 text-sm text-[var(--text-secondary)] line-through"
						>
							<div className="text-xs text-[var(--text-tertiary)]">
								{change.field}
							</div>
							<div>{String(change.before)}</div>
						</div>
					))}
				</div>
				<div className="rounded-xl border border-[var(--border-subtle)] bg-green-50/30 p-4">
					<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-success)]">
						Después
					</h3>
					{diff.changes.map((change, i) => (
						<div
							key={i}
							className="mb-2 rounded-lg bg-white/50 p-2 text-sm text-[var(--text-primary)]"
						>
							<div className="text-xs text-[var(--text-tertiary)]">
								{change.field}
							</div>
							<div>{String(change.after)}</div>
						</div>
					))}
				</div>
			</div>

			{/* Impact panel */}
			{diff.impact && (
				<div className="mb-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
					<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
						Impacto
					</h3>
					{diff.impact.taxImpact && (
						<div className="mb-2 text-sm">
							<span className="text-[var(--text-secondary)]">
								{diff.impact.taxImpact.concept}:{" "}
							</span>
							<span className="font-medium text-[var(--text-primary)]">
								{diff.impact.taxImpact.currency === "PEN" ? "S/" : "$"}
								{diff.impact.taxImpact.amount.toLocaleString()}
							</span>
						</div>
					)}
					<div className="flex gap-4 text-sm">
						<span className="text-[var(--text-secondary)]">
							Riesgo: {diff.impact.riskScore}%
						</span>
						<span className="text-[var(--text-secondary)]">
							Confianza: {diff.impact.confidence}%
						</span>
					</div>
				</div>
			)}

			{/* Evidence */}
			{diff.evidenceIds.length > 0 && (
				<div className="mb-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
					<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
						Evidencia
					</h3>
					<div className="flex flex-wrap gap-2">
						{diff.evidenceIds.map((id) => (
							<span
								key={id}
								className="rounded-lg bg-[var(--surface-1)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
							>
								{id}
							</span>
						))}
					</div>
				</div>
			)}

			{/* Decisions */}
			{diff.decisions.length > 0 && (
				<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-4">
					<h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
						Decisiones
					</h3>
					{diff.decisions.map((d, i) => (
						<div key={i} className="mb-2 text-sm">
							<span className="font-medium text-[var(--text-primary)]">
								{d.action}
							</span>
							<span className="mx-1 text-[var(--text-tertiary)]">·</span>
							<span className="text-[var(--text-secondary)]">
								{d.reviewerId}
							</span>
							{d.comment && (
								<p className="text-[var(--text-tertiary)]">{d.comment}</p>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
