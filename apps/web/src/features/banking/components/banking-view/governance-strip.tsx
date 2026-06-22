import { cn } from "@/lib/utils";

interface BankingGovernanceStripProps {
	unreconciledCount: number;
	balanceValue: number;
	balanceFormatter: (value: number) => string;
	transactionsCount: number;
	manualReviewRequired: boolean;
	evidenceHash: string;
}

export function BankingGovernanceStrip({
	unreconciledCount,
	balanceValue,
	balanceFormatter,
	transactionsCount,
	manualReviewRequired,
	evidenceHash,
}: BankingGovernanceStripProps) {
	return (
		<section className="grid grid-cols-1 gap-4 border-b border-[var(--border-subtle)] bg-[var(--surface-1)] px-6 py-4 xl:grid-cols-12">
			<article className="xl:col-span-5 rounded-[var(--radius-lg)] border border-danger-subtle bg-danger-subtle p-4">
				<div className="mb-2 flex items-center gap-2">
					<span className="chip chip-danger">L1 Riesgo de negocio</span>
					<span className="text-label font-semibold uppercase tracking-[0.1em] text-danger">
						Riesgo de tesorería
					</span>
				</div>
				<div className="grid gap-2 sm:grid-cols-3">
					<div>
						<p className="text-2xs uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
							No conciliadas
						</p>
						<p className="text-xl font-bold tabular-nums text-danger">
							{unreconciledCount}
						</p>
					</div>
					<div>
						<p className="text-2xs uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
							Saldo actual
						</p>
						<p className="text-xl font-bold tabular-nums text-warning">
							{balanceFormatter(balanceValue)}
						</p>
					</div>
					<div>
						<p className="text-2xs uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
							Movimientos
						</p>
						<p className="text-xl font-bold tabular-nums text-info">
							{transactionsCount}
						</p>
					</div>
				</div>
			</article>

			<article className="xl:col-span-4 rounded-[var(--radius-lg)] border border-info-subtle bg-info-subtle p-4">
				<div className="mb-2 flex items-center gap-2">
					<span className="chip chip-info">L2 Decision Gate</span>
				</div>
				<div className="space-y-2 text-label">
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-[var(--surface-2)]/52 px-3 py-2">
						<span className="text-[var(--text-tertiary)]">Propuesta:</span>{" "}
						Ejecutar conciliación de lote para cuenta activa.
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-[var(--surface-2)]/52 px-3 py-2">
						<span className="text-[var(--text-tertiary)]">Impacto:</span>{" "}
						Recalcula estado de caja y alertas regulatorias.
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-[var(--surface-2)]/52 px-3 py-2">
						<span className="text-[var(--text-tertiary)]">Confirmación:</span>{" "}
						<span
							className={cn(
								"font-semibold",
								manualReviewRequired ? "text-warning" : "text-success",
							)}
						>
							{manualReviewRequired
								? "Validación humana requerida"
								: "Ejecución automática habilitada"}
						</span>
					</p>
				</div>
			</article>

			<article className="xl:col-span-3 rounded-[var(--radius-lg)] border border-[var(--color-stroke-1)] bg-[var(--surface-2)]/52 p-4">
				<div className="mb-2 flex items-center gap-2">
					<span className="chip">L3 Evidence</span>
				</div>
				<div className="space-y-2 text-label">
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-[var(--surface-3)]/54 px-3 py-2">
						Fuente: Conectores bancarios + ledger
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-[var(--surface-3)]/54 px-3 py-2">
						Timestamp: {new Date().toLocaleString("es-PE")}
					</p>
					<p className="rounded-[var(--radius-md)] border border-[var(--color-stroke-1)] bg-[var(--surface-3)]/54 px-3 py-2 font-mono">
						hash: {evidenceHash}
					</p>
				</div>
			</article>
		</section>
	);
}
