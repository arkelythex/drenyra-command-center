import type {
	ComplianceRoadmapActionId,
	ComplianceRoadmapDecision,
	ComplianceRoadmapDecisionRunResult,
} from "@drenyra/domain";
import { AccountingJobRunsService } from "./accounting-job-runs.service";
import { ROADMAP_ACTION_JOB_MAP } from "./compliance-roadmap-execution.helpers";
import { ComplianceRoadmapSnapshotService } from "./compliance-roadmap-snapshot.service";

export class ComplianceRoadmapDecisionService {
	static async decideRoadmapAction(input: {
		companyId: string;
		year: number;
		month: number;
		actionId: ComplianceRoadmapActionId;
		traceId: string;
		decision: ComplianceRoadmapDecision;
		reason: string;
		countryCode?: string;
		decidedBy?: string;
	}): Promise<ComplianceRoadmapDecisionRunResult> {
		const snapshot =
			await ComplianceRoadmapSnapshotService.getRoadmapMvpSnapshot({
				companyId: input.companyId,
				year: input.year,
				month: input.month,
			});
		const action = ComplianceRoadmapSnapshotService.findRoadmapRecommendation({
			snapshot,
			actionId: input.actionId,
			traceId: input.traceId,
		});

		const run = await AccountingJobRunsService.createRun({
			companyId: input.companyId,
			countryCode: input.countryCode ?? "pe",
			jobId: ROADMAP_ACTION_JOB_MAP[input.actionId],
			requestedBy: input.decidedBy ?? null,
			summary: `Roadmap decision ${input.decision} - ${snapshot.period}`,
			inputPayload: {
				period: snapshot.period,
				source: "roadmap-mvp-decision",
				traceId: input.traceId,
				actionId: action.id,
				decision: input.decision,
				reason: input.reason,
				recommendation: {
					title: action.title,
					confidence: action.confidence,
					automationLevel: action.automationLevel,
				},
			},
		});

		const updated = await ComplianceRoadmapDecisionService.applyDecisionStatus({
			runId: run.id,
			companyId: input.companyId,
			decision: input.decision,
			reason: input.reason,
			decidedBy: input.decidedBy ?? null,
			traceId: input.traceId,
			actionId: action.id,
		});

		return {
			actionId: action.id,
			traceId: input.traceId,
			decision: input.decision,
			reason: input.reason,
			runId: updated.id,
			runStatus: updated.status,
			message:
				input.decision === "APPROVE"
					? "Decision approved and queued for controlled execution."
					: input.decision === "ESCALATE"
						? "Decision escalated to approval queue."
						: "Decision rejected and execution cancelled.",
		};
	}

	private static async applyDecisionStatus(input: {
		runId: string;
		companyId: string;
		decision: ComplianceRoadmapDecision;
		reason: string;
		decidedBy: string | null;
		traceId: string;
		actionId: ComplianceRoadmapActionId;
	}) {
		if (input.decision === "REJECT") {
			return AccountingJobRunsService.updateRunStatus({
				id: input.runId,
				companyId: input.companyId,
				status: "CANCELLED",
				summary: "Roadmap action rejected by operator.",
				evidencePayload: {
					source: "roadmap-mvp",
					traceId: input.traceId,
					actionId: input.actionId,
					decision: input.decision,
					reason: input.reason,
				},
			});
		}

		return AccountingJobRunsService.updateRunStatus({
			id: input.runId,
			companyId: input.companyId,
			status: "AWAITING_APPROVAL",
			approvedBy: input.decision === "APPROVE" ? input.decidedBy : null,
			summary:
				input.decision === "APPROVE"
					? "Roadmap action approved and pending execution approval gate."
					: "Roadmap action escalated for senior approval.",
			evidencePayload: {
				source: "roadmap-mvp",
				traceId: input.traceId,
				actionId: input.actionId,
				decision: input.decision,
				reason: input.reason,
			},
		});
	}
}
