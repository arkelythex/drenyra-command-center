interface AuditMetricsProps {
	eventCount: number;
}

export function AuditMetrics({ eventCount }: AuditMetricsProps) {
	return (
		<section className="grid grid-cols-1 gap-4 border-b border-border/50 bg-background/30 px-6 py-4 xl:grid-cols-12">
			<article className="xl:col-span-5 rounded-[var(--radius-lg)] border border-danger-subtle bg-danger-subtle p-4">
				<div className="mb-2 flex items-center gap-2">
					<span className="chip chip-danger">L1 Riesgo de negocio</span>
					<span className="text-label font-semibold uppercase tracking-[0.1em] text-danger">
						Controles críticos
					</span>
				</div>
				<div className="grid gap-2 sm:grid-cols-3">
					<div>
						<p className="text-2xs uppercase tracking-[0.1em] text-muted-foreground">
							Eventos críticos
						</p>
						<p className="text-xl font-black tabular-nums text-danger">3</p>
					</div>
					<div>
						<p className="text-2xs uppercase tracking-[0.1em] text-muted-foreground">
							Pendientes de firma
						</p>
						<p className="text-xl font-black tabular-nums text-warning">1</p>
					</div>
					<div>
						<p className="text-2xs uppercase tracking-[0.1em] text-muted-foreground">
							Integridad
						</p>
						<p className="text-xl font-black tabular-nums text-info">99.2%</p>
					</div>
				</div>
			</article>

			<article className="xl:col-span-4 rounded-[var(--radius-lg)] border border-info-subtle bg-info-subtle p-4">
				<div className="mb-2 flex items-center gap-2">
					<span className="chip chip-info">L2 Decision Gate</span>
				</div>
				<div className="space-y-2 text-label">
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-2 px-3 py-2">
						<span className="text-muted-foreground">Propuesta:</span> Exportar
						lote de auditoría periodo mensual.
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-2 px-3 py-2">
						<span className="text-muted-foreground">Impacto:</span> Congela
						snapshot y abre cadena de evidencia.
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-2 px-3 py-2">
						<span className="text-muted-foreground">Confirmación:</span>{" "}
						<span className="font-semibold text-warning">
							Requiere aprobación humana
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
						Fuente: Audit trail interno
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-3 px-3 py-2">
						Timestamp: {new Date().toLocaleString("es-PE")}
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-3 px-3 py-2 font-mono">
						hash: AUD-{eventCount}-2026
					</p>
				</div>
			</article>
		</section>
	);
}
