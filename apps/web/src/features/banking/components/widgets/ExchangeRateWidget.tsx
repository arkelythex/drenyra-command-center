import { RefreshCw } from "lucide-react";

export const ExchangeRateWidget = () => {
	return (
		<div className="space-y-3 border-y border-[var(--border-subtle)] px-2 py-4">
			<div className="flex items-center justify-between">
				<span className="text-label font-bold text-[var(--text-tertiary)] uppercase tracking-[0.3em]">
					Tipo de Cambio
				</span>
				<button className="ui-card-surface flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
					<RefreshCw size={10} />
				</button>
			</div>
			<div className="ui-card-surface flex items-center gap-6 rounded-2xl px-4 py-3">
				<div className="flex flex-col gap-1">
					<span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
						Compra
					</span>
					<span className="font-mono text-sm font-bold text-[var(--text-primary)] tabular-nums tracking-tighter">
						3.742
					</span>
				</div>
				<div className="w-px h-6 bg-border/50" />
				<div className="flex flex-col gap-1">
					<span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
						Venta
					</span>
					<span className="font-mono text-sm font-bold text-[var(--text-primary)] tabular-nums tracking-tighter">
						3.751
					</span>
				</div>
			</div>
		</div>
	);
};
