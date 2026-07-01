import { TrendingDown } from "lucide-react";

interface PricingInsightProps {
	companiesCount: number;
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
}

export function PricingInsights({
	companiesCount,
	pricing,
	savings,
}: PricingInsightProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div className=" bg-surface-2 border border-stroke-2 rounded-2xl p-6">
				<div className="flex items-center gap-3">
					<TrendingDown className="h-10 w-10 text-info" />
					<div>
						<h3 className="text-sm font-black text-info uppercase tracking-wider">
							Ahorro Mensual
						</h3>
						<p className="text-4xl font-mono font-bold text-foreground mt-1">
							S/ {savings.vsConcar.toFixed(2)}
						</p>
						<p className="text-sm text-muted-foreground mt-1">
							vs CONCAR • {savings.percentConcar}% menos
						</p>
					</div>
				</div>
			</div>

			<div className=" bg-card/80 border border-border rounded-2xl p-6">
				<h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4">
					Comparacion de Precios ({companiesCount} RUCs)
				</h3>

				<div className="space-y-3">
					<div className="flex justify-between items-center">
						<span className="text-xs text-muted-foreground">CONCAR</span>
						<span className="text-xl font-mono font-bold text-muted-foreground line-through">
							S/ {pricing.concar.toFixed(2)}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-xs text-muted-foreground">DORA</span>
						<span className="text-xl font-mono font-bold text-muted-foreground line-through">
							S/ {pricing.dora.toFixed(2)}
						</span>
					</div>
					<div className="flex justify-between items-center pt-2 border-t border-border">
						<span className="text-xs text-info font-bold">ARKELYTHEX</span>
						<span className="text-2xl font-mono font-bold text-info">
							S/ {pricing.arkelythex.toFixed(2)}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
