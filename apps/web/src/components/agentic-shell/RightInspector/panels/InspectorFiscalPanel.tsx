interface InspectorFiscalPanelProps {
	id: string;
	title: string;
}

/**
 * Fiscal analysis panel — wraps core fiscal inspector data.
 * Full implementation reuses FiscalInspectorDetail from the existing layout.
 * For PR2, shows a structured placeholder with the right visual pattern.
 */
export function InspectorFiscalPanel({ id, title }: InspectorFiscalPanelProps) {
	return (
		<div className="space-y-4 p-4">
			{/* Risk badge */}
			<div className="flex items-center gap-2">
				<span className="rounded-full bg-[var(--color-warning)]/20 px-2 py-0.5 text-xs font-medium text-[var(--color-warning)]">
					Riesgo: Bajo
				</span>
				<span className="rounded-full bg-[var(--color-info)]/20 px-2 py-0.5 text-xs font-medium text-[var(--color-info)]">
					Confianza: 92%
				</span>
			</div>

			{/* Agent analysis */}
			<section>
				<h4 className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
					Análisis del agente
				</h4>
				<div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
					<p className="text-xs text-[var(--text-muted)]">
						Fiscal analysis for {title} ({id}) — feature panel integration
						coming with full fiscal context.
					</p>
				</div>
			</section>

			{/* Evidence section */}
			<section>
				<h4 className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
					Evidencia
				</h4>
				<div className="space-y-2">
					<div className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2">
						<div className="h-8 w-8 rounded bg-[var(--surface-3)]" />
						<div className="flex-1">
							<div className="text-xs font-medium text-[var(--text-primary)]">
								XML
							</div>
							<div className="text-[10px] text-[var(--text-muted)]">
								F001-2841.xml
							</div>
						</div>
						<span className="rounded-full bg-[var(--color-success)]/20 px-1.5 py-0.5 text-[10px] text-[var(--color-success)]">
							Válido
						</span>
					</div>
					<div className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2">
						<div className="h-8 w-8 rounded bg-[var(--surface-3)]" />
						<div className="flex-1">
							<div className="text-xs font-medium text-[var(--text-primary)]">
								CDR
							</div>
							<div className="text-[10px] text-[var(--text-muted)]">
								R-2841.cdr
							</div>
						</div>
						<span className="rounded-full bg-[var(--color-success)]/20 px-1.5 py-0.5 text-[10px] text-[var(--color-success)]">
							Válido
						</span>
					</div>
				</div>
			</section>

			{/* Approval actions */}
			<section>
				<h4 className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
					Acciones
				</h4>
				<div className="flex gap-2">
					<button
						type="button"
						className="flex-1 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
					>
						Aprobar
					</button>
					<button
						type="button"
						className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-3)]"
					>
						Editar
					</button>
					<button
						type="button"
						className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-xs font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--surface-3)]"
					>
						Rechazar
					</button>
				</div>
			</section>

			{/* Pipeline status */}
			<section>
				<h4 className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
					Pipeline
				</h4>
				<div className="space-y-1.5">
					{["Extracción", "Validación", "Análisis", "Revisión"].map(
						(step, i) => (
							<div key={step} className="flex items-center gap-2">
								<div
									className={`h-2 w-2 rounded-full ${
										i < 3
											? "bg-[var(--color-success)]"
											: "bg-[var(--surface-3)]"
									}`}
								/>
								<span
									className={`text-xs ${
										i < 3
											? "text-[var(--text-primary)]"
											: "text-[var(--text-muted)]"
									}`}
								>
									{step}
								</span>
								{i < 3 && (
									<span className="ml-auto text-[10px] text-[var(--color-success)]">
										Completado
									</span>
								)}
							</div>
						),
					)}
				</div>
			</section>
		</div>
	);
}
