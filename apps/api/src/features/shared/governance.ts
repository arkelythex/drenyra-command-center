import { z } from "zod";
import {
	type AutonomyDecisionTrace,
	type AutonomyEvaluationResult,
	AutonomyPolicyService,
	type GovernanceAction,
	type TaskPriority,
} from "./autonomy-policy";
import { recordGovernancePolicyDecisionMetric } from "./governance.metrics";

/**
 * GovernanceApprovalSchema const.
 *
 * @example
 * ```ts
 * console.log(GovernanceApprovalSchema);
 * ```
 */
export const GovernanceApprovalSchema = z.object({
	approvedBy: z.string().min(1),
	reason: z.string().min(3),
	approvedAt: z.string().optional(),
});

/**
 * GovernanceSchema const.
 *
 * @example
 * ```ts
 * console.log(GovernanceSchema);
 * ```
 */
export const GovernanceSchema = z
	.object({
		objective: z.string().min(1).max(160).optional(),
		estimatedAmountPen: z.number().min(0).optional(),
		riskScore: z.number().min(0).max(1).optional(),
		approval: GovernanceApprovalSchema.optional(),
	})
	.optional();

/**
 * GovernanceInput interface.
 *
 * @example
 * ```ts
 * const value: GovernanceInput = {} as GovernanceInput;
 * console.log(value);
 * ```
 */
export interface GovernanceInput {
	objective?: string;
	estimatedAmountPen?: number;
	riskScore?: number;
	approval?: {
		approvedBy: string;
		reason: string;
		approvedAt?: string;
	};
}

/**
 * GovernanceBlockedResponse interface.
 *
 * @example
 * ```ts
 * const value: GovernanceBlockedResponse = {} as GovernanceBlockedResponse;
 * console.log(value);
 * ```
 */
export interface GovernanceBlockedResponse {
	success: false;
	error: string;
	code: string;
	governance: AutonomyDecisionTrace;
}

/**
 * GovernanceEvaluation type.
 *
 * @example
 * ```ts
 * const value: GovernanceEvaluation = {} as GovernanceEvaluation;
 * console.log(value);
 * ```
 */
export type GovernanceEvaluation =
	| { allowed: true; trace: AutonomyDecisionTrace }
	| {
			allowed: false;
			decision: AutonomyEvaluationResult;
			response: GovernanceBlockedResponse;
	  };

/**
 * enforceGovernancePolicy operation.
 *
 * @param options - Input for options.
 * @returns Result of enforceGovernancePolicy.
 * @example
 * ```ts
 * const result = await enforceGovernancePolicy({});
 * console.log(result);
 * ```
 */
export async function enforceGovernancePolicy(options: {
	action: GovernanceAction;
	priority: TaskPriority;
	governance?: GovernanceInput;
	fallbackObjective?: string;
	set?: { status?: number | string };
	onBlocked?: (decision: AutonomyEvaluationResult) => Promise<void> | void;
}): Promise<GovernanceEvaluation> {
	const decision = AutonomyPolicyService.evaluate({
		action: options.action,
		priority: options.priority,
		objective: options.governance?.objective ?? options.fallbackObjective,
		estimatedAmountPen: options.governance?.estimatedAmountPen,
		riskScore: options.governance?.riskScore,
		approval: options.governance?.approval,
	});

	if (!decision.allowed) {
		recordGovernancePolicyDecisionMetric({
			action: options.action,
			decision: "BLOCK",
			reasonCode: decision.code ?? "AUTONOMY_BLOCKED",
		});
		if (options.set) {
			options.set.status = decision.statusCode ?? 403;
		}
		if (options.onBlocked) {
			await options.onBlocked(decision);
		}
		return {
			allowed: false,
			decision,
			response: {
				success: false,
				error: decision.message ?? "Execution blocked by autonomy policy",
				code: decision.code ?? "AUTONOMY_BLOCKED",
				governance: decision.trace,
			},
		};
	}

	recordGovernancePolicyDecisionMetric({
		action: options.action,
		decision: "ALLOW",
		reasonCode: resolveAllowReasonCode(decision.trace.reason),
	});

	return {
		allowed: true,
		trace: decision.trace,
	};
}

function resolveAllowReasonCode(reason: string): string {
	const normalized = reason.toLowerCase();
	if (normalized.includes("approval")) return "ALLOWED_WITH_APPROVAL";
	if (normalized.includes("disabled")) return "ALLOWED_AUTONOMY_DISABLED";
	return "ALLOWED_BY_POLICY";
}
