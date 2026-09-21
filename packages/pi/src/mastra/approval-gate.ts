import type { AgentContext } from "../types/agent-context";
import type { AgentTool } from "../types/agent-tool";
import type {
	ApprovalRequest,
	GovernanceBundleResult,
} from "../types/approval-gate";
import type { ApprovalStore } from "./approval-store";

type ActionResult<T> =
	| { success: true; data: T }
	| { success: false; error: string };

/**
 * Mastra-based ApprovalGateEngine.
 *
 * Uses Mastra's tool execution but adds the fiscal governance layer:
 * - "auto" → execute directly
 * - "notify" → execute + notify
 * - "gate" → human approval required
 * - "fiscal_gate" → governance bundle + human approval
 */
export class ApprovalGateEngine {
	private governanceValidator?:
		| ((
				toolName: string,
				input: unknown,
				context: AgentContext,
		  ) => Promise<GovernanceBundleResult>)
		| undefined;

	private notifyCallback?:
		| ((request: ApprovalRequest) => Promise<void>)
		| undefined;

	constructor(
		private store: ApprovalStore,
		governanceValidator?: (
			toolName: string,
			input: unknown,
			context: AgentContext,
		) => Promise<GovernanceBundleResult>,
		notifyCallback?: (request: ApprovalRequest) => Promise<void>,
	) {
		this.governanceValidator = governanceValidator;
		this.notifyCallback = notifyCallback;
	}

	/**
	 * Execute a tool through the approval gate.
	 * Fiscal actions require governance validation + human approval.
	 */
	async executeTool<TInput, TOutput>(
		tool: AgentTool<TInput, TOutput>,
		input: TInput,
		context: AgentContext,
	): Promise<ActionResult<TOutput>> {
		const needsApproval = tool.needsApproval?.(input, context) ?? false;
		const isFiscal = tool.approvalLevel === "fiscal_gate";
		const isGate = tool.approvalLevel === "gate";

		if (!needsApproval && !isGate && !isFiscal) {
			try {
				const data = await tool.execute(input, context);
				return { success: true, data };
			} catch (error) {
				return {
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				};
			}
		}

		// Build governance bundle for fiscal actions
		const governanceResult = isFiscal
			? await this.governanceValidator?.(tool.name, input, context)
			: undefined;

		const request: ApprovalRequest = {
			id: crypto.randomUUID(),
			toolName: tool.name,
			input,
			context,
			approvalLevel: tool.approvalLevel,
			state: "proposed",
			proposedAt: new Date(),
			governanceResult,
		};

		this.store.save(request);

		if (isFiscal || isGate) {
			await this.notifyCallback?.(request);
			return {
				success: false,
				error: `Approval required: ${request.id}`,
			};
		}

		// "notify" level: execute but notify
		try {
			const data = await tool.execute(input, context);

			this.store.update(request.id, {
				state: "approved",
				decidedAt: new Date(),
				reviewerId: "system",
				reviewerRole: "auto-notify",
			});

			await this.notifyCallback?.(request);
			return { success: true, data };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Approve a pending request. For a `fiscal_gate` request with a
	 * governance validator configured, this does NOT finalize on the first
	 * call: it accumulates the approval, re-asks the Core gate whether the
	 * accumulated approvals are sufficient (e.g. two distinct approvers at
	 * R3), and only transitions to `"approved"` when the gate agrees. Until
	 * then the request stays `"validated"`, allowing further `approve()`
	 * calls from additional reviewers.
	 */
	async approve(
		approvalId: string,
		reviewerId: string,
		reviewerRole: string,
		reason?: string,
	): Promise<ActionResult<ApprovalRequest>> {
		const request = this.store.get(approvalId);

		if (!request) {
			return { success: false, error: `Approval ${approvalId} not found` };
		}

		if (request.state !== "proposed" && request.state !== "validated") {
			return {
				success: false,
				error: `Approval ${approvalId} is in state '${request.state}', cannot approve`,
			};
		}

		const isFiscal = request.approvalLevel === "fiscal_gate";

		if (isFiscal && this.governanceValidator) {
			const updatedApprovals: ApprovalRequest["approvals"] = [
				...(request.approvals ?? []),
				{
					approverId: reviewerId,
					reviewerRole,
					at: new Date().toISOString(),
					reason,
				},
			];

			const mergedInput =
				typeof request.input === "object" && request.input !== null
					? {
							...request.input,
							approvals: updatedApprovals.map(
								({ approverId, at, reason: approvalReason }) => ({
									approverId,
									at,
									...(approvalReason !== undefined
										? { reason: approvalReason }
										: {}),
								}),
							),
						}
					: request.input;

			const governanceResult = await this.governanceValidator(
				request.toolName,
				mergedInput,
				request.context,
			);

			if (!governanceResult.valid) {
				const validated: ApprovalRequest = {
					...request,
					state: "validated",
					approvals: updatedApprovals,
					governanceResult,
				};
				this.store.update(approvalId, validated);
				return {
					success: false,
					error: `Additional approval required: ${
						governanceResult.reasons.join("; ") ||
						"governance gate not satisfied"
					}`,
				};
			}

			const approved: ApprovalRequest = {
				...request,
				state: "approved",
				decidedAt: new Date(),
				reviewerId,
				reviewerRole,
				approvals: updatedApprovals,
				governanceResult,
			};
			this.store.update(approvalId, approved);

			return { success: true, data: approved };
		}

		const approved: ApprovalRequest = {
			...request,
			state: "approved",
			decidedAt: new Date(),
			reviewerId,
			reviewerRole,
		};
		this.store.update(approvalId, approved);

		return { success: true, data: approved };
	}

	async reject(
		approvalId: string,
		reviewerId: string,
		rationale?: string,
	): Promise<ActionResult<ApprovalRequest>> {
		const request = this.store.get(approvalId);

		if (!request) {
			return { success: false, error: `Approval ${approvalId} not found` };
		}

		const rejected: ApprovalRequest = {
			...request,
			state: "rejected",
			decidedAt: new Date(),
			reviewerId,
			rationale,
		};
		this.store.update(approvalId, rejected);

		return { success: true, data: rejected };
	}

	getPendingApprovals(context?: AgentContext): ApprovalRequest[] {
		const pending = this.store
			.getAll()
			.filter((r) => r.state === "proposed" || r.state === "validated");

		if (!context) {
			return pending;
		}

		return pending.filter((r) => r.context.tenantId === context.tenantId);
	}
}
