import { AlertTriangle, BarChart3, Scan, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const RiskMapTab = () => {
	return (
		<div className="space-y-8 animate-entrance pb-20">
			<div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
				<RiskMetric label="Exposición Fiscal" value="MODERADA" score="28%" />
				<RiskMetric label="Prob. Auditoría" value="BAJA" score="15%" />
				<RiskMetric
					label="Crédito en Riesgo"
					value="S/ 8,670"
					score="ALTA"
					alert
				/>
				<RiskMetric label="Compliance Score" value="94.7%" score="BUENO" />
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
				<Card className="lg:col-span-7 border-border/40 shadow-sm">
					<CardHeader>
						<CardTitle className="flex items-center gap-3">
							<Scan size={16} className="text-muted-foreground" /> Matriz de
							Probabilidades (IA)
						</CardTitle>
					</CardHeader>
					<CardContent className="p-10">
						<div className="group flex aspect-video w-full cursor-crosshair items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/10 transition-colors duration-200 hover:bg-muted/20">
							<div className="text-center">
								<BarChart3
									size={40}
									className="mx-auto mb-4 text-muted-foreground/60 transition-colors duration-200 group-hover:text-foreground"
								/>
								<p className="text-label font-black uppercase tracking-[0.3em] text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
									Calculando Mapa de Calor...
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="lg:col-span-5 space-y-6">
					<div className="grid grid-cols-2 gap-4">
						<div className="rounded-2xl border border-border/40 bg-card/50 p-4 shadow-sm">
							<div className="flex items-center gap-2 mb-2">
								<ShieldCheck size={14} className="text-success" />
								<span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
									Cumplimiento
								</span>
							</div>
							<p className="text-lg font-black text-foreground">94.7%</p>
							<p className="text-2xs text-muted-foreground uppercase tracking-wider">
								Score Global
							</p>
						</div>
						<div className="rounded-2xl border border-border/40 bg-card/50 p-4 shadow-sm">
							<div className="flex items-center gap-2 mb-2">
								<BarChart3 size={14} className="text-info" />
								<span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
									Documentos
								</span>
							</div>
							<p className="text-lg font-black text-foreground">2,341</p>
							<p className="text-2xs text-muted-foreground uppercase tracking-wider">
								Procesados
							</p>
						</div>
					</div>

					<h3 className="text-label font-black text-muted-foreground uppercase tracking-[0.2em] px-2 mb-4">
						Alertas de Auditoría Proactiva
					</h3>
					<RiskItem
						category="Margen de Utilidad"
						desc="Tu margen difiere en un 15% del promedio del sector (G4649)."
						critical
					/>
					<RiskItem
						category="Gastos de Representación"
						desc="Estás al 92% del límite anual deducible (0.5% de ingresos netos)."
					/>
					<RiskItem
						category="Saldo a Favor"
						desc="Existen S/ 12,000 sin aplicar del periodo 2024-12."
					/>
					<RiskItem
						category="Comprobantes Anómalos"
						desc="3 facturas presentan montos superiores al promedio histórico en 45%."
						critical
					/>
					<RiskItem
						category="IVA por Pagar"
						desc="Acumulado de IVA por pagar supera los S/ 25,000 (revisa período 2025-01)."
					/>
					<RiskItem
						category="Proveedores Recurrentes"
						desc="5 proveedores generan el 68% de tus gastos mensuales (riesgo de concentración)."
					/>
					<RiskItem
						category="Detracciones Pendientes"
						desc="6 detracciones por S/ 4,200 aún no depositadas en Banco de la Nación."
						critical
					/>
					<RiskItem
						category="Contratos de Servicios"
						desc="2 contratos de servicios requieren renovación antes del 15 de febrero."
					/>
					<RiskItem
						category="Pago de Nómina"
						desc="Próximo pago de planilla vence el 28 de enero (S/ 45,000)."
					/>
				</div>
			</div>
		</div>
	);
};

interface RiskMetricProps {
	label: string;
	value: string;
	score: string;
	alert?: boolean;
}

const RiskMetric = ({ label, value, score, alert }: RiskMetricProps) => (
	<Card
		className={cn(
			alert
				? "bg-foreground/10 border-foreground/30 shadow-sm"
				: "bg-card border-border/50 shadow-sm",
		)}
	>
		<CardContent className="p-8">
			<p
				className={cn(
					"text-3xs font-black uppercase tracking-widest mb-4",
					alert ? "text-foreground opacity-80" : "text-muted-foreground",
				)}
			>
				{label}
			</p>
			<div className="flex items-baseline justify-between">
				<p className="text-3xl font-black font-mono tracking-tighter tabular-nums text-foreground">
					{value}
				</p>
				<span
					className={cn(
						"text-2xs font-black px-2 py-0.5 rounded border uppercase tracking-widest",
						alert
							? "bg-foreground text-background border-foreground"
							: "bg-muted/30 text-foreground border-border/50",
					)}
				>
					{score}
				</span>
			</div>
		</CardContent>
	</Card>
);

interface RiskItemProps {
	category: string;
	desc: string;
	critical?: boolean;
}

const RiskItem = ({ category, desc, critical }: RiskItemProps) => (
	<div
		className={cn(
			"group flex items-start gap-5 rounded-2xl border p-5 transition-[background-color,border-color] duration-200",
			critical
				? "bg-foreground/5 border-foreground/20 hover:bg-foreground/10"
				: "bg-muted border-border/50 hover:bg-muted/95 hover:border-border",
		)}
	>
		<div
			className={cn(
				"shrink-0 rounded-xl border p-2.5 transition-colors duration-200",
				critical
					? "bg-foreground text-background border-foreground shadow-sm"
					: "bg-muted/30 border-border text-muted-foreground group-hover:text-foreground",
			)}
		>
			<AlertTriangle size={18} strokeWidth={2} />
		</div>
		<div>
			<p className="font-black text-xs uppercase tracking-tight mb-1 text-foreground">
				{category}
			</p>
			<p
				className={cn(
					"text-label font-medium leading-relaxed",
					critical ? "text-foreground/80" : "text-muted-foreground",
				)}
			>
				{desc}
			</p>
		</div>
	</div>
);
