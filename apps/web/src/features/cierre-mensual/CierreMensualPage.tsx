import { useState } from "react";
import type { CierreMensual } from "@arkelythex/domain";
import {
	buildDefaultCierreChecklist,
	calculateCierreProgress,
} from "@arkelythex/domain";
import { useFiscalInspector } from "@/context/FiscalInspectorContext";
import { ProgressHeader } from "./components/ProgressHeader";
import { ChecklistPanel } from "./components/ChecklistPanel";
import { SidePanel } from "./components/SidePanel";

const MOCK_CIERRE: CierreMensual = {
	id: "CIERRE-2026-04-20123456789",
	companyRuc: "20123456789",
	companyName: "Arkelythex Consulting SAC",
	periodo: "2026-04",
	status: "EN_PROCESO",
	startedAt: "2026-04-28T08:00:00Z",
	expedienteId: "EXP-2026-001",
	progress: calculateCierreProgress(
		buildDefaultCierreChecklist("EXP-2026-001").map((item, i) => ({
			...item,
			completado: i < 4,
			evidencia:
				i < 4
					? [
							{
								id: `ev-${i}`,
								kind: "PDF",
								label: `Evidencia paso ${i + 1}`,
								hash: `0x${i}a1b2c3`,
								verified: true,
								attachedAt: "2026-04-28T10:00:00Z",
							},
						]
					: [],
		})),
	),
	checklist: buildDefaultCierreChecklist("EXP-2026-001").map((item, i) => ({
		...item,
		completado: i < 4,
		evidencia:
			i < 4
				? [
						{
							id: `ev-${i}`,
							kind: "PDF",
							label: `Evidencia paso ${i + 1}`,
							hash: `0x${i}a1b2c3`,
							verified: true,
							attachedAt: "2026-04-28T10:00:00Z",
						},
					]
				: [],
	})),
	agentAnalysis: {
		agentId: "validador",
		agentName: "Validador SUNAT",
		confidence: 0.94,
		summary:
			"4 de 10 pasos completados. Conciliación bancaria OK. SIRE Compras sin discrepancias. IGV validado.",
		discrepancies: 0,
		recommendations: [
			"Completar SIRE Ventas antes de las firmas",
			"Adjuntar CDR de comprobantes electrónicos",
		],
	},
	firmas: {
		contador: { firmado: false },
		revisor: { firmado: false },
		representante: { firmado: false },
	},
	sireStatus: "CONCILIADO",
	bancosStatus: "CONCILIADO",
	igvStatus: "VALIDADO",
	globalRiskLevel: "LOW",
};

export function CierreMensualPage() {
	const [cierre] = useState<CierreMensual>(MOCK_CIERRE);
	const { open: openInspector } = useFiscalInspector();
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
						<SidePanel
							cierre={cierre}
							onOpenInspector={handleOpenInspector}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
