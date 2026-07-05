import type {
	ComplianceRoadmapActionId,
	ComplianceRoadmapActionRunResult,
	ComplianceRoadmapActionTimeline,
	ComplianceRoadmapDecision,
	ComplianceRoadmapDecisionRunResult,
} from "@drenyra/domain";
import { AccountingJobRunsService } from "./accounting-job-runs.service";
import { ComplianceRoadmapDecisionService } from "./compliance-roadmap-decision.service";
import { ComplianceRoadmapSnapshotService } from "./compliance-roadmap-snapshot.service";
import { ComplianceRoadmapTimelineService } from "./compliance-roadmap-timeline.service";

export class ComplianceRoadmapExecutionService {
	static async runRoadmapAction(input: {
		companyId: string;
		year: number;
		month: number;
		actionId: ComplianceRoadmapActionId;
		traceId: string;
		countryCode?: string;
	}): Promise<ComplianceRoadmapActionRunResult> {
		const snapshot = await ComplianceRoadmapSnapshotService.getRoadmapMvpSnapshot({
			companyId: input.companyId,
			year: input.year,
			month: input.month,
		});
		const action = ComplianceRoadmapSnapshotService.findRoadmapRecommendation({
			snapshot,
			actionId: input.actionId,
			traceId: input.traceId,
		});

		if (action.id === "prepare-sire" && action.automationLevel === "one-click") {
			const run = await AccountingJobRunsService.createRun({
				companyId: input.companyId,
				countryCode: input.countryCode ?? "pe",
				jobId: "prepare-sire",
				summary: `Roadmap MVP - preparar SIRE ${snapshot.period}`,
				inputPayload: {
					period: snapshot.period,
					source: "roadmap-mvp",
					traceId: input.traceId,
					actionId: action.id,
					recommendation: {
						title: action.title,
						confidence: action.confidence,
						automationLevel: action.automationLevel,
					},
				},
			});

			return {
				actionId: action.id,
				execution: "QUEUED_FOR_APPROVAL",
				message: "Automation queued with approval gate before execution.",
				runId: run.id,
				runStatus: run.status,
			};
		}

		return {
			actionId: action.id,
			execution: "REVIEW_REQUIRED",
			message: "Action prepared for guided execution in the copilot workflow.",
		};
	}

	static decideRoadmapAction(input: {
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
		return ComplianceRoadmapDecisionService.decideRoadmapAction(input);
	}

	static getRoadmapActionTimeline(input: {
		companyId: string;
		year: number;
		month: number;
		actionId: ComplianceRoadmapActionId;
		traceId: string;
	}): Promise<ComplianceRoadmapActionTimeline> {
		return ComplianceRoadmapTimelineService.getRoadmapActionTimeline(input);
	}
}
