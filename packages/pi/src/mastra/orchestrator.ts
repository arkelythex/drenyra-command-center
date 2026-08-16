import type { LexoriSkillContextResult } from "../_domain-types/domain-barrel";
import { LexoriSkillResolver } from "../lexori/lexori.resolver";
import type { AgentContext } from "../types/agent-context";
import type { AgentDefinition, AgentIntent } from "../types/erp-types";
import { ApprovalGateEngine } from "./approval-gate";
import { ApprovalStore } from "./approval-store";
import { AgentEventBus } from "./event-bus";
import { IntentDetector, type IntentHandler } from "./intent-detector";
import { LatinModernoOrchestrator } from "./latin-orchestrator";

/** Result from handling a user input */
export interface OrchestrationResult {
	sessionId: string;
	intent: AgentIntent;
	result:
		| { success: boolean; data: unknown }
		| { success: boolean; error: string };
	agent: string;
	/** Lexori regulatory context for fiscal agents */
	lexoriContext?: LexoriSkillContextResult[] | undefined;
}

/**
 * Drenyra Orchestrator — Mastra-based replacement for the original.
 *
 * This is the main entry point for the fiscal agent system.
 * Combines Intent Detection, Swarm Orchestration, and Approval Gates
 * into a single unified interface.
 *
 * Key differences from original:
 * - Uses Mastra under the hood for agent execution
 * - FD workflow (Extract → Classify → Validate → Comply → Approve → Submit → Archive)
 * - Approvals are fiscal-gate aware (T1/T2/T3 tiers)
 * - Event bus uses typed FiscalEvent system
 */
export class DrenyraOrchestrator {
	private readonly agents = new Map<string, AgentDefinition>();
	private readonly approvalGate: ApprovalGateEngine;
	private readonly eventBus: AgentEventBus;
	private readonly detectIntent: IntentHandler;
	private swarmOrchestrator?: LatinModernoOrchestrator | undefined;
	private swarmMode: "flat" | "hierarchy" = "flat";

	constructor(
		approvalGate: ApprovalGateEngine,
		eventBus: AgentEventBus,
		detectIntent: IntentHandler,
		private readonly lexoriProvider?: LexoriSkillResolver,
	) {
		this.approvalGate = approvalGate;
		this.eventBus = eventBus;
		this.detectIntent = detectIntent;
	}

	registerAgent(agent: AgentDefinition): void {
		this.agents.set(agent.id, agent);
	}

	getAgent(id: string): AgentDefinition | undefined {
		return this.agents.get(id);
	}

	getAllAgents(): AgentDefinition[] {
		return Array.from(this.agents.values());
	}

	enableSwarmMode(orchestrator: LatinModernoOrchestrator): void {
		this.swarmOrchestrator = orchestrator;
		this.swarmMode = "hierarchy";
	}

	disableSwarmMode(): void {
		this.swarmOrchestrator = undefined;
		this.swarmMode = "flat";
	}

	isSwarmMode(): boolean {
		return (
			this.swarmMode === "hierarchy" && this.swarmOrchestrator !== undefined
		);
	}

	async handleInput(
		input: string,
		context: AgentContext,
		sessionId?: string,
	): Promise<OrchestrationResult> {
		const actualSessionId = sessionId ?? crypto.randomUUID();

		// 1. Detect intent
		const intent = await this.detectIntent(input, context);

		// Resolve Lexori regulatory context for fiscal agents
		let lexoriContext: LexoriSkillContextResult[] | undefined;
		if (this.lexoriProvider) {
			lexoriContext = await this.lexoriProvider.resolveForAgent(intent.agent, {
				ruc: context.ruc ?? "",
				periodo: "",
			});
		}

		// 2. Route to swarm or flat mode
		if (this.isSwarmMode() && this.swarmOrchestrator) {
			const swarmResult = await this.swarmOrchestrator.handleRequest(
				input,
				context,
				actualSessionId,
			);

			return {
				sessionId: actualSessionId,
				intent,
				result: {
					success: swarmResult.success,
					data: swarmResult.data,
				},
				agent: "swarm",
				lexoriContext,
			};
		}

		// 3. Flat mode: find the agent and execute
		const agent = this.agents.get(intent.agent);
		if (!agent) {
			return {
				sessionId: actualSessionId,
				intent,
				result: {
					success: false,
					error: `No agent registered for '${intent.agent}'`,
				},
				agent: intent.agent,
			};
		}

		// Publish intent detected event
		await this.eventBus.publish(
			"agent.task.decomposed",
			{
				agent: intent.agent,
				tool: intent.tool,
				sessionId: actualSessionId,
			},
			context,
		);

		return {
			sessionId: actualSessionId,
			intent,
			result: {
				success: true,
				data: { agent: agent.id, intent: intent.tool, input },
			},
			agent: intent.agent,
			lexoriContext,
		};
	}

	getApprovalGate(): ApprovalGateEngine {
		return this.approvalGate;
	}

	getEventBus(): AgentEventBus {
		return this.eventBus;
	}
}

/**
 * Convenience factory for creating a DrenyraOrchestrator with default components.
 */
export function createDrenyraOrchestrator(
	options: {
		governanceValidator?: (
			toolName: string,
			input: unknown,
			context: AgentContext,
		) => Promise<{ valid: boolean; reasons: string[]; evidenceRefs: string[] }>;
		notifyCallback?: (request: unknown) => Promise<void>;
		swarmMode?: "flat" | "hierarchy";
		withLexori?: boolean;
	} = {},
): {
	orchestrator: DrenyraOrchestrator;
	approvalStore: ApprovalStore;
	approvalGate: ApprovalGateEngine;
	eventBus: AgentEventBus;
	intentDetector: IntentDetector;
	latinOrchestrator?: LatinModernoOrchestrator | undefined;
	lexoriResolver?: LexoriSkillResolver | undefined;
} {
	const approvalStore = new ApprovalStore();
	const eventBus = new AgentEventBus();
	const intentDetector = new IntentDetector();

	const approvalGate = new ApprovalGateEngine(
		approvalStore,
		options.governanceValidator,
		options.notifyCallback,
	);

	const lexoriResolver = options.withLexori
		? new LexoriSkillResolver()
		: undefined;

	const orchestrator = new DrenyraOrchestrator(
		approvalGate,
		eventBus,
		(input: string, context: AgentContext) =>
			intentDetector.detectIntent(input, context),
		lexoriResolver,
	);

	let latinOrchestrator: LatinModernoOrchestrator | undefined;

	if (options.swarmMode === "hierarchy") {
		latinOrchestrator = new LatinModernoOrchestrator({ mode: "hierarchy" });
		orchestrator.enableSwarmMode(latinOrchestrator);
	}

	return {
		orchestrator,
		approvalStore,
		approvalGate,
		eventBus,
		intentDetector,
		latinOrchestrator,
		lexoriResolver,
	};
}
