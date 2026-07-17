import crypto from "node:crypto";
import type { PlatformEventBus } from "@arkelythex/core/events";
import { PlatformEventTypes } from "@arkelythex/core/events";
import type { OPAPolicyEngine } from "../policy/opa-policy-engine.js";
import { traceApproval } from "../telemetry/operations.js";
import type { OSAgentContext } from "../types/agent.types.js";
import type { OSApprovalLevel } from "../types/approval.types.js";
import type { OSApprovalRequest } from "./approval.types.js";
import type { OSApprovalStore } from "./approval-store.js";

export interface ApprovalEvaluationParams {
	toolName: string;
	input: unknown;
	context: OSAgentContext;
	approvalLevel: OSApprovalLevel;
	riskLevel?: string;
}

export interface ApprovalEvaluationResult {
	allowed: boolean;
	requiresAction: boolean;
	requestId?: string;
	reason?: string;
	actionType?: "auto" | "notify";
	opaDecision?: "allow" | "gate" | "deny";
}

export class OSApprovalGateEngine {
	private store: OSApprovalStore;
	private policyEngine?: OPAPolicyEngine;
	private eventBus?: PlatformEventBus;

	constructor(
		store: OSApprovalStore,
		policyEngine?: OPAPolicyEngine,
		eventBus?: PlatformEventBus,
	) {
		this.store = store;
		this.policyEngine = policyEngine;
		this.eventBus = eventBus;
	}

	async evaluate(
		params: ApprovalEvaluationParams,
	): Promise<ApprovalEvaluationResult> {
		const requestId = `apr_${crypto.randomUUID()}`;
		return traceApproval(
			requestId,
			params.context.vertical,
			params.approvalLevel,
			async (_span) => {
				if (params.approvalLevel === "auto") {
					return { allowed: true, requiresAction: false, actionType: "auto" };
				}

				if (params.approvalLevel === "notify") {
					return { allowed: true, requiresAction: false, actionType: "notify" };
				}

				let opaDecision: "allow" | "gate" | "deny" | undefined;

				// Delegate gate/policy_gate to OPA when policy engine is available
				if (
					this.policyEngine &&
					(params.approvalLevel === "gate" ||
						params.approvalLevel === "policy_gate")
				) {
					try {
						const opaResult = await this.policyEngine.evaluate({
							toolName: params.toolName,
							input: params.input,
							context: params.context,
							approvalLevel: params.approvalLevel,
							riskLevel: params.riskLevel,
						});

						opaDecision = opaResult.decision;

						if (opaDecision === "allow") {
							return {
								allowed: true,
								requiresAction: false,
								opaDecision: "allow",
							};
						}

						if (opaDecision === "deny") {
							const request: OSApprovalRequest = {
								id: `apr_${crypto.randomUUID()}`,
								toolName: params.toolName,
								input: params.input,
								context: params.context,
								approvalLevel: params.approvalLevel,
								state: "proposed",
								proposedAt: new Date(),
							};
							await this.store.propose(request);
							await this.store.reject(
								request.id,
								"opa-policy-engine",
								opaResult.reason ?? "Denied by OPA policy",
							);

							if (this.eventBus) {
								await this.eventBus.publish(
									PlatformEventTypes.OsApprovalResolved,
									{
										requestId: request.id,
										resolution: "rejected",
										reviewerId: "opa-policy-engine",
										rationale: opaResult.reason ?? "Denied by OPA policy",
									},
									{
										source: "approval-gate-engine",
										correlationId: params.context.traceId,
									},
								);
							}

							return {
								allowed: false,
								requiresAction: false,
								requestId: request.id,
								reason: opaResult.reason ?? "Denied by OPA policy",
								opaDecision: "deny",
							};
						}

						// decision === "gate" → fall through to human approval
					} catch {
						// OPA error → fall through to human approval (current behavior)
					}
				}

				const request: OSApprovalRequest = {
					id: `apr_${crypto.randomUUID()}`,
					toolName: params.toolName,
					input: params.input,
					context: params.context,
					approvalLevel: params.approvalLevel,
					state: "proposed",
					proposedAt: new Date(),
				};

				await this.store.propose(request);

				if (this.eventBus) {
					await this.eventBus.publish(
						PlatformEventTypes.OsApprovalRequested,
						{
							requestId: request.id,
							toolName: params.toolName,
							vertical: params.context.vertical,
							approvalLevel: params.approvalLevel,
						},
						{
							source: "approval-gate-engine",
							correlationId: params.context.traceId,
						},
					);
				}

				return {
					allowed: false,
					requiresAction: true,
					requestId: request.id,
					reason:
						params.approvalLevel === "policy_gate"
							? "Policy gate requires human approval with governance review"
							: "Action requires human approval",
					opaDecision,
				};
			},
		);
	}

	async approve(
		requestId: string,
		reviewerId: string,
		rationale?: string,
		correlationId?: string,
	): Promise<void> {
		await this.store.approve(requestId, reviewerId, rationale);

		if (this.eventBus) {
			await this.eventBus.publish(
				PlatformEventTypes.OsApprovalResolved,
				{ requestId, resolution: "approved", reviewerId, rationale },
				{ source: "approval-gate-engine", correlationId },
			);
		}
	}

	async reject(
		requestId: string,
		reviewerId: string,
		rationale?: string,
		correlationId?: string,
	): Promise<void> {
		await this.store.reject(requestId, reviewerId, rationale);

		if (this.eventBus) {
			await this.eventBus.publish(
				PlatformEventTypes.OsApprovalResolved,
				{ requestId, resolution: "rejected", reviewerId, rationale },
				{ source: "approval-gate-engine", correlationId },
			);
		}
	}

	async getPending(): Promise<OSApprovalRequest[]> {
		return this.store.getPending();
	}

	async getRejected(): Promise<OSApprovalRequest[]> {
		return this.store.list({ state: "rejected" });
	}
}
