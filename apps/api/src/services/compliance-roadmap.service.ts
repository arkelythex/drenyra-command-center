import type {
	ComplianceRoadmapActionId,
	ComplianceRoadmapActionRunResult,
	ComplianceRoadmapActionTimeline,
	ComplianceRoadmapDecision,
	ComplianceRoadmapDecisionRunResult,
	ComplianceRoadmapSnapshot,
} from "../types/compliance.types";
import { ComplianceRoadmapExecutionService } from "./compliance-roadmap-execution.service";
import { ComplianceRoadmapSnapshotService } from "./compliance-roadmap-snapshot.service";

export class ComplianceRoadmapService {
	static getRoadmapMvpSnapshot(input: {
		companyId: string;
		year: number;
		month: number;
	}): Promise<ComplianceRoadmapSnapshot> {
		return ComplianceRoadmapSnapshotService.getRoadmapMvpSnapshot(input);
	}

	static runRoadmapAction(input: {
		companyId: string;
		year: number;
		month: number;
		actionId: ComplianceRoadmapActionId;
		traceId: string;
		countryCode?: string;
	}): Promise<ComplianceRoadmapActionRunResult> {
		return ComplianceRoadmapExecutionService.runRoadmapAction(input);
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
		return ComplianceRoadmapExecutionService.decideRoadmapAction(input);
	}

	static getRoadmapActionTimeline(input: {
		companyId: string;
		year: number;
		month: number;
		actionId: ComplianceRoadmapActionId;
		traceId: string;
	}): Promise<ComplianceRoadmapActionTimeline> {
		return ComplianceRoadmapExecutionService.getRoadmapActionTimeline(input);
	}
}
