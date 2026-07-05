import type {
	ApprovalWorkflow,
	DelegationGraph,
	HarnessAgentResult,
	HarnessExecutionContext,
	HarnessRunNode,
	HarnessSpawnRequest,
	HarnessStatus,
} from "@drenyra/platform-core/harness";

export interface HarnessExecuteResponse {
	traceId: string;
	rootAgentId: string;
	status: HarnessStatus;
	tree: HarnessRunNode;
	executiveSummary: string;
}

export type AgentHandler = (
	input: HarnessSpawnRequest & { runId: string },
) => Promise<HarnessAgentResult>;

export interface HarnessOptions {
	maxDepth?: number;
	handlers?: Map<string, AgentHandler>;
	onApprovalRequired?: (input: {
		agentId: string;
		task: string;
		context: HarnessExecutionContext;
		runId: string;
	}) => Promise<boolean>;
	/**
	 * Optional platform-core DelegationGraph for spawn validation.
	 * When omitted, defaults to a DelegationGraph pre-populated with
	 * DRENYRA fiscal agents (DELEGATION_AGENTS from graph.ts).
	 *
	 * @see adr-030-drenyra-harness-merge.md
	 */
	delegationGraph?: DelegationGraph;
	/**
	 * Optional platform-core ApprovalWorkflow for configurable approval gates.
	 * When omitted, defaults to an ApprovalWorkflow with fiscal approval keywords
	 * (sunat, filing, submit, approve, confirm, cpe, sire, etc.).
	 *
	 * @see adr-030-drenyra-harness-merge.md
	 */
	approvalWorkflow?: ApprovalWorkflow;
}
