import { Link } from "@tanstack/react-router";
import {
	ArrowDownLeft,
	ArrowUpRight,
	Landmark,
	ShieldCheck,
} from "lucide-react";
import type React from "react";
import { Card } from "@/components/ui/card";
import { n } from "@/lib/utils";

export const DetraccionesWidget: React.FC = () => {
	const balance = 12_450;
	const monthlyIncome = 2_400;
	const monthlyPayments = 1_850;
	const usedRatio =
		balance > 0 ? Math.min(100, (monthlyPayments / balance) * 100) : 0;

	return (
		<Card className="rounded-2xl border border-border/50 bg-[var(--surface-1)]/84 p-5 shadow-sm">
			<div className="mb-4 flex items-start justify-between gap-3">
				<div>
					<p className="text-label font-semibold uppercase tracking-[0.14em] text-muted-foreground">
						Detracciones
					</p>
					<h3 className="mt-1 text-sm font-semibold tracking-tight text-foreground">
						Cuenta Banco de la Nacion
					</h3>
				</div>
				<Landmark
					size={16}
					className="text-muted-foreground"
					aria-hidden="true"
				/>
			</div>

			<div className="rounded-xl border border-border/50 bg-background/50 p-4">
				<p className="text-label uppercase tracking-wide text-muted-foreground">
					Saldo disponible
				</p>
				<p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
					{n(balance)}
				</p>

				<div className="mt-3">
					<div className="mb-1 flex items-center justify-between text-label text-muted-foreground">
						<span>Uso del saldo este mes</span>
						<span>{usedRatio.toFixed(1)}%</span>
					</div>
					<div className="h-2 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-foreground"
							style={{ width: `${usedRatio}%` }}
						/>
					</div>
				</div>
			</div>

			<div className="mt-4 grid grid-cols-2 gap-2">
				<div className="rounded-xl border border-border/50 bg-[var(--surface-2)]/42 p-3">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<ArrowDownLeft size={13} aria-hidden="true" />
						<span>Abonos mes</span>
					</div>
					<p className="mt-1 text-sm font-medium tabular-nums text-foreground">
						{n(monthlyIncome)}
					</p>
				</div>

				<div className="rounded-xl border border-border/50 bg-[var(--surface-2)]/42 p-3">
					<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<ArrowUpRight size={13} aria-hidden="true" />
						<span>Pagos SUNAT</span>
					</div>
					<p className="mt-1 text-sm font-medium tabular-nums text-foreground">
						{n(monthlyPayments)}
					</p>
				</div>
			</div>

			<div className="mt-4 flex items-center justify-between gap-2">
				<p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
					<ShieldCheck size={13} aria-hidden="true" />
					Fondos reservados para cumplimiento fiscal
				</p>
				<Link
					to="/tesoreria/banking"
					className="text-xs font-medium text-foreground hover:text-primary"
				>
					Ver banco
				</Link>
			</div>
		</Card>
	);
};
