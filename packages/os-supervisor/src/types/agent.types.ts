import type { IRagStore } from "../rag/in-memory-rag-store.js";
import type { IAgentRunStore } from "../traceability/types.js";
import type { OSApprovalLevel } from "./approval.types.js";
import type { VerticalType } from "./vertical.types.js";

export interface OSAgentContext {
	tenantId: string;
	userId: string;
	organizationId: string;
	companyId: string;
	ruc: string;
	sessionId?: string;
	traceId: string;
	vertical: VerticalType;
	rag?: IRagStore;
	runStore?: IAgentRunStore;
}

export interface OSAgentMetrics {
	duration: number;
	tokensUsed: number;
	cost: number;
}

export interface OSAgentResult<T = unknown> {
	success: boolean;
	data: T | null;
	metrics: OSAgentMetrics;
	agentId?: string;
	errors?: string[];
	warnings?: string[];
}

export interface OSAgentPort<TTask = unknown, TOutput = unknown> {
	id: string;
	name: string;
	description: string;
	vertical: VerticalType;
	capabilities: string[];
	approvalLevel?: OSApprovalLevel;
	priority?: number;
	execute: (
		task: TTask,
		context: OSAgentContext,
	) => Promise<OSAgentResult<TOutput>>;
}

export interface OSAgentTool<TInput = unknown, TOutput = unknown> {
	name: string;
	description: string;
	inputSchema: never;
	outputSchema: never;
	approvalLevel: OSApprovalLevel;
	execute: (input: TInput, context: OSAgentContext) => Promise<TOutput>;
}

export interface OSIntent {
	vertical: VerticalType;
	action: string;
	confidence: number;
	originalInput: string;
}
