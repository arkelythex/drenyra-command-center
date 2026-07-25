import { CheckCircle2, FileSearch, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
	type ReconciliationDiffEntry,
	useReconciliationDiffs,
} from "../hooks/useReconciliationDiffs";

const MOCK_DIFFS: ReconciliationDiffEntry[] = [
	{
		id: "diff-1",
		bankMovement: "Abono BCP S/ 8,420.00 — 2026-07-08",
		amount: 8420,
		proposedMatch: "Factura F001-457 · Drenyra Consulting SAC",
		confidence: 3,
		evidence:
			"Monto exacto, fecha coincidente, RUC del emisor verificado contra CDR.",
	},
	{
		id: "diff-2",
		bankMovement: "Cargo BCP S/ 2,150.00 — 2026-07-05",
		amount: 2150,
		proposedMatch: "Recibo por servicios · Proveedor 20601234567",
		confidence: 2,
		evidence:
			"Coincidencia parcial de monto y fecha; falta el comprobante electrónico.",
	},
];

const CONFIDENCE_LABELS: Record<number, string> = {
	1: "Baja · requiere revisión",
	2: "Media · verificar fuente",
	3: "Alta · coincidencia exacta",
};

const CONFIDENCE_COLORS: Record<number, string> = {
	1: "text-[var(--color-danger)] border-[var(--color-danger)]/20 bg-[var(--color-danger)]/5",
	2: "text-[var(--color-warning)] border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5",
	3: "text-[var(--color-success)] border-[var(--color-success)]/20 bg-[var(--color-success)]/5",
};

export function ReconciliationDiffView() {
	const { data: apiDiffs, isLoading } = useReconciliationDiffs();
	const diffs =
		(apiDiffs && apiDiffs.length > 0 ? apiDiffs : null) ??
		(isLoading ? [] : MOCK_DIFFS);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
					Diferencias detectadas
				</h2>
				<span className="text-[10px] text-[var(--text-secondary)]">
					{diffs.length} pendientes
				</span>
			</div>

			{diffs.length === 0 && (
				<div className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] py-10 text-center">
					<CheckCircle2 size={24} className="text-[var(--color-success)]" />
					<p className="text-sm font-medium text-[var(--text-primary)]">
						No hay diferencias
					</p>
					<p className="text-xs text-[var(--text-tertiary)]">
						Todas las conciliaciones están al día.
					</p>
				</div>
			)}

			{diffs.map((diff) => {
				const confidenceColor = CONFIDENCE_COLORS[diff.confidence];
				return (
					<div
						key={diff.id}
						className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-5"
					>
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0 flex-1">
								<div className="flex items-center gap-2">
									<FileSearch
										size={14}
										className="text-[var(--color-info)] shrink-0"
									/>
									<p className="text-xs font-semibold text-[var(--text-primary)]">
										{diff.bankMovement}
									</p>
								</div>
								<p className="mt-2 text-xs text-[var(--text-secondary)]">
									<strong>Propuesta: </strong>
									{diff.proposedMatch}
								</p>
							</div>
							<p className="shrink-0 text-sm font-bold tabular-nums text-[var(--text-primary)]">
								S/ {diff.amount.toLocaleString()}
							</p>
						</div>

						<div
							className={cn(
								"mt-3 rounded-xl border px-3 py-2",
								confidenceColor,
							)}
						>
							<p className="text-xs font-medium text-[var(--text-primary)]">
								Confianza: {CONFIDENCE_LABELS[diff.confidence]}
							</p>
							<p className="mt-1 text-[11px] text-[var(--text-secondary)]">
								{diff.evidence}
							</p>
						</div>

						<div className="mt-3 flex gap-2">
							<button
								type="button"
								className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-inverse)] transition-colors hover:bg-[var(--color-primary-hover)]"
							>
								<CheckCircle2 size={12} />
								Aprobar
							</button>
							<button
								type="button"
								className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-3)]"
							>
								<ShieldCheck size={12} />
								Crear excepción
							</button>
						</div>

						<p className="mt-2 text-[10px] text-[var(--text-tertiary)]">
							Las acciones quedan registradas en la traza de auditoría.
						</p>
					</div>
				);
			})}
		</div>
	);
}
