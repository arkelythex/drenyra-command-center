import { useParams } from "@tanstack/react-router";
import {
	type FiscalRiskAlert,
	FiscalRiskLayer,
} from "@/components/fiscal/FiscalRiskLayer";
import { Button } from "@/components/ui/button";
import {
	type InspectorSubject,
	useInspector,
} from "@/context/InspectorContext";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
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
import {
	type CierreMensualMissionSource,
	useCierreMensual,
} from "./hooks/useCierreMensual";

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

const TAX_GATE_CHECKS = [
	{ id: "igv", label: "IGV del período" },
	{ id: "detracciones", label: "Detracciones" },
	{ id: "sire", label: "Conciliación SIRE" },
	{ id: "reportes", label: "Reportes financieros" },
	{ id: "plame", label: "PLAME" },
] as const;

/**
 * No check is shown as verified until the mission brings evidence for it:
 * open blockers mark them blocked, otherwise they need attention. The note
 * that applies to all of them is stated once, not per control.
 */
function buildTaxGate(hasBlockers: boolean, signed: number, required: number) {
	const status = hasBlockers ? ("blocked" as const) : ("warning" as const);
	return {
		summary: hasBlockers
			? "La misión reporta bloqueos pendientes."
			: "Ningún control tiene evidencia de la misión todavía.",
		items: [
			...TAX_GATE_CHECKS.map((check) => ({ ...check, status })),
			{
				id: "firmas",
				label: "Firmas requeridas",
				status: "warning" as const,
				detail: `${signed} de ${required} firma(s).`,
			},
		],
	};
}

export function CierreMensualPage({
	mission,
}: {
	mission: CierreMensualMissionSource;
}) {
	const params = useParams({
		from: "/workspace/$companyId/$year/$month/$intent",
	});
	const { companyContext } = useActiveCompanyContext();
	const {
		data: cierre,
		isLoading,
		isError,
		isAwaitingApproval,
		receiptId,
		receiptHash,
		approve,
	} = useCierreMensual(mission, {
		companyId: companyContext.companyId,
		companyName: companyContext.companyName,
		companyRuc: companyContext.ruc,
		fiscalPeriod: `${params.year}-${params.month}`,
	});
	const { open: openInspector } = useInspector();

	if (isLoading || !cierre) {
		return (
			<div
				role={isError ? "alert" : "status"}
				className="flex-1 overflow-y-auto p-8 text-sm text-muted-foreground"
			>
				{isError
					? "No se pudo cargar el cierre mensual."
					: "Cargando cierre mensual…"}
			</div>
		);
	}

	const hasBlockers = cierre.blockers.some((blocker) => !blocker.resolved);
	const { phases, activeIndex } = derivePhases(cierre.checklist, hasBlockers);
	const completedCount = cierre.checklist.filter(
		(item) => item.completado,
	).length;
	const taxGate = buildTaxGate(
		hasBlockers,
		Object.values(cierre.firmas).filter((f) => f?.firmado).length,
		Object.keys(cierre.firmas).length,
	);
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
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 lg:py-10">
					<div className="min-w-0 space-y-8">
						<ProgressHeader
							companyName={cierre.companyName}
							companyRuc={cierre.companyRuc}
							periodo={cierre.periodo}
							completedCount={completedCount}
							totalCount={cierre.checklist.length}
							progress={cierre.progress}
						/>
						{isAwaitingApproval ? (
							<Button onClick={approve}>Aprobar propuesta</Button>
						) : null}
						{receiptId && receiptHash ? (
							<p className="break-all font-mono text-xs text-muted-foreground">
								Recibo: {receiptId} · {receiptHash}
							</p>
						) : null}
						<ClosePhaseStrip phases={phases} activeIndex={activeIndex} />
						<TaxReviewGate
							period={cierre.periodo}
							{...taxGate}
							verdict={hasBlockers ? "blocked" : "attention"}
						/>
						<div className="grid gap-6 lg:grid-cols-[1fr_360px]">
							<div className="space-y-6">
								<MissionBlockers blockers={cierre.blockers} />
								<ChecklistPanel checklist={cierre.checklist} />
								<section>
									<h2 className="mb-3 text-base font-medium tracking-tight">
										Línea de tiempo del agente
									</h2>
									<AgentTimeline events={cierre.timeline} />
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
