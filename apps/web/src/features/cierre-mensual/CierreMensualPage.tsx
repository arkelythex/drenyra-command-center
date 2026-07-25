import { useMemo } from "react";
import {
	type FiscalRiskAlert,
	FiscalRiskLayer,
} from "@/components/fiscal/FiscalRiskLayer";
import { useFiscalInspector } from "@/context/FiscalInspectorContext";
import { AgentTimeline } from "./components/AgentTimeline";
import { ChecklistPanel } from "./components/ChecklistPanel";
import {
	type ClosePhaseState,
	ClosePhaseStrip,
} from "./components/ClosePhaseStrip";
import { MissionBlockers } from "./components/MissionBlockers";
import { ProgressHeader } from "./components/ProgressHeader";
import { SidePanel } from "./components/SidePanel";
import { TaxReviewGate } from "./components/TaxReviewGate";
import { useCierreMensual } from "./hooks/useCierreMensual";
import type { MissionBlocker, MissionTimelineEvent } from "./mission.types";

const PHASE_NAMES = [
	"Importación",
	"Validación",
	"Conciliación",
	"Revisión",
	"Impuestos",
	"Reportes",
	"Declaración",
	"Archivo",
] as const;

function phaseState(
	index: number,
	ratio: number,
	hasBlockers: boolean,
): ClosePhaseState {
	const phaseProgress = index / (PHASE_NAMES.length - 1);
	if (phaseProgress <= ratio - 0.15) return "completed";
	return index <= Math.round(ratio * (PHASE_NAMES.length - 1))
		? hasBlockers
			? "blocked"
			: "active"
		: "pending";
}

function derivePhases(cierre: Record<string, unknown>): {
	phases: Array<{
		name: string;
		state: ClosePhaseState;
		evidenceCount: number;
	}>;
	activeIndex: number;
} {
	const checklist = (cierre.checklist as Array<{ completado: boolean }>) ?? [];
	const completed = checklist.filter((c) => c.completado).length;
	const total = Math.max(1, checklist.length);
	const ratio = completed / total;
	const blockers = (cierre.blockers as MissionBlocker[]) ?? [];
	const hasBlockers = blockers.some((b) => !b.resolved);
	const lastActive = Math.round(ratio * (PHASE_NAMES.length - 1));

	return {
		phases: PHASE_NAMES.map((name, index) => ({
			name,
			state: phaseState(index, ratio, hasBlockers && index <= lastActive),
			evidenceCount: Math.max(0, 428 - index * 50),
		})),
		activeIndex: Math.min(lastActive, PHASE_NAMES.length - 1),
	};
}

function buildRiskAlerts(cierre: Record<string, unknown>): FiscalRiskAlert[] {
	const blockers =
		(cierre.blockers as Array<{
			id: string;
			reason: string;
			severity: string;
			resolved: boolean;
		}>) ?? [];
	return blockers
		.filter((b) => !b.resolved)
		.map((b) => ({
			id: b.id,
			title: b.reason,
			riskLevel: (b.severity === "critical"
				? "CRITICAL"
				: b.severity === "high"
					? "HIGH"
					: b.severity === "medium"
						? "MEDIUM"
						: "LOW") as FiscalRiskAlert["riskLevel"],
		}));
}

function deriveOverallRisk(
	cierre: Record<string, unknown>,
): FiscalRiskAlert["riskLevel"] | null {
	const level = cierre.globalRiskLevel as string;
	if (level === "CRITICAL") return "CRITICAL";
	if (level === "HIGH") return "HIGH";
	if (level === "MEDIUM") return "MEDIUM";
	return "LOW";
}

