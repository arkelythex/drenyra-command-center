import { useParams } from "@tanstack/react-router";
import {
	type FiscalRiskAlert,
	FiscalRiskLayer,
} from "@/components/fiscal/FiscalRiskLayer";
import { Button } from "@/components/ui/button";
import { useInspector, type InspectorSubject } from "@/context/InspectorContext";
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

function phaseState(index: number, ratio: number, hasBlockers: boolean): ClosePhaseState {
	const phaseProgress = index / (PHASE_NAMES.length - 1);
	if (phaseProgress <= ratio - 0.15) return "completed";
	return index <= Math.round(ratio * (PHASE_NAMES.length - 1))
		? hasBlockers
			? "blocked"
			: "active"
		: "pending";
}

function derivePhases(
	checklist: Array<{ completado: boolean }>,
	hasBlockers: boolean,
) {
	const completed = checklist.filter((item) => item.completado).length;
	const ratio = completed / Math.max(1, checklist.length);
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

function buildRiskAlerts(
	blockers: Parameters<typeof MissionBlockers>[0]["blockers"],
): FiscalRiskAlert[] {
	return blockers
		.filter((blocker) => !blocker.resolved)
		.map((blocker) => ({
			id: blocker.id,
			title: blocker.reason,
			riskLevel: (blocker.severity === "critical"
				? "CRITICAL"
				: blocker.severity === "high"
					? "HIGH"
					: blocker.severity === "medium"
						? "MEDIUM"
						: "LOW") as FiscalRiskAlert["riskLevel"],
		}));
}

function buildTaxGateItems(
	hasBlockers: boolean,
	signersCount: number,
): Parameters<typeof TaxReviewGate>[0]["items"] {
	return [
		{ id: "igv", label: "IGV del período", status: "verified", detail: "Evidencia de la misión disponible." },
		{ id: "detracciones", label: "Detracciones", status: hasBlockers ? "blocked" : "verified", detail: hasBlockers ? "Hay bloqueos pendientes." : "Sin bloqueos activos." },
		{ id: "sire", label: "Conciliación SIRE", status: hasBlockers ? "blocked" : "warning", detail: hasBlockers ? "La misión reporta bloqueos." : "Pendiente de revisión." },
		{ id: "reportes", label: "Reportes financieros", status: "warning", detail: "Se actualiza con el protocolo de misión." },
		{ id: "firmas", label: "Firmas requeridas", status: "warning", detail: `${signersCount} firma(s) proyectada(s).` },
		{ id: "plame", label: "PLAME", status: "warning", detail: "Pendiente de evidencia del protocolo." },
	];
}

export function CierreMensualPage() {
	const params = useParams({ from: "/workspace/$companyId/$year/$month/$intent" });
	const { data: cierre, isLoading, isError, isAwaitingApproval, receiptId, receiptHash, approve } = useCierreMensual({
		companyId: params.companyId,
		companyName: `Empresa ${params.companyId}`,
		companyRuc: "",
		fiscalPeriod: `${params.year}-${params.month}`,
	});
	const { open: openInspector } = useInspector();

	if (isLoading || !cierre) {
		return <div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)] p-10 text-xs text-[var(--text-tertiary)]">{isError ? "No se pudo cargar el cierre mensual." : "Cargando cierre mensual…"}</div>;
	}

	const hasBlockers = cierre.blockers.some((blocker) => !blocker.resolved);
	const { phases, activeIndex } = derivePhases(cierre.checklist, hasBlockers);
	const completedCount = cierre.checklist.filter((item) => item.completado).length;
	const riskAlerts = buildRiskAlerts(cierre.blockers);
	const overallRisk: FiscalRiskAlert["riskLevel"] = cierre.globalRiskLevel;

	const handleOpenInspector = () => {
		const subject: InspectorSubject = {
			type: "fiscal",
			id: cierre.id,
			title: `Cierre Mensual ${cierre.periodo} — ${cierre.companyName}`,
		};
		openInspector(subject);
	};

	return (
		<FiscalRiskLayer alerts={riskAlerts} overallRisk={overallRisk}>
			<div className="flex-1 overflow-auto custom-scrollbar bg-[var(--surface-1)]">
				<div className="mx-auto w-full max-w-[1200px] p-4 sm:p-6 lg:p-10">
					<div className="min-w-0 space-y-6">
						<ProgressHeader companyName={cierre.companyName} companyRuc={cierre.companyRuc} periodo={cierre.periodo} completedCount={completedCount} totalCount={cierre.checklist.length} progress={cierre.progress} />
						{isAwaitingApproval ? <Button onClick={approve}>Aprobar propuesta</Button> : null}
						{receiptId && receiptHash ? <p className="text-xs text-[var(--text-tertiary)]">Receipt: {receiptId} · {receiptHash}</p> : null}
						<ClosePhaseStrip phases={phases} activeIndex={activeIndex} />
						<TaxReviewGate period={cierre.periodo} items={buildTaxGateItems(hasBlockers, Object.keys(cierre.firmas).length)} verdict={hasBlockers ? "blocked" : "attention"} />
						<div className="grid gap-6 lg:grid-cols-[1fr_360px]">
							<div className="space-y-6">
								<MissionBlockers blockers={cierre.blockers} />
								<ChecklistPanel checklist={cierre.checklist} />
								<section><h2 className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">Línea de tiempo del agente</h2><AgentTimeline events={cierre.timeline} /></section>
							</div>
							<SidePanel cierre={cierre} onOpenInspector={handleOpenInspector} />
						</div>
					</div>
				</div>
			</div>
		</FiscalRiskLayer>
	);
}
