interface LedgerGovernanceStripProps {
	entriesCount: number;
	selectedAccountId: string;
}

export function LedgerGovernanceStrip({
	entriesCount,
	selectedAccountId,
}: LedgerGovernanceStripProps) {
	return (
		<section className="grid grid-cols-1 gap-4 border-b border-border/50 bg-background/30 px-4 py-4 sm:px-6 lg:grid-cols-12">
			<article className="lg:col-span-5 rounded-[var(--radius-lg)] border border-danger-subtle bg-danger-subtle p-4">
				<div className="mb-2 flex items-center gap-2">
					<span className="chip chip-danger">L1 Riesgo de negocio</span>
					<span className="text-label font-semibold uppercase tracking-[0.1em] text-danger">
						Asientos sensibles
					</span>
				</div>
				<div className="grid gap-2 sm:grid-cols-3">
					<div>
						<p className="text-2xs uppercase tracking-[0.1em] text-muted-foreground">
							Asientos diarios
						</p>
						<p className="text-xl font-black tabular-nums text-danger">
							{entriesCount}
						</p>
					</div>
					<div>
						<p className="text-2xs uppercase tracking-[0.1em] text-muted-foreground">
							Cuenta activa
						</p>
						<p className="text-xl font-black tabular-nums text-warning">
							{selectedAccountId}
						</p>
					</div>
					<div>
						<p className="text-2xs uppercase tracking-[0.1em] text-muted-foreground">
							Control SUNAT
						</p>
						<p className="text-xl font-black tabular-nums text-info">Activo</p>
					</div>
				</div>
			</article>

			<article className="lg:col-span-4 rounded-[var(--radius-lg)] border border-info-subtle bg-info-subtle p-4">
				<div className="mb-2 flex items-center gap-2">
					<span className="chip chip-info">L2 Decision Gate</span>
				</div>
				<div className="space-y-2 text-label">
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-2 px-3 py-2">
						<span className="text-muted-foreground">Propuesta:</span> Generar
						exportable SIRE de la cuenta {selectedAccountId}.
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-2 px-3 py-2">
						<span className="text-muted-foreground">Impacto:</span> Congela lote
						contable y habilita firma de auditoría.
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-2 px-3 py-2">
						<span className="text-muted-foreground">Confirmación:</span>{" "}
						<span className="font-semibold text-warning">
							Humana obligatoria
						</span>
					</p>
				</div>
			</article>

			<article className="lg:col-span-3 rounded-[var(--radius-lg)] border border-[var(--color-stroke-1)] bg-surface-2 p-4">
				<div className="mb-2 flex items-center gap-2">
					<span className="chip">L3 Evidence</span>
				</div>
				<div className="space-y-2 text-label">
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-3 px-3 py-2">
						Fuente: Libro mayor interno
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-3 px-3 py-2">
						Timestamp: {new Date().toLocaleString("es-PE")}
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-surface-3 px-3 py-2 font-mono">
						hash: LGR-{selectedAccountId}-{entriesCount}
					</p>
				</div>
			</article>
		</section>
	);
}
