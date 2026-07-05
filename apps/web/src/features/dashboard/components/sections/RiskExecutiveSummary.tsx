import { Clock3, Fingerprint } from "lucide-react";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { cn, formatPEN } from "@/lib/utils";

interface RiskExecutiveSummaryProps {
	riskExposure: number;
	complianceScore: number;
	decisionStatusLabel: string;
	showDecisionGate: boolean;
	setShowDecisionGate: (val: boolean) => void;
}

export const RiskExecutiveSummary: React.FC<RiskExecutiveSummaryProps> = ({
	riskExposure,
	complianceScore,
	decisionStatusLabel,
	showDecisionGate,
	setShowDecisionGate,
}) => {
	const complianceIsCritical = complianceScore < 80;

	return (
		<section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
			{/* --- REVISIÓN HUMANA (Contrato Moral) --- */}
			<div className="lg:col-span-8 p-6 rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col gap-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100/50">
							<Fingerprint size={20} strokeWidth={2.5} />
						</div>
						<div className="space-y-0.5">
							<h3 className="text-sm font-bold text-primary uppercase tracking-tight text-left">
								Revisión Humana Obligatoria
							</h3>
							<p className="text-xs font-bold text-secondary/40 uppercase tracking-widest text-left">
								Aprobación pendiente de cierre mensual
							</p>
						</div>
					</div>
					<Badge
						className={cn(
							"px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-widest border-none shadow-none",
							complianceIsCritical
								? "bg-orange-50 text-orange-700"
								: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
						)}
					>
						{complianceIsCritical ? "Acción Requerida" : "Gobernanza OK"}
					</Badge>
				</div>

				<div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1 text-left">
						<span className="text-xs font-bold text-secondary/40 uppercase tracking-widest italic">
							Estado de Autonomía
						</span>
						<p className="text-sm font-bold text-primary leading-tight">
							{decisionStatusLabel}
						</p>
					</div>
					<div className="p-4 rounded-2xl border border-gray-100 flex flex-col justify-center text-left">
						<span className="text-xs font-bold text-secondary/40 uppercase tracking-widest">
							Siguiente Acción Crítica
						</span>
						<p className="text-xs font-medium text-secondary mt-1">
							Validar conciliación bancaria BCP para el periodo 2026-05.
						</p>
					</div>
				</div>

				<div className="flex items-center gap-3 pt-2">
					<button
						onClick={() => setShowDecisionGate(!showDecisionGate)}
						className="flex-1 h-12 rounded-xl bg-[var(--surface-3)] text-[var(--text-primary)] font-bold text-xs hover:bg-black transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
					>
						{showDecisionGate
							? "Ingresar al Expediente de Cierre"
							: "Continuar Supervisión"}
					</button>
					<button className="px-4 h-12 rounded-xl border border-gray-100 hover:bg-gray-50 text-secondary transition-colors">
						<Clock3 size={18} />
					</button>
				</div>
			</div>

			{/* --- RADAR DE RIESGO TÉCNICO --- */}
			<div className="lg:col-span-4 p-6 rounded-2xl border border-gray-100 bg-[#F9F9FB]/50 space-y-6">
				<div className="space-y-1 text-left">
					<h3 className="text-xs font-bold text-primary uppercase tracking-wider italic">
						Métricas de Riesgo
					</h3>
					<p className="text-xs text-secondary/40 font-medium">
						Lectura en tiempo real de la consistencia fiscal.
					</p>
				</div>

				<div className="space-y-4 text-left">
					<RiskRow
						label="Exposición por Cobrar"
						value={riskExposure}
						formatter={(v) => formatPEN(v, 0)}
						risk="Medium"
					/>
					<RiskRow
						label="Compliance SUNAT"
						value={complianceScore}
						formatter={(v) => `${v}%`}
						risk={complianceIsCritical ? "High" : "Low"}
					/>
					<div className="pt-4 border-t border-gray-100 flex items-center justify-between">
						<span className="text-xs font-bold text-secondary/40 uppercase tracking-widest">
							Trazabilidad
						</span>
						<div className="flex -space-x-2">
							<div className="h-6 w-6 rounded-full border-2 border-white bg-[var(--accent)] flex items-center justify-center text-[8px] font-bold text-[var(--text-primary)] shadow-sm">
								IA
							</div>
							<div className="h-6 w-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] font-bold text-secondary shadow-sm">
								HC
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

function RiskRow({
	label,
	value,
	formatter,
	risk,
}: {
	label: string;
	value: number;
	formatter: (v: number) => string;
	risk: "Low" | "Medium" | "High";
}) {
	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between">
				<span className="text-xs font-bold text-secondary/60">{label}</span>
				<span
					className={cn(
						"text-xs font-black uppercase",
						risk === "High"
							? "text-red-500"
							: risk === "Medium"
								? "text-orange-500"
								: "text-[var(--color-success)]",
					)}
				>
					{risk}
				</span>
			</div>
			<div className="flex items-baseline justify-between">
				<span className="text-lg font-bold text-primary font-mono tracking-tighter tabular-nums">
					{formatter(value)}
				</span>
				<div className="h-1.5 w-16 bg-gray-100 rounded-full overflow-hidden">
					<div
						className={cn(
							"h-full rounded-full transition-all duration-500",
							risk === "High"
								? "bg-[var(--surface-danger)] w-[85%]"
								: risk === "Medium"
									? "bg-[var(--surface-warning)] w-[45%]"
									: "bg-[var(--surface-success)] w-[15%]",
						)}
					/>
				</div>
			</div>
		</div>
	);
}
