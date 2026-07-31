import type {
	CierreMensual,
	CierreMensualChecklistItem,
} from "@drenyra/domain";
import type { MissionSnapshot, MissionStep } from "@drenyra/mission-domain";
import { useAccountingMission } from "@/features/workspace/hooks/useAccountingMission";
import type { MissionBlocker, MissionTimelineEvent } from "../mission.types";

export interface CierreMensualParams {
	companyId: string;
	companyName: string;
	companyRuc: string;
	fiscalPeriod: string;
}

export interface CierreMensualMission extends CierreMensual {
	companyId: string;
	blockers: MissionBlocker[];
	timeline: MissionTimelineEvent[];
}

type MissionProjectionSnapshot = Pick<
	MissionSnapshot,
	"progress" | "steps" | "blockers" | "proposal" | "receiptId" | "status"
>;

function projectChecklist(steps: MissionStep[]): CierreMensualChecklistItem[] {
	return steps.map((step, index) => ({
		id: step.id,
		label: step.name,
		descripcion: step.description ?? step.name,
		completado: step.status === "COMPLETED" || step.status === "SKIPPED",
		requiereEvidencia: step.status === "IN_PROGRESS",
		riesgo: step.status === "FAILED" ? "HIGH" : "LOW",
		orden: index + 1,
	}));
}

function projectBlockers(
	blockers: MissionSnapshot["blockers"],
): MissionBlocker[] {
	return blockers.map((blocker) => ({
		id: blocker.id,
		reason: blocker.reason,
		severity:
			blocker.severity === "CRITICAL"
				? "critical"
				: blocker.severity === "ERROR"
					? "high"
					: "medium",
		resolved: blocker.resolvedAt !== undefined,
		resolvedAt: blocker.resolvedAt,
	}));
}

function projectTimeline(steps: MissionStep[]): MissionTimelineEvent[] {
	return steps.map((step) => ({
		id: `step-${step.id}`,
		timestamp: step.completedAt ?? step.startedAt ?? "",
		actor: "agent",
		action: step.name,
		description: step.error ?? step.description ?? step.name,
		status:
			step.status === "FAILED"
				? "error"
				: step.status === "IN_PROGRESS"
					? "info"
					: step.status === "PENDING"
						? "warning"
						: "success",
	}));
}

function projectRisk(snapshot: MissionProjectionSnapshot): CierreMensual["globalRiskLevel"] {
	if (snapshot.blockers.some((blocker) => blocker.severity === "CRITICAL")) {
		return "CRITICAL";
	}
	if (snapshot.blockers.some((blocker) => blocker.severity === "ERROR")) {
		return "HIGH";
	}
	return snapshot.proposal?.riskLevel ?? "LOW";
}

function projectStatus(snapshot: MissionProjectionSnapshot): CierreMensual["status"] {
	if (snapshot.receiptId) return "CERRADO";
	if (snapshot.proposal) return "PENDIENTE_APROBACION";
	return snapshot.status === "DRAFT" ? "ABIERTO" : "EN_PROCESO";
}

export function projectCierreMensualMission(
	snapshot: MissionProjectionSnapshot,
	params: CierreMensualParams,
): CierreMensualMission {
	const checklist = projectChecklist(snapshot.steps);

	return {
		id: `close-${params.companyId}-${params.fiscalPeriod}`,
		companyId: params.companyId,
		companyName: params.companyName,
		companyRuc: params.companyRuc,
		periodo: params.fiscalPeriod,
		status: projectStatus(snapshot),
		startedAt: snapshot.steps[0]?.startedAt ?? "",
		checklist,
		progress: snapshot.progress / 10_000,
		expedienteId: `mission-${params.companyId}-${params.fiscalPeriod}`,
		firmas: {
			contador: { firmado: snapshot.receiptId !== null },
			revisor: { firmado: snapshot.receiptId !== null },
			representante: { firmado: snapshot.receiptId !== null },
		},
		sireStatus: snapshot.blockers.length > 0 ? "CON_DISCREPANCIAS" : "PENDIENTE",
		bancosStatus: snapshot.blockers.length > 0 ? "CON_DISCREPANCIAS" : "PENDIENTE",
		igvStatus: snapshot.receiptId ? "VALIDADO" : "PENDIENTE",
		globalRiskLevel: projectRisk(snapshot),
		blockers: projectBlockers(snapshot.blockers),
		timeline: projectTimeline(snapshot.steps),
	};
}

export function useCierreMensual(params: CierreMensualParams) {
	const mission = useAccountingMission();
	const data = projectCierreMensualMission(mission, params);

	return {
		data,
		isLoading: !mission.isReady && mission.error === null,
		isError: mission.error !== null,
		isAwaitingApproval: mission.isAwaiting,
		receiptId: mission.receiptId,
		receiptHash: mission.receiptHash,
		approve: mission.approve,
	};
}
