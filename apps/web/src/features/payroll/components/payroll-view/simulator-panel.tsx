import { Banknote, Calculator, Users } from "lucide-react";

interface PayrollSimulatorPanelProps {
	backdropClassName: string;
	cardRadius: string;
	projectedTax: number;
	onProjectedTaxChange: (value: number) => void;
}

export function PayrollSimulatorPanel({
	backdropClassName,
	cardRadius,
	projectedTax,
	onProjectedTaxChange,
}: PayrollSimulatorPanelProps) {
	return (
		<div className="flex-1 flex flex-col gap-8">
			<div
				className={`bg-card border border-border/50 shadow-xl p-8 relative overflow-hidden ${backdropClassName}`}
				style={{ borderRadius: cardRadius }}
			>
				<div className="flex items-center gap-4 mb-8">
					<div className="p-3 bg-foreground/10 rounded-2xl border border-foreground/10 text-foreground">
						<Calculator size={20} />
					</div>
					<div>
						<h3 className="text-sm font-black uppercase tracking-widest text-foreground">
							Simulador 5ta Categoria
						</h3>
						<p className="text-label font-bold text-muted-foreground uppercase opacity-60 tracking-wider">
							Proyeccion Anual 2026
						</p>
					</div>
				</div>

				<div className="space-y-8">
					<div className="space-y-4">
						<div className="flex justify-between text-xs font-bold uppercase tracking-wide">
							<span className="text-muted-foreground">Ingresos Proyectados</span>
							<span className="font-mono font-black text-foreground text-sm">
								S/ {(projectedTax * 12).toLocaleString()}
							</span>
						</div>
						<div className="relative h-2 bg-muted/20 rounded-full overflow-hidden">
							<div
								className="absolute h-full bg-foreground rounded-full"
								style={{ width: `${(projectedTax / 50000) * 100}%` }}
							/>
						</div>
						<input
							aria-label="Rango salarial"
							type="range"
							min="10000"
							max="50000"
							step="500"
							className="w-full absolute opacity-0 cursor-pointer -mt-4 h-6"
							onChange={(event) =>
								onProjectedTaxChange(parseInt(event.target.value, 10))
							}
						/>
					</div>

					<div className="p-6 rounded-2xl bg-gradient-to-br from-foreground/5 to-transparent border border-foreground/10 space-y-4 shadow-inner">
						<div className="flex justify-between items-center pb-4 border-b border-foreground/10">
							<span className="text-label font-black uppercase tracking-widest text-muted-foreground">
								Impuesto Anual
							</span>
							<span className="text-base font-black font-mono text-foreground">
								S/ {(projectedTax * 0.14).toLocaleString()}
							</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-label font-black uppercase tracking-widest text-muted-foreground">
								Retencion Mensual
							</span>
							<span className="text-2xl font-black font-mono text-foreground drop-shadow-sm">
								S/ {Math.round((projectedTax * 0.14) / 12).toLocaleString()}
							</span>
						</div>
					</div>

					<p className="text-label text-muted-foreground/60 leading-relaxed font-medium border-l-2 border-foreground/20 pl-3">
						* Calculo referencial basado en 7 UIT (2026). Drenyra ajusta automaticamente las retenciones mes a mes para evitar multas de SUNAT.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div
					className={`p-6 bg-card border border-border/50 flex flex-col justify-between h-40 hover:bg-card/80 transition-colors group ${backdropClassName}`}
					style={{ borderRadius: cardRadius }}
				>
					<div className="h-10 w-10 rounded-xl bg-muted/20 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
						<Users size={20} />
					</div>
					<div>
						<p className="text-label font-black uppercase tracking-widest text-muted-foreground mb-1">
							Headcount
						</p>
						<p className="text-3xl font-black text-foreground">42</p>
					</div>
				</div>
				<div
					className={`p-6 bg-card border border-border/50 flex flex-col justify-between h-40 hover:bg-card/80 transition-colors group ${backdropClassName}`}
					style={{ borderRadius: cardRadius }}
				>
					<div className="h-10 w-10 rounded-xl bg-[rgba(var(--premium-success-rgb),0.10)] flex items-center justify-center text-[var(--premium-success)]">
						<Banknote size={20} />
					</div>
					<div>
						<p className="text-label font-black uppercase tracking-widest text-muted-foreground mb-1">
							Planilla Total
						</p>
						<p className="text-3xl font-black text-foreground tracking-tighter">185k</p>
					</div>
				</div>
			</div>
		</div>
	);
}
