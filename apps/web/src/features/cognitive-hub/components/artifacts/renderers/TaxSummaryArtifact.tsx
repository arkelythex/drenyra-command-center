import type { HubArtifact } from "@drenyra/shared/artifacts";
import { Calculator } from "lucide-react";
import { tokensToClasses } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { registerArtifact } from "../artifact-registry";

type TaxSummaryArt = Extract<HubArtifact, { type: "tax_summary" }>;

const CurrencyFormatter = new Intl.NumberFormat("es-PE", {
	style: "currency",
	currency: "PEN",
	minimumFractionDigits: 2,
});

function formatMoney(amount: number): string {
	return CurrencyFormatter.format(amount);
}

const statusConfig: Record<string, { color: string; bg: string; label: string }> =
	{
		CALCULATED: {
			color: "text-[var(--accent)]",
			bg: "bg-[var(--accent)]/10",
			label: "Calculado",
		},
		FILED: {
			color: "text-[var(--premium-success)]",
			bg: "bg-[var(--premium-success)]/10",
			label: "Declarado",
		},
		PENDING: {
			color: "text-[var(--premium-warning)]",
			bg: "bg-[var(--premium-warning)]/10",
			label: "Pendiente",
		},
		OVERDUE: {
			color: "text-[var(--premium-danger)]",
			bg: "bg-[var(--premium-danger)]/10",
			label: "Vencido",
		},
	};

export const TaxSummaryArtifact: React.FC<{ artifact: TaxSummaryArt }> = ({
	artifact,
}) => {
	const { rows, summary, period } = artifact.payload;

	return (
		<div
			className={cn(
				tokensToClasses.borderRadius("card"),
				"mt-6 border border-border/40 bg-foreground/[0.03] p-6",
			)}
		>
			<header className="mb-5 flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-background/60">
					<Calculator size={18} />
				</div>
				<div>
					<h4 className="text-sm font-black uppercase tracking-tight text-foreground">
						{artifact.title}
					</h4>
					<p className="text-2xs uppercase tracking-widest text-muted-foreground">
						Periodo {period} · {rows.length} tributos
					</p>
				</div>
			</header>

			{/* Summary */}
			<div className="mb-5 grid grid-cols-3 gap-3">
				<div className="rounded-xl border border-border/25 bg-background/40 p-3">
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Por pagar
					</p>
					<p className="mt-1 text-sm font-bold text-[var(--premium-warning)]">
						{formatMoney(summary.totalPayable)}
					</p>
				</div>
				<div className="rounded-xl border border-border/25 bg-background/40 p-3">
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Declarado
					</p>
					<p className="mt-1 text-sm font-bold text-[var(--premium-success)]">
						{formatMoney(summary.totalFiled)}
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
					</p>
				</div>
			</div>

			{/* Table */}
			<div className="overflow-x-auto">
				<table className="w-full text-xs">
					<thead>
						<tr className="border-b border-border/20 text-left text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
							<th className="pb-2 pr-3">Tributo</th>
							<th className="pb-2 pr-3 text-right">Base</th>
							<th className="pb-2 pr-3">Tasa</th>
							<th className="pb-2 pr-3 text-right">Monto</th>
							<th className="pb-2 pr-3">Vencimiento</th>
							<th className="pb-2">Estado</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => {
							const cfg = statusConfig[row.status];
							return (
								<tr
									key={row.taxName}
									className="border-b border-border/10 transition-colors hover:bg-foreground/[0.02]"
								>
									<td className="py-2 pr-3 font-medium text-foreground">
										{row.taxName}
									</td>
									<td className="py-2 pr-3 text-right font-mono text-foreground">
										{formatMoney(row.base)}
									</td>
									<td className="py-2 pr-3 font-mono text-foreground/70">
										{row.rate}
									</td>
									<td className="py-2 pr-3 text-right font-mono text-foreground">
										{formatMoney(row.amount)}
									</td>
									<td className="py-2 pr-3 font-mono text-foreground/70">
										{row.dueDate}
									</td>
									<td className="py-2">
										<span
											className={cn(
												"inline-flex rounded-md px-2 py-0.5 text-2xs font-semibold",
												cfg.bg,
												cfg.color,
											)}
										>
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

registerArtifact("tax_summary", TaxSummaryArtifact);
