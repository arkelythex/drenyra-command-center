import type { OSApprovalLevel } from "../types/approval.types.js";

// TODO(phase-4): support pending status for async agent runs
export type OSAgentRunStatus = "auto" | "approved" | "rejected" | "pending";

export interface OSAgentRun {
	id: string;
	vertical: string;
	userId: string;
	prompt: string;
	response: string;
	tools: string[];
	approvalStatus: OSAgentRunStatus;
	approvedBy?: string;
	riskLevel: OSApprovalLevel;
	tokensUsed: number;
	durationMs: number;
	timestamp: Date;
}

export interface IAgentRunStore {
	record(run: OSAgentRun): void;
	getById(id: string): OSAgentRun | undefined;
	list(vertical?: string): OSAgentRun[];
	getStats(): AgentRunStats;
}

export interface AgentRunStats {
	total: number;
	byVertical: Record<string, number>;
	byStatus: Record<string, number>;
	averageDurationMs: number;
	totalTokensUsed: number;
}
