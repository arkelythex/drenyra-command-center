import type React from "react";
/**
 * SavingsCalculator Component
 * Displays cost comparison vs competitors
 */

import { TrendingDown } from "lucide-react";

interface SavingsCalculatorProps {
	pricing: {
		arkelythex: number;
		concar: number;
		dora: number;
	};
	savings: {
		vsConcar: number;
		vsDora: number;
		percentConcar: number;
	};
	companiesCount: number;
}

export const SavingsCalculator: React.FC<SavingsCalculatorProps> = ({
	pricing,
	savings,
	companiesCount,
}) => {
	return (
		<div className="space-y-6">
			{/* Savings Hero Card */}
			<div className=" bg-surface-2 border border-stroke-2 rounded-2xl p-6">
				<div className="flex items-center gap-3">
					<TrendingDown className="h-8 w-8 text-info" />
					<div>
						<h3 className="text-lg font-black text-info uppercase tracking-wider">
							Ahorro Mensual
						</h3>
						<p className="text-3xl font-mono font-bold text-foreground mt-1">
							S/ {savings.vsConcar.toFixed(2)}
						</p>
						<p className="text-sm text-muted-foreground mt-1">
							vs CONCAR • {savings.percentConcar}% menos
						</p>
					</div>
				</div>
			</div>

			{/* Pricing Comparison Table */}
			<div className=" bg-card/80 border border-border rounded-2xl p-6">
				<h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-4">
					Comparación de Precios
				</h3>

				<div className="grid grid-cols-3 gap-4">
					{/* CONCAR */}
					<div className=" bg-surface-3 border border-stroke-1 rounded-xl p-4">
						<p className="text-xs text-muted-foreground mb-1">CONCAR</p>
						<p className="text-xs text-muted-foreground mb-2">
							S/ 300 × {companiesCount} RUCs
						</p>
						<p className="text-2xl font-mono font-bold text-muted-foreground line-through">
							S/ {pricing.concar.toFixed(2)}
						</p>
					</div>

					{/* DORA */}
					<div className=" bg-surface-3 border border-stroke-1 rounded-xl p-4">
						<p className="text-xs text-muted-foreground mb-1">DORA</p>
						<p className="text-xs text-muted-foreground mb-2">
							S/ 150 × {companiesCount} RUCs
						</p>
						<p className="text-2xl font-mono font-bold text-muted-foreground line-through">
							S/ {pricing.dora.toFixed(2)}
						</p>
					</div>

					{/* ARKELYTHEX */}
					<div className=" bg-surface-2 border-2 border-info-subtle rounded-xl p-4 relative">
						<div className="absolute -top-2 right-2 bg-info text-[var(--color-text-inverse)] text-xs font-black px-2 py-1 rounded">
							TÚ
						</div>
						<p className="text-xs text-muted-foreground mb-1">ARKELYTHEX</p>
						<p className="text-xs text-muted-foreground mb-2">
							RUCs ilimitados
						</p>
						<p className="text-2xl font-mono font-bold text-info">
							S/ {pricing.arkelythex.toFixed(2)}
						</p>
					</div>
				</div>

				{/* Annual Savings Callout */}
				<div className="mt-6  bg-surface-2 border border-stroke-2 rounded-xl p-4">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-xs text-muted-foreground">Ahorro Anual</p>
							<p className="text-xl font-mono font-bold text-info">
								S/ {(savings.vsConcar * 12).toFixed(2)}
							</p>
						</div>
						<div className="text-right">
							<p className="text-xs text-muted-foreground">vs CONCAR</p>
							<p className="text-2xl font-black text-info">
								{savings.percentConcar}%
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
