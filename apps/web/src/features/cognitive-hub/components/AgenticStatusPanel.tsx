import { Bot, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import type { AccountingJobRunView } from "../hooks/useAccountingJobRuns";

interface AgenticStatusPanelProps {
	isStreaming: boolean;
	hasPendingApproval: boolean;
	registrySurfaceCount?: number;
	representativeRun?: AccountingJobRunView | null;
}

export const AgenticStatusPanel = ({
	isStreaming,
	hasPendingApproval,
	registrySurfaceCount = 0,
	representativeRun = null,
}: AgenticStatusPanelProps) => {
	const statusLabel = hasPendingApproval
		? "Pendiente de validación"
		: isStreaming
			? "Procesando"
			: "Disponible";

	const statusDetail = hasPendingApproval
		? "Hay una propuesta lista para revisión humana antes de ejecutar cambios."
		: isStreaming
			? "El asistente está analizando datos y preparando una recomendación."
			: "Sin procesos críticos en curso. Puedes iniciar una consulta o revisar incidencias.";

	return (
		<section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-primary)]">
						{isStreaming ? <Clock3 size={16} /> : <Sparkles size={16} />}
					</div>
					<div>
						<h4 className="text-[13px] font-bold text-[var(--text-primary)]">
							Estado Operativo
						</h4>
						<p className="text-label text-[var(--text-secondary)]">
							Supervisión del flujo actual
						</p>
					</div>
				</div>

				<span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
					{isStreaming ? <Clock3 size={12} /> : <ShieldCheck size={12} />}
					{statusLabel}
				</span>
			</div>

			<p className="mt-4 text-[12px] leading-relaxed text-[var(--text-secondary)]">
				{statusDetail}
			</p>

			{hasPendingApproval ? (
				<div className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-label font-bold text-amber-500">
					<ShieldCheck size={14} />
					Requiere tu revisión
				</div>
			) : null}

			<div className="mt-4 grid gap-3 sm:grid-cols-2">
				<div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
					<p className="text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
						Superficies conectadas
					</p>
					<p className="mt-1 text-[13px] font-bold text-[var(--text-primary)]">
						{registrySurfaceCount} activas
					</p>
				</div>
				<div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
					<p className="text-2xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
						Validación reciente
					</p>
					<p className="mt-1 text-[13px] font-bold text-[var(--text-primary)] uppercase tracking-wider">
						{representativeRun?.controlPlane?.evaluationSummary?.state ??
							"SIN DATOS"}
					</p>
				</div>
			</div>
		</section>
	);
};
