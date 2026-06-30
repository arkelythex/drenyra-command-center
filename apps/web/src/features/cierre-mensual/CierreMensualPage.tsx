import { useFiscalInspector } from "@/context/FiscalInspectorContext";
import { ChecklistPanel } from "./components/ChecklistPanel";
import { ProgressHeader } from "./components/ProgressHeader";
import { SidePanel } from "./components/SidePanel";
import { useCierreMensual } from "./hooks/useCierreMensual";

export function CierreMensualPage() {
	const { data: cierre, isLoading, isError } = useCierreMensual();
	const { open: openInspector } = useFiscalInspector();

	if (isLoading || !cierre) {
		return (
			<div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)] p-10 text-xs text-[var(--text-tertiary)]">
				{isError
					? "No se pudo cargar el cierre mensual."
					: "Cargando cierre mensual…"}
			</div>
		);
	}

	const progress = cierre.progress;
	const completedCount = cierre.checklist.filter((c) => c.completado).length;
	const totalCount = cierre.checklist.length;

	const handleOpenInspector = () =>
		openInspector({
			traceId: cierre.id,
			summary: `Cierre Mensual ${cierre.periodo} — ${cierre.companyName}`,
			status: "PROPOSED",
			riskLevel: cierre.globalRiskLevel,
			impact: "Cierre fiscal mensual",
			proposedBy: "system",
			requiresApproval: true,
			module: "cierre",
			companyRuc: cierre.companyRuc,
			createdAt: cierre.startedAt,
			evidence: [],
			requiredApprovers: Object.keys(cierre.firmas),
			agentAnalysis: cierre.agentAnalysis
				? {
						agentId: cierre.agentAnalysis.agentId,
						agentName: cierre.agentAnalysis.agentName,
						confidence: cierre.agentAnalysis.confidence,
						proposal: cierre.agentAnalysis.summary,
						rationale: cierre.agentAnalysis.recommendations.join("; "),
						detectedAt: cierre.startedAt,
						risks:
							cierre.agentAnalysis.discrepancies > 0
								? ["Discrepancias detectadas"]
								: [],
					}
				: undefined,
		});

	return (
		<div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)]">
			<div className="mx-auto w-full max-w-[1200px] p-4 sm:p-6 lg:p-10">
				<div className="min-w-0 space-y-8">
					<ProgressHeader
						companyName={cierre.companyName}
						companyRuc={cierre.companyRuc}
						periodo={cierre.periodo}
						completedCount={completedCount}
						totalCount={totalCount}
						progress={progress}
					/>

					<div className="grid gap-8 lg:grid-cols-[1fr_360px]">
						<ChecklistPanel checklist={cierre.checklist} />
						<SidePanel cierre={cierre} onOpenInspector={handleOpenInspector} />
					</div>
				</div>
			</div>
		</div>
	);
}
