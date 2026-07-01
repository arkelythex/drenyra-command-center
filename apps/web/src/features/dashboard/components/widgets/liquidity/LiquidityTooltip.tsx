import { cn } from "@/lib/utils";
import {
	type LiquidityTooltipProps,
	PEN_FORMATTER,
	PERCENT_FORMATTER,
} from "./liquidity-chart.constants";

export function LiquidityTooltip({
	active,
	label,
	payload,
}: LiquidityTooltipProps) {
	if (!active || !payload || payload.length === 0) return null;

	const dataPoint = payload[0]?.payload;
	if (!dataPoint) return null;

	return (
		<div className="animate-in fade-in-0 min-w-[280px] rounded-2xl border border-border/60 bg-[var(--surface-1)]/96 p-6 shadow-xl  duration-150 ring-1 ring-border/40">
			<div className="space-y-6">
				<div>
					<p className="mb-1 text-2xs font-black uppercase tracking-[0.3em] text-muted-foreground">
						Periodo
					</p>
					<h4 className="text-2xl font-black tracking-tight text-foreground">
						{label} 2026
					</h4>
				</div>

				<div className="space-y-4">
					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
							<span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
								Proyectado
							</span>
						</div>
						<span className="font-mono text-2xl font-black tracking-tighter text-foreground">
							{PEN_FORMATTER.format(dataPoint.projected)}
						</span>
					</div>

					<div className="flex flex-col gap-1">
						<div className="flex items-center gap-2">
							<div className="h-2 w-2 rounded-full bg-primary/80" />
							<span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
								Flujo Real
							</span>
						</div>
						<span className="font-mono text-2xl font-black tracking-tighter text-foreground">
							{PEN_FORMATTER.format(dataPoint.cash)}
						</span>
					</div>
				</div>

				<div className="flex items-center justify-between border-t border-border pt-4">
					<span className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground">
						Desviación
					</span>
					<span
						className={cn(
							"text-xs font-black font-mono",
							dataPoint.deltaPct >= 0 ? "text-success" : "text-danger",
						)}
					>
						{dataPoint.deltaPct >= 0 ? "+" : ""}
						{PERCENT_FORMATTER.format(dataPoint.deltaPct)}%
					</span>
				</div>
			</div>
		</div>
	);
}
