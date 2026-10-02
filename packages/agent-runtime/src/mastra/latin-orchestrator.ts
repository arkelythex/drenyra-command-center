import type { AgentContext } from "../types/agent-context";
import type { LatinAgentId } from "../types/latin-agent";
import type { DomainAgent } from "./domain-agent";
import { ResultMerger } from "./result-merger";
import { SessionManager } from "./session-manager";
import { type PhaseTiming, Supervisor, type SwarmMode } from "./supervisor";
import { TaskDecomposer, type TaskStep } from "./task-decomposer";

/** Output of one executed step. */
interface StepResult {
	domainId: string;
	data: unknown;
	confidence: number;
}

/** Result from a Latin Moderno orchestration request */
export interface LatinOrchestrationResult {
	success: boolean;
	data: unknown;
	conflicts: Array<{
		between: string[];
		field: string;
		values: unknown[];
		resolvedBy: string;
	}>;
	traceId: string;
	sessionId: string;
	timings: PhaseTiming[];
}

/** Configuration for the Latin Moderno Orchestrator */
export interface LatinModernoOrchestratorOptions {
	mode: SwarmMode;
}

/**
 * Latin Moderno Orchestrator.
 *
 * Mastra-based replacement for the original LatinModernoOrchestrator.
 * Coordinates 8 domain agents (Cerno, Custos, Necto, Regula, Lumen, Fusio, Scripta, Capsa)
 * through the FD workflow: Extract → Classify → Validate → Comply → Approve → Submit → Archive.
 *
 * Key differences from original:
 * - Uses Mastra's agent system for domain agent execution
 * - TaskDecomposer maps naturally to Mastra workflows
 * - ResultMerger/Supervisor handle cross-domain conflicts
 * - SessionManager provides state persistence
 */
export class LatinModernoOrchestrator {
	private readonly domainAgents = new Map<LatinAgentId, DomainAgent>();
	private readonly taskDecomposer: TaskDecomposer;
	private readonly resultMerger: ResultMerger;
	private readonly supervisor: Supervisor;
	private readonly sessionManager: SessionManager;
	constructor(
		_options: LatinModernoOrchestratorOptions = { mode: "hierarchy" },
	) {
		this.taskDecomposer = new TaskDecomposer();
		this.resultMerger = new ResultMerger();
		this.supervisor = new Supervisor();
		this.sessionManager = new SessionManager();
	}

	registerDomainAgent(agent: DomainAgent & { id: LatinAgentId }): void {
		this.domainAgents.set(agent.id, agent);
	}

	getDomainAgent(id: LatinAgentId): DomainAgent | undefined {
		return this.domainAgents.get(id);
	}

	getAllDomainAgents(): DomainAgent[] {
		return Array.from(this.domainAgents.values());
	}

	async handleRequest(
		intent: string,
		context: AgentContext,
		sessionId?: string,
	): Promise<LatinOrchestrationResult> {
		const traceId = crypto.randomUUID();
		const session = sessionId
			? this.sessionManager.get(sessionId)
			: this.sessionManager.create(intent, context);

		const actualSessionId =
			session?.id ?? this.sessionManager.create(intent, context).id;
		const availableDomains = Array.from(this.domainAgents.keys());

		// 1. Decompose the intent into steps
		const decomposition = this.taskDecomposer.decompose(
			intent,
			context,
			availableDomains,
		);

		// 2. Execute steps (parallel groups sequentially, steps within group in parallel)
		const results: Array<{
			domainId: string;
			data: unknown;
			confidence: number;
		}> = [];

		for (const group of decomposition.parallelGroups) {
			const groupResults = await Promise.all(
				group.map((stepId) =>
					this.executeStep(
						stepId,
						decomposition.steps,
						context,
						actualSessionId,
					),
				),
			);

			for (const grp of groupResults) {
				results.push(...grp);
			}

			// Check if we can proceed after each parallel group
			const canProceed = this.supervisor.canProceed(
				results.map((r) => ({
					domainId: r.domainId,
					status:
						r.confidence > 0 ? ("completed" as const) : ("error" as const),
				})),
			);

			if (!canProceed.proceed) {
				return {
					success: false,
					data: { error: canProceed.reason },
					conflicts: [],
					traceId,
					sessionId: actualSessionId,
					timings: this.supervisor.getTimings(),
				};
			}
		}

		// 3. Merge results from all domains
		const merged = this.resultMerger.merge(results);

		// 4. Resolve any conflicts
		const resolved = this.supervisor.resolveConflicts(merged.conflicts);

		// 5. Update session status
		this.sessionManager.update(actualSessionId, {
			status: merged.success ? "completed" : "failed",
		});

		return {
			success: merged.success,
			data: merged.data,
			conflicts: resolved,
			traceId,
			sessionId: actualSessionId,
			timings: this.supervisor.getTimings(),
		};
	}

	/** Run one decomposed step on its domain agent; failures become zero-confidence results. */
	private async executeStep(
		stepId: string,
		steps: TaskStep[],
		context: AgentContext,
		sessionId: string,
	): Promise<StepResult[]> {
		const step = steps.find((s) => s.id === stepId);
		if (!step) return [];
		const domainAgent = this.domainAgents.get(step.domain as LatinAgentId);
		if (!domainAgent) return [];

		const startTime = new Date();
		const stepKey = `${sessionId}-${step.domain}`;
		this.sessionManager.addStep(sessionId, step.domain);

		try {
			const result = await domainAgent.receiveTask({
				id: stepId,
				goal: step.goal,
				context,
				tools: step.tools,
			});
			this.sessionManager.updateStep(sessionId, stepKey, {
				status: "completed",
				result: result.data,
				startedAt: startTime,
				completedAt: new Date(),
			});
			this.supervisor.recordTiming(step.domain, startTime, new Date());
			return [
				{
					domainId: step.domain,
					data: result.data,
					confidence: result.confidence,
				},
			];
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			this.sessionManager.updateStep(sessionId, stepKey, {
				status: "failed",
				error: message,
				startedAt: startTime,
				completedAt: new Date(),
			});
			return [
				{ domainId: step.domain, data: { error: message }, confidence: 0 },
			];
		}
	}
}
