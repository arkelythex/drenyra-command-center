import type { AgentContext } from "../types/agent-context";
import type { LatinAgentId } from "../types/latin-agent";
import { ApprovalGateEngine } from "./approval-gate";

/** Result from a domain agent task execution */
export interface DomainResult {
	domainId: string;
	taskId: string;
	status: "completed" | "error" | "timeout";
	data: unknown;
	confidence: number;
	error?: { code: string; message: string; recoverable: boolean };
}

/** A sub-task spawned from a domain agent */
export interface SubSwarmTask {
	id: string;
	goal: string;
	context: AgentContext;
	domain: LatinAgentId;
	tools?: string[];
	maxSteps?: number;
}

/** Result from a sub-agent task */
export interface SubAgentResult {
	subTaskId: string;
	status: "completed" | "error" | "timeout";
	data: unknown;
	confidence: number;
	error?: { code: string; message: string; recoverable: boolean };
}

/** A material action that needs approval checking */
export interface MaterialAction {
	type: "financial" | "compliance" | "admin";
	amount?: number;
	currency?: string;
	description: string;
	toolName: string;
}

/** Result from approval check */
export interface ApprovalResult {
	required: boolean;
	approvalId?: string;
	reason?: string;
}

/** Context for escalation */
export interface EscalationContext {
	taskId: string;
	domain: LatinAgentId;
	reason: string;
	attempts: number;
	lastError?: string;
}

/** Resolution from escalation */
export interface EscalationResolution {
	action: "retry" | "bypass" | "abort" | "human";
	message: string;
	assignedTo?: string;
}

/** Configuration for a DomainAgent */
export interface DomainAgentConfig {
	id: LatinAgentId;
	name: string;
	description: string;
	capabilities: string[];
	approvalRequired: boolean;
	maxRetries: number;
}

/**
 * Mastra-based Domain Agent.
 *
 * Replaces the original DomainAgent from agent-swarm.
 * Each domain has one primary agent + fallback agents.
 */
export class DomainAgent {
	public readonly id: LatinAgentId;
	public readonly name: string;
	public readonly description: string;
	public readonly capabilities: string[];
	public readonly primaryAgent: { id: string; name: string };

	private readonly agents: Array<{ id: string; name: string }>;
	private readonly config: DomainAgentConfig;
	private readonly approvalGate: ApprovalGateEngine;

	constructor(
		agents: Array<{ id: string; name: string }>,
		config: DomainAgentConfig,
		approvalGate: ApprovalGateEngine,
	) {
		this.agents = agents;
		this.config = config;
		this.approvalGate = approvalGate;
		this.id = config.id;
		this.name = config.name;
		this.description = config.description;
		this.capabilities = config.capabilities;
		this.primaryAgent = agents[0] ?? { id: config.id, name: config.name };
	}

	/** Select the best agent for a given task based on capabilities */
	selectBestAgent(task: { goal?: string; tools?: string[] }): { id: string; name: string } {
		if (task.tools?.length && this.agents.length > 1) {
			// Try to find an agent matching the required tools
			const matched = this.agents.find((a) =>
				task.tools!.some((t) => a.name.toLowerCase().includes(t.toLowerCase())),
			);
			if (matched) return matched;
		}
		return this.primaryAgent;
	}

	/** Receive and process a task */
	async receiveTask(task: {
		id: string;
		goal: string;
		context: AgentContext;
		tools?: string[];
	}): Promise<DomainResult> {
		const agent = this.selectBestAgent(task);

		return {
			domainId: this.id,
			taskId: task.id,
			status: "completed",
			data: {
				agent: agent.id,
				domain: this.id,
				goal: task.goal,
				tools: task.tools ?? [],
			},
			confidence: 0.85,
		};
	}

	/** Spawn a sub-agent for a sub-task */
	async spawnSubAgent(task: SubSwarmTask): Promise<SubAgentResult> {
		const subTaskId = `${task.id}-${crypto.randomUUID().slice(0, 8)}`;

		return {
			subTaskId,
			status: "completed",
			data: {
				goal: task.goal,
				domain: task.domain,
				tools: task.tools ?? [],
			},
			confidence: 0.8,
		};
	}

	/** Check if a material action needs approval */
	async checkApproval(action: MaterialAction): Promise<ApprovalResult> {
		if (!this.config.approvalRequired) {
			return { required: false };
		}

		// Determine if action needs approval
		const isFinancialAction = action.type === "financial" && (action.amount ?? 0) > 0;
		const isComplianceAction = action.type === "compliance";
		const needsApproval = isFinancialAction || isComplianceAction;

		if (!needsApproval) {
			return { required: false };
		}

		return {
			required: true,
			reason: `${action.type} action '${action.description}' requires approval`,
		};
	}

	/** Escalate a task that can't be resolved at this level */
	async escalate(context: EscalationContext): Promise<EscalationResolution> {
		if (context.attempts < this.config.maxRetries) {
			return {
				action: "retry",
				message: `Retrying task ${context.taskId} (attempt ${context.attempts + 1}/${this.config.maxRetries})`,
			};
		}

		return {
			action: "human",
			message: `Task ${context.taskId} exceeded max retries in domain '${this.name}'. Human intervention required.`,
			assignedTo: "domain-supervisor",
		};
	}
}
