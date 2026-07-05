import { BarChart4, Factory } from "lucide-react";

export const CostStructure = () => {
	return (
		<div
			className="bg-card border border-border/40 shadow-sm p-8 overflow-hidden relative"
			style={{ borderRadius: "2rem" }}
		>
			<h3 className="text-sm font-black tracking-wide text-foreground mb-8 flex items-center gap-3">
				<Factory size={18} className="text-muted-foreground" />
				Estructura de Costos
			</h3>

			<div className="space-y-8 relative z-10">
				<div className="space-y-3">
					<div className="flex justify-between text-label font-black text-muted-foreground uppercase tracking-widest">
						<span>Materiales Directos</span>
					</div>
					<div className="flex items-center gap-4">
						<div className="h-3 w-full bg-muted/20 rounded-full overflow-hidden flex-1 border border-border/10">
							<div className="h-full bg-primary/90 w-[65%] shadow-sm" />
						</div>
						<span className="text-xs font-black text-foreground tabular-nums w-10 text-right font-mono">
							65%
						</span>
					</div>
				</div>
				<div className="space-y-3">
					<div className="flex justify-between text-label font-black text-muted-foreground uppercase tracking-widest">
						<span>Mano de Obra Directa</span>
					</div>
					<div className="flex items-center gap-4">
						<div className="h-3 w-full bg-muted/20 rounded-full overflow-hidden flex-1 border border-border/10">
							<div className="h-full w-[25%] bg-muted-foreground/45" />
						</div>
						<span className="text-xs font-black text-foreground tabular-nums w-10 text-right font-mono">
							25%
						</span>
					</div>
				</div>
				<div className="space-y-3">
					<div className="flex justify-between text-label font-black text-muted-foreground uppercase tracking-widest">
						<span>CIF (Indirectos)</span>
					</div>
					<div className="flex items-center gap-4">
						<div className="h-3 w-full bg-muted/20 rounded-full overflow-hidden flex-1 border border-border/10">
							<div className="h-full bg-muted-foreground/40 w-[10%]" />
						</div>
						<span className="text-xs font-black text-foreground tabular-nums w-10 text-right font-mono">
							10%
						</span>
					</div>
				</div>
			</div>

			<div className="mt-10 pt-8 border-t border-border/10">
				<div className="flex items-center justify-between mb-3">
					<p className="text-label font-black text-muted-foreground uppercase tracking-widest">
						Margen Bruto Promedio
					</p>
					<span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-black uppercase border border-primary/20 shadow-sm">
						+2.4% vs Objetivo
					</span>
				</div>
				<p className="text-4xl font-black text-foreground tracking-tighter drop-shadow-sm tabular-nums">
					32.8%
				</p>
			</div>

			<div className="absolute -bottom-10 -right-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
				<BarChart4 size={240} />
			</div>
		</div>
	);
};
