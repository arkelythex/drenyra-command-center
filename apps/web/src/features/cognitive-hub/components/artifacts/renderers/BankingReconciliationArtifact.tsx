import type { HubArtifact } from "@drenyra/shared/artifacts";
import { ArrowUpDown, CheckCircle2, Landmark, XCircle } from "lucide-react";
import { tokensToClasses } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { registerArtifact } from "../artifact-registry";

type BankingReconciliationArt = Extract<
	HubArtifact,
	{ type: "banking_reconciliation" }
>;

const statusConfig = {
	MATCH: {
		icon: CheckCircle2,
		color: "text-[var(--premium-success)]",
		bg: "bg-[var(--premium-success)]/5",
		label: "Coinciden",
	},
	MISMATCH: {
		icon: XCircle,
		color: "text-[var(--premium-danger)]",
		bg: "bg-[var(--premium-danger)]/5",
		label: "Difieren",
	},
	MISSING_IN_LEDGER: {
		icon: ArrowUpDown,
		color: "text-[var(--premium-warning)]",
		bg: "bg-[var(--premium-warning)]/5",
		label: "Falta en libro",
	},
	MISSING_IN_BANK: {
		icon: ArrowUpDown,
		color: "text-[var(--accent)]",
		bg: "bg-[var(--accent)]/5",
		label: "Falta en banco",
	},
} as const;

const CurrencyFormatter = new Intl.NumberFormat("es-PE", {
	style: "currency",
	currency: "PEN",
	minimumFractionDigits: 2,
});

function formatMoney(amount: number): string {
	return CurrencyFormatter.format(amount);
}

export const BankingReconciliationArtifact: React.FC<{
	artifact: BankingReconciliationArt;
}> = ({ artifact }) => {
	const { summary, rows, period, accountName, currency } = artifact.payload;
	const hasIssues = summary.mismatched > 0;

	return (
		<div
			className={cn(
				tokensToClasses.borderRadius("card"),
				"mt-6 border border-border/40 bg-foreground/[0.03] p-6",
			)}
		>
			{/* Header */}
			<header className="mb-5 flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-background/60">
					<Landmark size={18} />
				</div>
				<div>
					<h4 className="text-sm font-black uppercase tracking-tight text-foreground">
						{artifact.title}
					</h4>
					<p className="text-2xs uppercase tracking-widest text-muted-foreground">
						{accountName} · {period} · {currency}
					</p>
				</div>
			</header>

			{/* Summary cards */}
			<div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div className="rounded-xl border border-border/25 bg-background/40 p-3">
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Saldo banco
					</p>
					<p className="mt-1 text-sm font-bold text-foreground">
						{formatMoney(summary.totalBank)}
					</p>
				</div>
				<div className="rounded-xl border border-border/25 bg-background/40 p-3">
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Saldo libro
					</p>
					<p className="mt-1 text-sm font-bold text-foreground">
						{formatMoney(summary.totalLedger)}
					</p>
				</div>
				<div className="rounded-xl border border-border/25 bg-background/40 p-3">
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Diferencia
					</p>
					<p
						className={cn(
							"mt-1 text-sm font-bold",
							summary.totalDifference === 0
								? "text-[var(--premium-success)]"
								: "text-[var(--premium-danger)]",
						)}
					>
						{formatMoney(Math.abs(summary.totalDifference))}
						{summary.totalDifference >= 0 ? " (Favor banco)" : " (Favor libro)"}
					</p>
				</div>
				<div className="rounded-xl border border-border/25 bg-background/40 p-3">
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Coincidencias
					</p>
					<p className="mt-1 text-sm font-bold text-foreground">
						{summary.matched}/{rows.length}
					</p>
				</div>
			</div>

			{/* Issues banner */}
			{hasIssues && (
				<div className="mb-4 rounded-xl border border-[var(--premium-danger)]/20 bg-[var(--premium-danger)]/5 p-3 text-xs text-[var(--premium-danger)]">
					Se encontraron {summary.mismatched} movimiento(s) que no coinciden
					entre banco y libro contable. Revisa las filas marcadas abajo.
				</div>
			)}

			{/* Rows table */}
			<div className="overflow-x-auto">
				<table className="w-full text-xs">
					<thead>
						<tr className="border-b border-border/20 text-left text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
							<th className="pb-2 pr-3">Fecha</th>
							<th className="pb-2 pr-3">Ref. banco</th>
							<th className="pb-2 pr-3">Descripción</th>
							<th className="pb-2 pr-3 text-right">Banco</th>
							<th className="pb-2 pr-3 text-right">Libro</th>
							<th className="pb-2 pr-3 text-right">Diferencia</th>
							<th className="pb-2">Estado</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((row) => {
							const cfg = statusConfig[row.status];
							const Icon = cfg.icon;
							return (
								<tr
									key={row.id}
									className={cn(
										"border-b border-border/10 transition-colors hover:bg-foreground/[0.02]",
										row.status === "MISMATCH" &&
											"bg-[var(--premium-danger)]/[0.02]",
									)}
								>
									<td className="py-2 pr-3 font-mono text-foreground">
										{row.date}
									</td>
									<td className="py-2 pr-3 font-mono text-foreground/70">
										{row.bankRef}
									</td>
									<td className="py-2 pr-3 text-foreground/80">
										{row.description}
									</td>
									<td className="py-2 pr-3 text-right font-mono text-foreground">
										{formatMoney(row.bankAmount)}
									</td>
									<td className="py-2 pr-3 text-right font-mono text-foreground">
										{formatMoney(row.ledgerAmount)}
									</td>
									<td
										className={cn(
											"py-2 pr-3 text-right font-mono",
											row.difference === 0
												? "text-[var(--premium-success)]"
												: "text-[var(--premium-danger)]",
										)}
									>
										{row.difference === 0
											? "—"
											: formatMoney(Math.abs(row.difference))}
									</td>
									<td className="py-2">
										<span
											className={cn(
												"inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-semibold",
												cfg.bg,
												cfg.color,
											)}
										>
											<Icon size={10} />
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

registerArtifact("banking_reconciliation", BankingReconciliationArtifact);
