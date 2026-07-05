import { GitCompareArrows, ShieldAlert } from "lucide-react";
import { n } from "@/lib/utils";
import type { DiscrepancyScenario } from "../../anomaly/discrepancy-scenario";
import { getScenarioImpact } from "./hub-empty-state.helpers";

interface L1RiskCardProps {
	isOpen: boolean;
	scenario: DiscrepancyScenario | null;
	onReviewDiscrepancy: () => void;
}

export function L1RiskCard({
	isOpen,
	scenario,
	onReviewDiscrepancy,
}: L1RiskCardProps) {
	const impact = getScenarioImpact(scenario);
	const hasScenario = Boolean(scenario);

	return (
		<section className="h-full rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-6 shadow-sm">
			<div className="mb-4">
				<p className="text-sm font-semibold text-[var(--text-primary)]">
					Riesgo detectado
				</p>
				<p className="mt-1 text-xs text-[var(--text-secondary)]">
					{hasScenario
						? "Se detectó una diferencia antes de automatizar cambios."
						: "No hay incidencias críticas en este momento."}
				</p>
			</div>

			<div className="flex flex-col gap-4">
				<div className="space-y-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-danger/20 bg-danger/10 text-danger">
							<ShieldAlert size={18} />
						</div>
						<div>
							<p className="text-label font-semibold uppercase tracking-[0.08em] text-danger">
								{hasScenario
									? "Diferencia de conciliación"
									: "Sin alertas activas"}
							</p>
							<p className="text-sm font-semibold text-[var(--text-primary)]">
								{hasScenario
									? "El sistema detectó una brecha entre la fuente fiscal y el ERP."
									: "El asistente puede seguir monitoreando sin bloquear tareas."}
							</p>
						</div>
					</div>

					<div className="grid max-w-3xl gap-3 sm:grid-cols-3">
						<div className="hub-panel-inset px-4 py-3">
							<p className="text-2xs uppercase tracking-[0.08em] text-[var(--text-secondary)]">
								Filas con conflicto
							</p>
							<p className="text-2xl font-bold tabular-nums text-danger">
								{impact.flaggedRows}
							</p>
						</div>
						<div className="hub-panel-inset px-4 py-3">
							<p className="text-2xs uppercase tracking-[0.08em] text-[var(--text-secondary)]">
								Filas ajustables
							</p>
							<p className="text-2xl font-bold tabular-nums text-warning">
								{impact.updatedRows}
							</p>
						</div>
						<div className="hub-panel-inset px-4 py-3">
							<p className="text-2xs uppercase tracking-[0.08em] text-[var(--text-secondary)]">
								Impacto estimado
							</p>
							<p className="text-2xl font-bold tabular-nums text-info">
								{n(impact.estimatedDelta)}
							</p>
						</div>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-3">
					<button
						onClick={onReviewDiscrepancy}
						className="inline-flex items-center justify-center gap-2 rounded-full border border-danger/20 bg-danger/12 px-4 py-2 text-label font-medium text-danger transition-colors hover:bg-danger/16"
					>
						<GitCompareArrows size={14} />
						{isOpen ? "Cerrar revisión" : "Revisar incidencia"}
					</button>
					<span className="text-label text-[var(--text-secondary)]">
						{hasScenario
							? "Valida el ajuste antes de aplicar cambios."
							: "No se requiere acción inmediata."}
					</span>
				</div>
			</div>
		</section>
	);
}