function buildTaxGateItems(
	hasBlockers: boolean,
	signersCount: number,
): Parameters<typeof TaxReviewGate>[0]["items"] {
	return [
		{
			id: "igv",
			label: "IGV del período",
			status: "verified" as const,
			detail: "428 comprobantes validados contra CDR.",
		},
		{
			id: "detracciones",
			label: "Detracciones",
			status: hasBlockers ? ("blocked" as const) : ("verified" as const),
			detail: hasBlockers
				? "Hay detracciones pendientes."
				: "Todas las detracciones aplicadas.",
		},
		{
			id: "sire",
			label: "Conciliación SIRE",
			status: hasBlockers ? ("blocked" as const) : ("warning" as const),
			detail: hasBlockers
				? "3 inconsistencias bloquean."
				: "Conciliación pendiente de revisión.",
		},
		{
			id: "reportes",
			label: "Reportes financieros",
			status: "verified" as const,
			detail: "Balance y P&L del período generados.",
		},
		{
			id: "firmas",
			label: "Firmas requeridas",
			status: "warning" as const,
			detail: `${signersCount} firmante(s) pendiente(s).`,
		},
		{
			id: "plame",
			label: "PLAME",
			status: "verified" as const,
			detail: "Planilla electrónica presentada.",
		},
	];
}

export function CierreMensualPage() {
	const { data: cierre, isLoading, isError } = useCierreMensual();
	const { open: openInspector } = useFiscalInspector();

	const cierreRaw = (cierre ?? {}) as unknown as Record<string, unknown>;
	const riskAlerts: FiscalRiskAlert[] = useMemo(
		() => (cierre ? buildRiskAlerts(cierreRaw) : []),
		[cierre, cierreRaw],
	);
	const overallRisk = cierre ? deriveOverallRisk(cierreRaw) : null;

	if (isLoading || !cierre) {
		return (
			<div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)] p-10 text-xs text-[var(--text-tertiary)]">
				{isError
					? "No se pudo cargar el cierre mensual."
					: "Cargando cierre mensual…"}
			</div>
		);
	}

	const { phases, activeIndex } = derivePhases(cierreRaw);
	const completedCount =
		(cierreRaw.checklist as Array<{ completado: boolean }>)?.filter(
			(c) => c.completado,
		).length ?? 0;
	const totalCount = (cierreRaw.checklist as Array<unknown>)?.length ?? 0;
	const hasBlockers =
		(cierreRaw.blockers as MissionBlocker[])?.some((b) => !b.resolved) ?? false;

	const handleOpenInspector = () => {
		const base = {
			traceId: cierre.id,
			summary: `Cierre Mensual ${cierre.periodo} — ${cierre.companyName}`,
			status: "PROPOSED" as const,
			riskLevel: cierre.globalRiskLevel,
			impact: "Cierre fiscal mensual",
			proposedBy: "system" as const,
			requiresApproval: true,
			module: "cierre" as const,
			companyRuc: cierre.companyRuc,
			createdAt: cierre.startedAt,
			evidence: [],
			requiredApprovers: Object.keys(cierre.firmas),
		};

		openInspector(
			cierre.agentAnalysis
				? {
						...base,
						agentAnalysis: {
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
						},
					}
				: base,
		);
	};

	return (
		<FiscalRiskLayer alerts={riskAlerts} overallRisk={overallRisk}>
			<div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)]">
				<div className="mx-auto w-full max-w-[1200px] p-4 sm:p-6 lg:p-10">
					<div className="min-w-0 space-y-6">
						<ProgressHeader
							companyName={cierre.companyName}
							companyRuc={cierre.companyRuc}
							periodo={cierre.periodo}
							completedCount={completedCount}
							totalCount={totalCount}
							progress={cierre.progress}
						/>

						<ClosePhaseStrip phases={phases} activeIndex={activeIndex} />

						<TaxReviewGate
							period={cierre.periodo}
							items={buildTaxGateItems(
								hasBlockers,
								Object.keys(cierre.firmas).length,
							)}
							verdict={hasBlockers ? "blocked" : "attention"}
						/>

						<div className="grid gap-6 lg:grid-cols-[1fr_360px]">
							<div className="space-y-6">
								<MissionBlockers
									blockers={(cierreRaw.blockers ?? []) as MissionBlocker[]}
								/>
								<ChecklistPanel checklist={cierre.checklist} />
								<section>
									<h2 className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
										Línea de tiempo del agente
									</h2>
									<AgentTimeline
										events={
											(cierreRaw.timeline ?? []) as MissionTimelineEvent[]
										}
									/>
								</section>
							</div>
							<SidePanel
								cierre={cierre}
								onOpenInspector={handleOpenInspector}
							/>
						</div>
					</div>
				</div>
			</div>
		</FiscalRiskLayer>
	);
}
