import { OPAClient } from "@open-policy-agent/opa";
import type { OSAgentContext } from "../types/agent.types.js";
import type { OSApprovalLevel } from "../types/approval.types.js";

export interface PolicyEvaluationInput {
	toolName: string;
	input: unknown;
	context: OSAgentContext;
	approvalLevel: OSApprovalLevel;
	riskLevel?: string;
}

export interface PolicyEvaluationResult {
	decision: "allow" | "gate" | "deny";
	reason?: string;
	opaQueried: boolean;
}

export interface OPAPolicyEngineConfig {
	opaUrl: string;
}

/**
 * Policy engine that delegates approval decisions to OPA (Open Policy Agent).
 *
 * Architecture:
 * - Queries OPA REST API at /v1/data/arkelythex/vertical/{vertical}
 * - Falls back to rule-based logic when OPA unavailable
 * - OPA returns { decision: "allow"|"gate"|"deny", reason?: string }
 *
 * The OPA policy must define rules in package arkelythex.vertical.<name>.
 * Example: package arkelythex.vertical.drenyra
 */
export class OPAPolicyEngine {
	private config: OPAPolicyEngineConfig;
	private client: OPAClient | null = null;

	constructor(config: OPAPolicyEngineConfig) {
		this.config = config;
	}

	async evaluate(
		input: PolicyEvaluationInput,
	): Promise<PolicyEvaluationResult> {
		// Auto and notify levels never need OPA — skip the round trip
		if (input.approvalLevel === "auto") {
			return {
				decision: "allow",
				reason: "Auto-approved: low-risk operation",
				opaQueried: false,
			};
		}
		if (input.approvalLevel === "notify") {
			return {
				decision: "allow",
				reason: "Auto-approved: notification level",
				opaQueried: false,
			};
		}

		// Try OPA for gate/policy_gate levels
		try {
			const result = await this.queryOpa({
				vertical: input.context.vertical ?? "unknown",
				action: input.toolName,
				approvalLevel: input.approvalLevel,
				riskLevel: input.riskLevel,
				organizationId: input.context.organizationId,
				companyId: input.context.companyId,
				ruc: input.context.ruc,
			});

			if (result?.decision) {
				return {
					decision: result.decision as "allow" | "gate" | "deny",
					reason: result.reason,
					opaQueried: true,
				};
			}
		} catch {
			// OPA unavailable — fall through to fallback
		}

		return this.fallbackEvaluate(input);
	}

	private async queryOpa(
		opaInput: Record<string, unknown>,
	): Promise<{ decision?: string; reason?: string } | null> {
		if (!this.client) {
			this.client = new OPAClient(this.config.opaUrl);
		}

		const vertical = (opaInput.vertical as string) ?? "os";
		const policyPath = `arkelythex/vertical/${vertical}`;

		const result = await this.client.evaluate<
			Record<string, unknown>,
			{ decision?: string; reason?: string }
		>(policyPath, opaInput);

		if (result && typeof result === "object" && "decision" in result) {
			return result as { decision: string; reason?: string };
		}

		return null;
	}

	/**
	 * Quick health check against the OPA server.
	 * Returns true if OPA responds, false if unavailable.
	 */
	async healthCheck(): Promise<boolean> {
		try {
			const url = `${this.config.opaUrl.replace(/\/+$/, "")}/v1/data/`;
			const response = await fetch(url, {
				signal: AbortSignal.timeout(2_000),
			});
			return response.ok;
		} catch {
			return false;
		}
	}

	private fallbackEvaluate(
		input: PolicyEvaluationInput,
	): PolicyEvaluationResult {
		if (input.approvalLevel === "policy_gate") {
			return {
				decision: "gate",
				reason:
					"Policy gate requires human approval with governance review (fallback: OPA unavailable)",
				opaQueried: false,
			};
		}

		if (input.approvalLevel === "gate") {
			return {
				decision: "gate",
				reason: "Action requires human approval (fallback: OPA unavailable)",
				opaQueried: false,
			};
		}

		return {
			decision: "gate",
			reason: "Unexpected approval level, defaulting to gate",
			opaQueried: false,
		};
	}
}
