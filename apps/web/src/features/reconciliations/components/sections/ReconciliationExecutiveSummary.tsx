import type React from "react";
import { cn } from "@/lib/utils";

interface ReconciliationExecutiveSummaryProps {
	unmatchedCount: number;
	unmatchedExposure: string; // pre-formatted
	reconciledRate: number;
	decisionRequiresHuman: boolean;
}

export const ReconciliationExecutiveSummary: React.FC<
	ReconciliationExecutiveSummaryProps
> = ({
	unmatchedCount,
	unmatchedExposure,
	reconciledRate,
	decisionRequiresHuman,
}) => {
	return (
		<section className="grid grid-cols-1 gap-4 border-b border-border/50 bg-[var(--surface-1)] px-4 py-4 sm:px-6 xl:grid-cols-12">
			<article className="xl:col-span-5 rounded-[var(--radius-lg)] border border-danger-subtle bg-danger-subtle p-4">
				<div className="mb-2 flex items-center gap-2">
					<span className="chip chip-danger">Riesgo operativo</span>
					<span className="text-label font-medium tracking-[0.08em] text-danger">
						Brechas de conciliación
					</span>
				</div>
				<div className="grid gap-2 sm:grid-cols-3">
					<div>
						<p className="text-2xs tracking-[0.08em] text-muted-foreground">
							Sin conciliar
						</p>
						<p className="text-xl font-black tabular-nums text-danger">
							{unmatchedCount}
						</p>
					</div>
					<div>
						<p className="text-2xs tracking-[0.08em] text-muted-foreground">
							Exposición
						</p>
						<p className="text-xl font-black tabular-nums text-warning">
							{unmatchedExposure}
						</p>
					</div>
					<div>
						<p className="text-2xs tracking-[0.08em] text-muted-foreground">
							Conciliado
						</p>
						<p className="text-xl font-black tabular-nums text-info">
							{reconciledRate}%
						</p>
					</div>
				</div>
			</article>

			<article className="xl:col-span-4 rounded-[var(--radius-lg)] border border-info-subtle bg-info-subtle p-4">
				<div className="mb-2 flex items-center gap-2">
					<span className="chip chip-info">Decisión sugerida</span>
				</div>
				<div className="space-y-2 text-label">
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-2 px-3 py-2">
						<span className="text-muted-foreground">Acción:</span> Aplicar
						coincidencias con score igual o mayor a 98%.
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-2 px-3 py-2">
						<span className="text-muted-foreground">Impacto:</span> Actualiza
						ledger y reduce pendientes operativos.
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-2 px-3 py-2">
						<span className="text-muted-foreground">Estado:</span>{" "}
						<span
							className={cn(
								"font-semibold",
								decisionRequiresHuman ? "text-warning" : "text-success",
							)}
						>
							{decisionRequiresHuman
								? "Requiere revisión humana"
								: "Se puede aplicar de forma automática"}
						</span>
					</p>
				</div>
			</article>

			<article className="xl:col-span-3 rounded-[var(--radius-lg)] border border-[var(--color-stroke-1)] bg-surface-2 p-4">
				<div className="mb-2 flex items-center gap-2">
					<span className="chip">Evidencia</span>
				</div>
				<div className="space-y-2 text-label">
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-3 px-3 py-2">
						Fuente: Extracto BCP + Libro auxiliar
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-3 px-3 py-2">
						Última revisión: {new Date().toLocaleString("es-PE")}
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-3 px-3 py-2">
						Referencia: REC-{reconciledRate}-{unmatchedCount}
					</p>
				</div>
			</article>
		</section>
	);
};
