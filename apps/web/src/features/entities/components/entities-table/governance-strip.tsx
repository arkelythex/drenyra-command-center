import { cn } from "@/lib/utils";

interface EntitiesGovernanceStripProps {
	entitiesCount: number;
	highRiskCount: number;
	pendingComplianceCount: number;
	avgCompliance: number;
}

export function EntitiesGovernanceStrip({
	entitiesCount,
	highRiskCount,
	pendingComplianceCount,
	avgCompliance,
}: EntitiesGovernanceStripProps) {
	return (
		<section className="grid grid-cols-1 gap-4 border-b border-border/50 bg-background/30 px-6 py-4 xl:grid-cols-12">
			<article className="xl:col-span-5 rounded-[var(--radius-lg)] border border-danger-subtle bg-danger-subtle p-4">
				<div className="mb-2 flex items-center gap-2">
					<span className="chip chip-danger">L1 Riesgo de negocio</span>
					<span className="text-label font-semibold uppercase tracking-[0.1em] text-danger">
						Exposicion por contraparte
					</span>
				</div>
				<div className="grid gap-2 sm:grid-cols-3">
					<div>
						<p className="text-2xs uppercase tracking-[0.1em] text-muted-foreground">
							Riesgo alto
						</p>
						<p className="text-xl font-black tabular-nums text-danger">
							{highRiskCount}
						</p>
					</div>
					<div>
						<p className="text-2xs uppercase tracking-[0.1em] text-muted-foreground">
							Cumplimiento bajo 80%
						</p>
						<p className="text-xl font-black tabular-nums text-warning">
							{pendingComplianceCount}
						</p>
					</div>
					<div>
						<p className="text-2xs uppercase tracking-[0.1em] text-muted-foreground">
							Compliance promedio
						</p>
						<p className="text-xl font-black tabular-nums text-info">
							{avgCompliance}%
						</p>
					</div>
				</div>
			</article>

			<article className="xl:col-span-4 rounded-[var(--radius-lg)] border border-info-subtle bg-info-subtle p-4">
				<div className="mb-2 flex items-center gap-2">
					<span className="chip chip-info">L2 Decision Gate</span>
				</div>
				<div className="space-y-2 text-label">
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-2 px-3 py-2">
						<span className="text-muted-foreground">Propuesta:</span> Aplicar
						revision de compliance a entidades criticas.
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-2 px-3 py-2">
						<span className="text-muted-foreground">Impacto:</span> Ajusta
						perfil de riesgo y bloqueos operativos.
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-2 px-3 py-2">
						<span className="text-muted-foreground">Confirmacion:</span>{" "}
						<span
							className={cn(
								"font-semibold",
								highRiskCount > 0 ? "text-warning" : "text-success",
							)}
						>
							{highRiskCount > 0
								? "Aprobacion humana requerida"
								: "Sin bloqueos criticos"}
						</span>
					</p>
				</div>
			</article>

			<article className="xl:col-span-3 rounded-[var(--radius-lg)] border border-[var(--color-stroke-1)] bg-surface-2 p-4">
				<div className="mb-2 flex items-center gap-2">
					<span className="chip">L3 Evidence</span>
				</div>
				<div className="space-y-2 text-label">
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-3 px-3 py-2">
						Fuente: Registro maestro de entidades
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-3 px-3 py-2">
						Timestamp: {new Date().toLocaleString("es-PE")}
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-3 px-3 py-2 font-mono">
						hash: ENT-{entitiesCount}-{highRiskCount}-{avgCompliance}
					</p>
				</div>
			</article>
		</section>
	);
}
