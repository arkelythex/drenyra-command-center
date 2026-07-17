import crypto from "node:crypto";

import type { PlatformEventBus } from "@arkelythex/core/events";
import { PlatformEventTypes } from "@arkelythex/core/events";
import type { OSApprovalGateEngine } from "../approval/approval-gate-engine.js";
import type { GeneralizedIntentDetector } from "../intent/intent-detector.js";
import type { VerticalAgentRegistry } from "../registry/vertical-agent-registry.js";
import { traceSupervisor } from "../telemetry/operations.js";
import type { IAgentRunStore } from "../traceability/types.js";
import type {
	OSAgentContext,
	OSAgentMetrics,
	OSAgentResult,
	OSIntent,
} from "../types/agent.types.js";
import { VerticalType } from "../types/vertical.types.js";

function zeroMetrics(duration = 0): OSAgentMetrics {
	return { duration, tokensUsed: 0, cost: 0 };
}

export interface OSSupervisorOptions {
	defaultVertical?: VerticalType;
	approvalGate?: OSApprovalGateEngine;
	runStore?: IAgentRunStore;
	eventBus?: PlatformEventBus;
}

export interface OSSupervisorResult<T = unknown> extends OSAgentResult<T> {
	intent?: OSIntent;
	vertical?: VerticalType;
	requestId?: string;
}

/**
 * OSSupervisorAgent — cross-vertical intent router.
 *
 * 1. Receives user input as text + OSAgentContext
 * 2. Uses GeneralizedIntentDetector to resolve the intent (vertical + action)
 * 3. Uses VerticalAgentRegistry to find the right agent for that vertical
 * 4. Delegates execution to the resolved agent
 * 5. Falls back to defaultVertical (Drenyra) when no match or agent found
 *
 * ## Fallback behavior
 * When no agent is registered for the detected vertical:
 * - If the detected vertical IS the default (Drenyra): returns success: true
 *   with a warning (Drenyra is always available as a catch-all).
 * - If the detected vertical is NOT the default: returns success: false
 *   with an error message. This asymmetric behavior is intentional —
 *   Drenyra is the OS-wide fallback vertical for general queries.
 *
 * ## Type safety note (Phase 3B)
 * The `execute()` call uses `as never` for the task parameter because
 * handleInput() receives a raw string while each vertical agent expects
 * a typed task object. Phase 3B should introduce proper task shape
 * mapping per registered agent.
 */
export class OSSupervisorAgent {
	private registry: VerticalAgentRegistry;
	private detector: GeneralizedIntentDetector;
	private options: OSSupervisorOptions;
	private defaultVertical: VerticalType;

	constructor(
		registry: VerticalAgentRegistry,
		detector: GeneralizedIntentDetector,
		options: OSSupervisorOptions = {},
	) {
		this.registry = registry;
		this.detector = detector;
		this.options = options;
		this.defaultVertical = options.defaultVertical ?? VerticalType.DRENYRA;
	}

