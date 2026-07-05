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
	private governanceValidator?(
		toolName: string,
		input: unknown,
		context: AgentContext,
	): Promise<GovernanceBundleResult>;

	private notifyCallback?: (request: ApprovalRequest) => Promise<void>;

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

	async approve(
		approvalId: string,
		reviewerId: string,
		reviewerRole: string,
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

		this.store.update(approvalId, {
			state: "approved",
			decidedAt: new Date(),
			reviewerId,
			reviewerRole,
		});

		return { success: true, data: this.store.get(approvalId)! };
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

		this.store.update(approvalId, {
			state: "rejected",
			decidedAt: new Date(),
			reviewerId,
			rationale,
		});

		return { success: true, data: this.store.get(approvalId)! };
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
