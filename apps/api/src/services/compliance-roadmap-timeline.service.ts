import type {
	ComplianceRoadmapActionId,
	ComplianceRoadmapActionTimeline,
} from "@drenyra/domain";
import { AccountingJobRunsService } from "./accounting-job-runs.service";
import {
	readActionId,
	readDecision,
	readReason,
	readTraceId,
} from "./compliance-roadmap-execution.helpers";
import { ComplianceRoadmapSnapshotService } from "./compliance-roadmap-snapshot.service";

export class ComplianceRoadmapTimelineService {
	static async getRoadmapActionTimeline(input: {
		companyId: string;
		year: number;
		month: number;
		actionId: ComplianceRoadmapActionId;
		traceId: string;
	}): Promise<ComplianceRoadmapActionTimeline> {
		const snapshot =
			await ComplianceRoadmapSnapshotService.getRoadmapMvpSnapshot({
				companyId: input.companyId,
				year: input.year,
				month: input.month,
			});
		const recommendation =
			ComplianceRoadmapSnapshotService.findRoadmapRecommendation({
				snapshot,
				actionId: input.actionId,
				traceId: input.traceId,
			});

		const runs = await AccountingJobRunsService.listRuns({
			companyId: input.companyId,
			limit: 100,
		});
		const tracedRuns = runs.filter((run) => {
			const traceId = readTraceId(run.inputPayload);
			const actionId = readActionId(run.inputPayload);
			return traceId === input.traceId && actionId === input.actionId;
		});

		const events = [
			{
				type: "RECOMMENDATION" as const,
				at: recommendation.recommendedAt,
				actionId: recommendation.id,
				traceId: recommendation.traceId,
				status: "RECOMMENDED",
				summary: recommendation.title,
			},
			...tracedRuns.flatMap((run) => {
				const decision = readDecision(run.inputPayload);
				const reason = readReason(run.inputPayload);
				return [
					{
						type: "DECISION" as const,
						at: run.createdAt.toISOString(),
						actionId: recommendation.id,
						traceId: recommendation.traceId,
						status: decision ?? "UNKNOWN",
						summary: `Operator decision: ${decision ?? "UNKNOWN"}`,
						reason: reason ?? undefined,
						runId: run.id,
					},
					{
						type: "EFFECT" as const,
						at: run.updatedAt.toISOString(),
						actionId: recommendation.id,
						traceId: recommendation.traceId,
						status: run.status,
						summary: run.summary ?? "Run status updated",
						reason: reason ?? undefined,
						runId: run.id,
					},
				];
			}),
		].sort((a, b) => a.at.localeCompare(b.at));

		return {
			companyId: input.companyId,
			period: snapshot.period,
			traceId: input.traceId,
			actionId: input.actionId,
			recommendation,
			events,
		};
	}
}
