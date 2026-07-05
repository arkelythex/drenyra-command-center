import type { ContextRegistrySurfaceDTO } from "@drenyra/application";
import { ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { useAccountingJobRuns } from "../../hooks/useAccountingJobRuns";
import { useAccountingJobsCatalog } from "../../hooks/useAccountingJobsCatalog";

function getReadinessLabel(state: string | undefined): string {
	if (state === "green") return "Ready";
	if (state === "yellow") return "Supervisado";
	if (state === "red") return "Bloqueado";
	return "Sin evidencia";
}

export function ControlPlaneView() {
	const { data: jobsCatalog } = useAccountingJobsCatalog();
	const { runs } = useAccountingJobRuns(6);
	const surfaces = jobsCatalog?.registrySurfaces ?? [];

	if (surfaces.length === 0) {
		return (
			<div className="rounded-xl border border-dashed border-[var(--border-subtle)] p-4 text-[12px] text-[var(--text-secondary)] bg-[var(--surface-1)]">
				No hay integraciones fiscales activas monitoreadas en este expediente.
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3 text-label font-medium text-[var(--text-secondary)]">
				<span className="font-bold text-[var(--text-primary)]">Integraciones Activas</span> · Fuentes de datos con soporte documental y validación.
			</div>
			{surfaces.map((surface: ContextRegistrySurfaceDTO) => {
				const latestRun = runs.find(
					(run) => run.controlPlane?.surfaceId === surface.surfaceId,
				);
				const evaluationState =
					latestRun?.controlPlane?.evaluationSummary?.state;
				const evidenceCount =
					latestRun?.controlPlane?.documentarySources.length ?? 0;

				return (
					<div
						key={surface.surfaceId}
						className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4"
					>
						<div className="flex items-start justify-between gap-3">
							<div>
								<p className="text-[13px] font-bold text-[var(--text-primary)]">
									{surface.title}
								</p>
								<p className="mt-1 text-label text-[var(--text-secondary)] line-clamp-1">
									{surface.description}
								</p>
							</div>
							<span className="shrink-0 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 text-3xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
								{getReadinessLabel(evaluationState)}
							</span>
						</div>

						<div className="mt-3 flex flex-wrap gap-2">
							<span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 text-2xs font-medium text-[var(--text-secondary)]">
								<Workflow className="h-3 w-3 opacity-70" />
								<span className="truncate max-w-[120px]">{surface.surfaceId}</span>
							</span>
							<span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 text-2xs font-medium text-[var(--text-secondary)]">
								<ShieldCheck className="h-3 w-3 opacity-70" />
								{surface.approvalsRequired.length > 0
									? "Revisión req."
									: "Auto"}
							</span>
						</div>

						<div className="mt-3 rounded-lg bg-[var(--surface-2)] p-2.5">
							<p className="text-2xs text-[var(--text-secondary)] line-clamp-1">
								<span className="font-bold text-[var(--text-primary)]">Actividad:</span> {latestRun?.summary ?? "Sin sincronización reciente"}
							</p>
							<p className="mt-1 text-2xs font-mono text-[var(--text-tertiary)]">
								Evidencia documental: {evidenceCount} ref(s)
							</p>
						</div>
					</div>
				);
			})}
		</div>
	);
}
