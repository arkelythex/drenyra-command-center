import type React from "react";
import { lazy, Suspense, useEffect, useState } from "react";
import { ChartSkeleton, DashboardCardSkeleton } from "@/components/ui/skeleton";
import { DashboardOverviewStrip } from "../DashboardOverviewStrip";
import { AgentLiveStatus } from "../widgets/AgentLiveStatus";
import { DashboardAdvancedPanel } from "./DashboardAdvancedPanel";
import { RiskExecutiveSummary } from "./RiskExecutiveSummary";

const LiquidityChart = lazy(() =>
	import("../widgets/LiquidityChart").then((m) => ({
		default: m.LiquidityChart,
	})),
);
const FiscalHealthWidget = lazy(() =>
	import("../FiscalHealthWidget").then((m) => ({
		default: m.FiscalHealthWidget,
	})),
);
const ProcessedDocumentsWidget = lazy(() =>
	import("../widgets/ProcessedDocumentsWidget").then((m) => ({
		default: m.ProcessedDocumentsWidget,
	})),
);

interface SummaryTabContentProps {
	riskExposure: number;
	complianceScore: number;
	growthDelta: number;
	decisionStatusLabel: string;
	showDecisionGate: boolean;
	setShowDecisionGate: React.Dispatch<React.SetStateAction<boolean>>;
	showAdvancedPanel: boolean;
	setShowAdvancedPanel: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SummaryTabContent: React.FC<SummaryTabContentProps> = (props) => {
	const [showDeferredWidgets, setShowDeferredWidgets] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const timeoutId = globalThis.setTimeout(
			() => setShowDeferredWidgets(true),
			120,
		);
		return () => globalThis.clearTimeout(timeoutId);
	}, []);

	return (
		<div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
			{/* --- SECCIÓN 1: RADAR DE KPIS --- */}
			<DashboardOverviewStrip />

			{/* --- SECCIÓN 2: GOBERNANZA Y RIESGO --- */}
			<RiskExecutiveSummary {...props} />

			{/* --- SECCIÓN 3: BENTO GRID OPERATIVO --- */}
			<div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
				{/* Flujo y Obligaciones */}
				<div className="xl:col-span-8 p-6 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-6">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<h3 className="text-sm font-bold text-primary">
								Flujo Proyectado y Obligaciones
							</h3>
							<p className="text-xs font-bold text-secondary/40 uppercase tracking-widest text-left">
								Pronóstico de liquidez vs vencimientos SUNAT
							</p>
						</div>
						<button className="text-xs font-bold text-info hover:underline">
							Ver Detalle
						</button>
					</div>
					{showDeferredWidgets ? (
						<Suspense fallback={<ChartSkeleton className="h-[300px]" />}>
							<LiquidityChart />
						</Suspense>
					) : (
						<ChartSkeleton className="h-[300px]" />
					)}
				</div>

				{/* Agentes y Salud */}
				<div className="xl:col-span-4 space-y-6">
					<AgentLiveStatus />
					{showDeferredWidgets ? (
						<Suspense fallback={<DashboardCardSkeleton />}>
							<FiscalHealthWidget />
						</Suspense>
					) : (
						<DashboardCardSkeleton />
					)}
				</div>
			</div>

			{/* --- SECCIÓN 4: FEED DE EVIDENCIA --- */}
			<div className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-6">
				<div className="flex items-center justify-between">
					<div className="space-y-0.5">
						<h3 className="text-sm font-bold text-primary">
							Feed de Evidencia Reciente
						</h3>
						<p className="text-xs font-bold text-secondary/40 uppercase tracking-widest text-left">
							Últimos documentos validados por el motor de cumplimiento
						</p>
					</div>
					<button className="px-3 py-1.5 rounded-lg border border-gray-100 text-xs font-bold text-secondary hover:bg-gray-50 transition-all text-left">
						Explorar Todo
					</button>
				</div>
				{showDeferredWidgets ? (
					<Suspense fallback={<DashboardCardSkeleton className="h-[200px]" />}>
						<ProcessedDocumentsWidget />
					</Suspense>
				) : (
					<DashboardCardSkeleton className="h-[200px]" />
				)}
			</div>

			<DashboardAdvancedPanel
				showAdvancedPanel={props.showAdvancedPanel}
				setShowAdvancedPanel={props.setShowAdvancedPanel}
			/>
		</div>
	);
};