	async handleInput<T = unknown>(
		input: string,
		context: OSAgentContext,
	): Promise<OSSupervisorResult<T>> {
		return traceSupervisor(
			input,
			context.vertical,
			{
				"os.tenant_id": context.tenantId,
				"os.correlation_id": context.traceId,
			},
			async (_span) => {
				if (!input || input.trim().length === 0) {
					return {
						success: false,
						data: null,
						errors: ["Empty input: cannot process empty request"],
						metrics: zeroMetrics(),
					};
				}

				const startTime = Date.now();

				const intent = await this.detector.detectIntent(input);

				const agent = this.registry.resolve(intent);

				if (!agent) {
					if (intent.vertical === this.defaultVertical) {
						return {
							success: true,
							data: null,
							metrics: zeroMetrics(Date.now() - startTime),
							warnings: [
								`No specialized agent for '${intent.vertical}'; handled by default`,
							],
							intent,
							vertical: this.defaultVertical,
						};
					}

					const fallbackIntent: OSIntent = {
						vertical: this.defaultVertical,
						action: "fallback",
						confidence: 0.2,
						originalInput: input,
					};
					const fallbackAgent = this.registry.resolve(fallbackIntent);
					if (!fallbackAgent) {
						return {
							success: false,
							data: null,
							errors: [
								`No agent registered for vertical '${intent.vertical}' and no fallback available`,
							],
							metrics: zeroMetrics(Date.now() - startTime),
							intent,
							vertical: intent.vertical,
						};
					}
					const result = await fallbackAgent.execute(input as never, {
						...context,
						vertical: this.defaultVertical,
					});

					if (this.options.eventBus) {
						await this.options.eventBus.publish(
							PlatformEventTypes.OsAgentExecuted,
							{
								vertical: this.defaultVertical,
								agentId: fallbackAgent.id,
								success: result.success,
								durationMs: Date.now() - startTime,
								tokensUsed: result.metrics.tokensUsed,
								approvalStatus: "auto",
							},
							{ source: "os-supervisor", correlationId: context.traceId },
						);
					}

					return {
						...result,
						intent: fallbackIntent,
						vertical: this.defaultVertical,
					} as OSSupervisorResult<T>;
				}

				let runApprovalStatus: "auto" | "approved" | "rejected" = "auto";
				let runRequestId: string | undefined;

				if (this.options.approvalGate) {
					try {
						const level = agent.approvalLevel ?? "auto";
						const evalResult = await this.options.approvalGate.evaluate({
							toolName: agent.id,
							input,
							context: { ...context, vertical: intent.vertical },
							approvalLevel: level,
						});

						runRequestId = evalResult.requestId;

						if (!evalResult.allowed) {
							if (this.options.runStore) {
								const endTime = Date.now();
								this.options.runStore.record({
									id: `run_${crypto.randomUUID()}`,
									vertical: intent.vertical,
									userId: context.userId,
									prompt: input,
									response:
										evalResult.reason ?? "Action rejected by approval gate",
									// TODO(phase-4): track tools used during execution
									tools: [],
									approvalStatus: "rejected",
									// TODO(phase-4): compute riskLevel from intent/context instead of approvalLevel
									riskLevel: agent.approvalLevel ?? "auto",
									tokensUsed: 0,
									durationMs: endTime - startTime,
									timestamp: new Date(),
								});
							}

							return {
								success: false,
								data: null,
								errors: [evalResult.reason ?? "Action requires approval"],
								metrics: zeroMetrics(Date.now() - startTime),
								intent,
								vertical: intent.vertical,
								requestId: evalResult.requestId,
							};
						}

						runApprovalStatus = "auto";
					} catch (error) {
						return {
							success: false,
							data: null as T,
							metrics: zeroMetrics(),
							vertical: intent.vertical,
							intent,
							errors: [
								`Approval gate error: ${error instanceof Error ? error.message : "Unknown error"}`,
							],
							warnings: [],
						};
					}
				}

				const result = await agent.execute(input as never, {
					...context,
					vertical: intent.vertical,
				});

				if (this.options.runStore) {
					const endTime = Date.now();
					this.options.runStore.record({
						id: `run_${crypto.randomUUID()}`,
						vertical: intent.vertical,
						userId: context.userId,
						prompt: input,
						response:
							result.data != null
								? JSON.stringify(result.data).slice(0, 2000)
								: (result.errors?.join("; ") ?? ""),
						// TODO(phase-4): track tools used during execution
						tools: [],
						approvalStatus: runApprovalStatus,
						// TODO(phase-4): compute riskLevel from intent/context instead of approvalLevel
						riskLevel: agent.approvalLevel ?? "auto",
						tokensUsed: result.metrics.tokensUsed,
						durationMs: endTime - startTime,
						timestamp: new Date(),
					});
				}

				if (this.options.eventBus) {
					await this.options.eventBus.publish(
						PlatformEventTypes.OsAgentExecuted,
						{
							vertical: intent.vertical,
							agentId: agent.id,
							success: result.success,
							durationMs: Date.now() - startTime,
							tokensUsed: result.metrics.tokensUsed,
							approvalStatus: runApprovalStatus,
						},
						{ source: "os-supervisor", correlationId: context.traceId },
					);
				}

				return {
					...result,
					intent,
					vertical: intent.vertical,
					requestId: runRequestId,
				} as OSSupervisorResult<T>;
			},
		);
	}
}
