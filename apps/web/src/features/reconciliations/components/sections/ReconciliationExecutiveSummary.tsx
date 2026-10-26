import { cn } from "@/lib/utils";

interface ReconciliationExecutiveSummaryProps {
	unmatchedCount: number;
	unmatchedExposure: string; // pre-formatted
	/** Share of movements reconciled; null when there are no movements. */
	reconciledRate: number | null;
	decisionRequiresHuman: boolean;
}

/**
 * Period figures for bank reconciliation. Shows only data that exists:
 * with no movements there is nothing to summarize, so it renders nothing
 * and the view's empty state explains what to do.
 */
export function ReconciliationExecutiveSummary({
	unmatchedCount,
	unmatchedExposure,
	reconciledRate,
	decisionRequiresHuman,
}: ReconciliationExecutiveSummaryProps) {
	if (reconciledRate === null) return null;

	const figures = [
		{
			label: "Sin conciliar",
			value: String(unmatchedCount),
			tone: unmatchedCount > 0 ? "text-destructive" : "text-foreground",
		},
		{
			label: "Monto expuesto",
			value: unmatchedExposure,
			tone: "text-foreground",
		},
		{
			label: "Conciliado",
			value: `${reconciledRate}%`,
			tone: "text-foreground",
		},
	];

	return (
		<section
			aria-label="Resumen de conciliación"
			className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6"
		>
			<dl className="grid grid-cols-3 gap-6">
				{figures.map((figure) => (
					<div key={figure.label} className="space-y-1">
						<dt className="text-xs text-muted-foreground">{figure.label}</dt>
						<dd
							className={cn(
								"font-mono text-xl font-medium tabular-nums tracking-tight",
								figure.tone,
							)}
						>
							{figure.value}
						</dd>
					</div>
				))}
			</dl>
			<p
				className={cn(
					"text-sm",
					decisionRequiresHuman ? "text-foreground" : "text-muted-foreground",
				)}
			>
				{decisionRequiresHuman
					? `Requiere revisión: ${unmatchedCount} ${unmatchedCount === 1 ? "movimiento pendiente" : "movimientos pendientes"}.`
					: "Todos los movimientos del período están conciliados."}
			</p>
		</section>
	);
}
