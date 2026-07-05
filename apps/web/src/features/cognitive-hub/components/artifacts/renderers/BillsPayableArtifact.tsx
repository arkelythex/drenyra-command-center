import type { HubArtifact } from "@drenyra/shared/artifacts";
import { Receipt } from "lucide-react";
import { tokensToClasses } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { registerArtifact } from "../artifact-registry";

type BillsPayableArt = Extract<HubArtifact, { type: "bills_payable" }>;

const CurrencyFormatter = new Intl.NumberFormat("es-PE", {
	style: "currency",
	currency: "PEN",
	minimumFractionDigits: 2,
});

function formatMoney(amount: number): string {
	return CurrencyFormatter.format(amount);
}

const statusConfig: Record<string, { color: string; label: string }> = {
	OVERDUE: { color: "text-[var(--premium-danger)]", label: "Vencido" },
	PENDING: { color: "text-[var(--premium-warning)]", label: "Pendiente" },
	PARTIAL: { color: "text-[var(--accent)]", label: "Parcial" },
	PAID: { color: "text-[var(--premium-success)]", label: "Pagado" },
	APPROVAL: { color: "text-[var(--color-info)]", label: "Aprobación" },
	REVIEW: { color: "text-[var(--text-secondary)]", label: "Revisión" },
};

export const BillsPayableArtifact: React.FC<{
	artifact: BillsPayableArt;
}> = ({ artifact }) => {
	const { rows, summary } = artifact.payload;
	const overdueCount = rows.filter((r) => r.status === "OVERDUE").length;

	return (
		<div
			className={cn(
				tokensToClasses.borderRadius("card"),
				"mt-6 border border-border/40 bg-foreground/[0.03] p-6",
			)}
		>
			<header className="mb-5 flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-background/60">
					<Receipt size={18} />
				</div>
				<div>
					<h4 className="text-sm font-black uppercase tracking-tight text-foreground">
						{artifact.title}
					</h4>
					<p className="text-2xs uppercase tracking-widest text-muted-foreground">
						Cuentas por pagar · {rows.length} facturas
					</p>
				</div>
			</header>

			{/* Summary cards */}
			<div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div className="rounded-xl border border-border/25 bg-background/40 p-3">
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Pendiente
					</p>
					<p className="mt-1 text-sm font-bold text-foreground">
						{formatMoney(summary.totalPending)}
					</p>
				</div>
				<div className="rounded-xl border border-border/25 bg-background/40 p-3">
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Vencido
					</p>
					<p
						className={cn(
							"mt-1 text-sm font-bold",
							summary.totalOverdue > 0
								? "text-[var(--premium-danger)]"
								: "text-foreground",
						)}
					>
						{formatMoney(summary.totalOverdue)}
						{overdueCount > 0 && (
							<span className="ml-1 text-2xs">({overdueCount} fact.)</span>
						)}
					</p>
				</div>
				<div className="rounded-xl border border-border/25 bg-background/40 p-3">
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Pagado
					</p>
					<p className="mt-1 text-sm font-bold text-[var(--premium-success)]">
						{formatMoney(summary.totalPaid)}
					</p>
				</div>
				<div className="rounded-xl border border-border/25 bg-background/40 p-3">
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Total facturas
					</p>
					<p className="mt-1 text-sm font-bold text-foreground">
						{summary.count}
					</p>
				</div>
			</div>

			{/* Table */}
			<div className="overflow-x-auto">
				<table className="w-full text-xs">
					<thead>
						<tr className="border-b border-border/20 text-left text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
							<th className="pb-2 pr-3">Proveedor</th>
							<th className="pb-2 pr-3">Factura</th>
							<th className="pb-2 pr-3">Vencimiento</th>
							<th className="pb-2 pr-3 text-right">Monto</th>
							<th className="pb-2">Estado</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => {
							const cfg = statusConfig[row.status] ?? statusConfig.PENDING;
							const isOverdue = row.status === "OVERDUE" && row.daysOverdue;
							return (
								<tr
									key={row.id}
									className={cn(
										"border-b border-border/10 transition-colors hover:bg-foreground/[0.02]",
										isOverdue && "bg-[var(--premium-danger)]/[0.02]",
									)}
								>
									<td className="py-2 pr-3 font-medium text-foreground">
										{row.vendor}
									</td>
									<td className="py-2 pr-3 font-mono text-foreground/70">
										{row.invoiceNumber}
									</td>
									<td className="py-2 pr-3 font-mono text-foreground/70">
										{row.dueDate}
										{isOverdue && (
											<span className="ml-1 text-[var(--premium-danger)]">
												(-{row.daysOverdue}d)
											</span>
										)}
									</td>
									<td className="py-2 pr-3 text-right font-mono text-foreground">
										{formatMoney(row.amount)}
									</td>
									<td className="py-2">
										<span className={cn("text-2xs font-semibold", cfg.color)}>
											{cfg.label}
										</span>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
};

registerArtifact("bills_payable", BillsPayableArtifact);
