import type { HubArtifact } from "@drenyra/shared/artifacts";
import { Users } from "lucide-react";
import { tokensToClasses } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { registerArtifact } from "../artifact-registry";

type PayrollSummaryArt = Extract<HubArtifact, { type: "payroll_summary" }>;

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
		PAID: {
			color: "text-[var(--premium-success)]",
			bg: "bg-[var(--premium-success)]/10",
			label: "Pagado",
		},
		PENDING: {
			color: "text-[var(--premium-warning)]",
			bg: "bg-[var(--premium-warning)]/10",
			label: "Pendiente",
		},
		PROCESSING: {
			color: "text-[var(--accent)]",
			bg: "bg-[var(--accent)]/10",
			label: "Procesando",
		},
	};

export const PayrollSummaryArtifact: React.FC<{
	artifact: PayrollSummaryArt;
}> = ({ artifact }) => {
	const { employees, summary, period } = artifact.payload;

	return (
		<div
			className={cn(
				tokensToClasses.borderRadius("card"),
				"mt-6 border border-border/40 bg-foreground/[0.03] p-6",
			)}
		>
			<header className="mb-5 flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-background/60">
					<Users size={18} />
				</div>
				<div>
					<h4 className="text-sm font-black uppercase tracking-tight text-foreground">
						{artifact.title}
					</h4>
					<p className="text-2xs uppercase tracking-widest text-muted-foreground">
						Periodo {period} · {summary.employeeCount} empleados
					</p>
				</div>
			</header>

			{/* Summary */}
			<div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div className="rounded-xl border border-border/25 bg-background/40 p-3">
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Total salarios
					</p>
					<p className="mt-1 text-sm font-bold text-foreground">
						{formatMoney(summary.totalSalaries)}
					</p>
				</div>
				<div className="rounded-xl border border-border/25 bg-background/40 p-3">
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Deducciones
					</p>
					<p className="mt-1 text-sm font-bold text-[var(--premium-danger)]">
						-{formatMoney(summary.totalDeductions)}
					</p>
				</div>
				<div className="rounded-xl border border-border/25 bg-background/40 p-3">
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Neto a pagar
					</p>
					<p className="mt-1 text-sm font-bold text-[var(--premium-success)]">
						{formatMoney(summary.totalNetPay)}
					</p>
				</div>
				<div className="rounded-xl border border-border/25 bg-background/40 p-3">
					<p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
						Procesados
					</p>
					<p className="mt-1 text-sm font-bold text-foreground">
						{summary.processedCount}/{summary.employeeCount}
					</p>
				</div>
			</div>

			{/* Table */}
			<div className="overflow-x-auto">
				<table className="w-full text-xs">
					<thead>
						<tr className="border-b border-border/20 text-left text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
							<th className="pb-2 pr-3">Empleado</th>
							<th className="pb-2 pr-3">Cargo</th>
							<th className="pb-2 pr-3 text-right">Base</th>
							<th className="pb-2 pr-3 text-right">Bonos</th>
							<th className="pb-2 pr-3 text-right">Deducciones</th>
							<th className="pb-2 pr-3 text-right">Neto</th>
							<th className="pb-2">Estado</th>
						</tr>
					</thead>
					<tbody>
						{employees.map((emp) => {
							const cfg = statusConfig[emp.status];
							return (
								<tr
									key={emp.employeeId}
									className="border-b border-border/10 transition-colors hover:bg-foreground/[0.02]"
								>
									<td className="py-2 pr-3 font-medium text-foreground">
										{emp.name}
									</td>
									<td className="py-2 pr-3 text-foreground/70">{emp.position}</td>
									<td className="py-2 pr-3 text-right font-mono text-foreground">
										{formatMoney(emp.baseSalary)}
									</td>
									<td className="py-2 pr-3 text-right font-mono text-foreground">
										{emp.bonus ? formatMoney(emp.bonus) : "—"}
									</td>
									<td className="py-2 pr-3 text-right font-mono text-[var(--premium-danger)]">
										{formatMoney(emp.deductions)}
									</td>
									<td className="py-2 pr-3 text-right font-mono font-bold text-[var(--premium-success)]">
										{formatMoney(emp.netSalary)}
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

registerArtifact("payroll_summary", PayrollSummaryArtifact);
