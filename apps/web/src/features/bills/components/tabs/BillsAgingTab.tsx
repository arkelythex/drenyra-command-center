import { AlertCircle, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn, n } from "@/lib/utils";

const MOCK_AGING_DATA = [
	{
		vendor: "RUBY LANDSCAPE",
		total: 3050.0,
		current: 3050.0,
		d30: 0,
		d60: 0,
		d90: 0,
		status: "ok",
	},
	{
		vendor: "AWS AMAZON PERU",
		total: 12500.0,
		current: 0,
		d30: 12500.0,
		d60: 0,
		d90: 0,
		status: "warning",
	},
	{
		vendor: "MUEBLES EXPRESS",
		total: 4500.0,
		current: 0,
		d30: 0,
		d60: 4500.0,
		d90: 0,
		status: "critical",
	},
	{
		vendor: "SERVICIOS LOGISTICOS",
		total: 850.0,
		current: 850.0,
		d30: 0,
		d60: 0,
		d90: 0,
		status: "ok",
	},
];

export const BillsAgingTab = () => {
	return (
		<div className="mx-auto max-w-[1560px] space-y-8 pb-24">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				<AgingKPI
					label="Saldo total"
					value={n(20900)}
					sub="Pendiente hoy"
					highlight
				/>
				<AgingKPI label="Al día" value={n(3900)} sub="0-30 días" />
				<AgingKPI label="Vencido" value={n(17000)} sub="31+ días" urgent />
				<AgingKPI label="Promedio" value="42" sub="Días de pago" />
			</div>

			<Card className="overflow-hidden border-border/60 shadow-sm">
				<div className="flex items-center justify-between border-b border-border/50 bg-muted/10 px-6 py-5">
					<div>
						<h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-foreground">
							Antigüedad de pasivos
						</h3>
						<p className="mt-1 text-xs text-muted-foreground">
							Corte al cierre del periodo y prioridad de pago por proveedor.
						</p>
					</div>
					<button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted">
						<Filter size={14} /> Segmentación
					</button>
				</div>

				<CardContent className="p-0 overflow-x-auto custom-scrollbar">
					<table className="w-full text-left border-separate border-spacing-0 min-w-[1000px]">
						<thead className="bg-muted/20">
							<tr>
								<th className="border-b border-border/50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
									Proveedor
								</th>
								<th className="border-b border-border/50 px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
									Total
								</th>
								<th className="border-b border-border/50 bg-[rgba(var(--premium-action-rgb),0.04)] px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.24em] text-foreground">
									Corriente
								</th>
								<th className="border-b border-border/50 px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
									1-30 d
								</th>
								<th className="border-b border-border/50 px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
									31-60 d
								</th>
								<th className="border-b border-border/50 px-6 py-4 text-right text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
									61+ d
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/20">
							{MOCK_AGING_DATA.map((row, i) => (
								<tr
									key={i}
									className="cursor-default transition-colors duration-200 hover:bg-muted/10"
								>
									<td className="px-6 py-5">
										<div className="flex items-center gap-4">
											<div
												className={cn(
													"h-2 w-2 shrink-0 rounded-full transition-[background-color,box-shadow,opacity] duration-200",
													row.status === "ok"
														? "bg-muted-foreground/20"
														: row.status === "critical"
															? "bg-[var(--text-danger)]"
															: "bg-[var(--text-muted)]/50",
												)}
											/>
											<span className="text-xs font-semibold uppercase tracking-tight text-foreground">
												{row.vendor}
											</span>
										</div>
									</td>
									<td className="px-6 py-5 text-right font-mono text-xs font-semibold text-foreground tabular-nums tracking-tight">
										{n(row.total)}
									</td>
									<td className="bg-[rgba(var(--premium-action-rgb),0.025)] px-6 py-5 text-right font-mono text-xs text-foreground tabular-nums">
										{row.current > 0 ? n(row.current) : "—"}
									</td>
									<td className="px-6 py-5 text-right font-mono text-xs text-muted-foreground tabular-nums">
										{row.d30 > 0 ? n(row.d30) : "—"}
									</td>
									<td className="px-6 py-5 text-right font-mono text-xs text-muted-foreground tabular-nums">
										{row.d60 > 0 ? n(row.d60) : "—"}
									</td>
									<td className="px-6 py-5 text-right font-mono text-xs font-semibold text-foreground tabular-nums">
										{row.d90 > 0 ? n(row.d90) : "—"}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>

			<div className="flex items-start gap-5 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
				<div className="shrink-0 rounded-2xl bg-[var(--accent)] p-3 text-[var(--text-on-accent)]">
					<AlertCircle size={20} strokeWidth={2} />
				</div>

				<div className="flex-1 space-y-2">
					<h4 className="text-base font-semibold tracking-tight text-foreground">
						Prioridad de pago
					</h4>
					<p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
						Hay <strong className="text-foreground">S/ 4,500.00</strong> con
						antigüedad superior a 60 días. Programa ese bloque antes del
						siguiente cierre.
					</p>
				</div>

				<button className="ml-auto inline-flex h-11 items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--accent)] px-5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-on-accent)] transition-colors hover:opacity-95">
					Programar pagos
				</button>
			</div>
		</div>
	);
};

interface AgingKpiProps {
	label: string;
	value: string;
	sub: string;
	highlight?: boolean;
	urgent?: boolean;
}

const AgingKPI = ({ label, value, sub, highlight, urgent }: AgingKpiProps) => (
	<Card
		className={cn(
			"border border-border/60 shadow-sm transition-[background-color,border-color,color] duration-200",
			highlight
				? "bg-[var(--accent)] text-[var(--text-on-accent)]"
				: urgent
					? "border-[var(--border-danger)] bg-[var(--surface-danger)]/10 text-[var(--text-danger)]"
					: "bg-card",
		)}
	>
		<CardContent className="p-5">
			<p
				className={cn(
					"mb-3 text-2xs font-semibold uppercase tracking-[0.24em]",
					highlight ? "text-background/70" : "text-muted-foreground",
				)}
			>
				{label}
			</p>
			<div className="flex items-baseline justify-between">
				<p className="text-2xl font-semibold font-mono tracking-tight tabular-nums">
					{value}
				</p>
				<span
					className={cn(
						"text-2xs font-medium uppercase tracking-[0.18em]",
						highlight ? "text-background/60" : "text-muted-foreground/60",
					)}
				>
					{sub}
				</span>
			</div>
		</CardContent>
	</Card>
);
