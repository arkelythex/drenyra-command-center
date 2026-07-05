/**
 * PolicyEngine — Central policy evaluation for AI control plane.
 *
 * Wraps resolvePolicyDecision (pure function) with AgentRegistry, ToolRegistry,
 * and TraceEvidenceStore to provide a complete policy evaluation pipeline.
 * Fail-closed: any error results in an explicit denial.
 */

import type { PermissionService } from "../governance/permission-service";
import type { AgentRegistry } from "./agent-registry";
import type {
	AgentCapability,
	GovernanceBundleResult,
	TenantCompanyRucScope,
	ToolActionInput,
} from "./contracts";
import { evaluateFiscalPolicy } from "./fiscal-policy";
import type {
	FiscalPolicyInput,
	FiscalPolicyResult,
} from "./fiscal-policy.types";
import { resolvePolicyDecision, scopeMatches } from "./policy-resolution";
import type { ToolRegistry } from "./tool-registry";
import type { EvidenceTraceBundle, TraceEvidenceStore } from "./trace-evidence";

// ============================================================================
// Types
// ============================================================================

export interface PolicyEvaluationInput {
	traceId: string;
	agentId: string;
	requestedScope: TenantCompanyRucScope;
	requestedCapability: string;
	requestedTool: string;
	action: "read" | "write" | "execute" | "admin";
	evidence?: Record<string, unknown>;
	fiscalPolicy?: Partial<
		Omit<FiscalPolicyInput, "traceId" | "toolName" | "action">
	>;
}

export interface PolicyEngineResult {
	allowed: boolean;
	violations: string[];
	evidenceRefs: string[];
	fiscalPolicy?: FiscalPolicyResult;
}

// ============================================================================
// PolicyEngine
// ============================================================================

export class PolicyEngine {
	constructor(
		private agentRegistry: AgentRegistry,
		private toolRegistry: ToolRegistry,
		private evidenceStore: TraceEvidenceStore,
		private permissionService?: PermissionService,
	) {}

	/**
	 * Return the PermissionService instance (if configured).
	 * Used for tool-level permission checks outside evaluate().
	 */
	getPermissionService(): PermissionService | undefined {
		return this.permissionService;
	}

	// ======================================================================
	// PUBLIC API
	// ======================================================================

	/**
	 * Evaluate a policy decision for a given input.
	 *
	 * 1. Lookup agent in AgentRegistry
	 * 2. Lookup tool in ToolRegistry
	 * 3. Verify agent is registered and active
	 * 4. Verify requested capability is in agent's capabilities list
	 * 5. Verify requested tool is in agent's allowedTools list
	 * 6. Verify scope matches (tenant/RUC isolation)
	 * 7. Call resolvePolicyDecision()
	 * 8. Save evidence to TraceEvidenceStore
	 * 9. Return GovernanceBundleResult
	 */
	async evaluate(
		input: PolicyEvaluationInput,
	): Promise<GovernanceBundleResult> {
		try {
			return await this.evaluateInternal(input);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Unknown policy engine error";

			return {
				traceId: input.traceId,
				agentId: input.agentId,
				toolName: input.requestedTool,
				allowed: false,
				riskTier: "T0",
				requiresApproval: false,
				approvalState: "rejected",
				violations: [`PolicyEngine error: ${message}`],
				evidenceRefs: [],
			};
		}
	}

	/**
	 * Evaluate a tool action using context extracted from AgentContext.
	 */
	async evaluateToolAction(
		input: ToolActionInput,
	): Promise<GovernanceBundleResult> {
		const scope: TenantCompanyRucScope = {
			tenantId: input.context.tenantId,
			organizationId: input.context.organizationId,
			companyId: input.context.companyId,
			ruc: input.context.ruc,
		};

		return this.evaluate({
			traceId: input.traceId,
			agentId: input.agentId,
			requestedScope: scope,
			requestedCapability: "advisory.review",
			requestedTool: input.toolName,
			action: input.action,
		});
	}

	// ======================================================================
	// INTERNAL
	// ======================================================================

	private async evaluateInternal(
		input: PolicyEvaluationInput,
	): Promise<GovernanceBundleResult> {
		// 1. Lookup agent in AgentRegistry
		const agent = await this.agentRegistry.getAgent(input.agentId);
		if (!agent) {
			return this.buildDenied(input, [
				`Agent "${input.agentId}" is not registered`,
			]);
		}

		// 2. Lookup tool in ToolRegistry
		const tool = await this.toolRegistry.getTool(input.requestedTool);
		if (!tool) {
			return this.buildDenied(input, [
				`Tool "${input.requestedTool}" is not registered in ToolRegistry`,
			]);
		}

		// 6. Verify scope matches (tenant/RUC isolation)
		if (!scopeMatches(agent.tenantScope, input.requestedScope)) {
			return this.buildDenied(input, [
				"Tenant/RUC scope mismatch: requested scope does not match agent's registered scope",
			]);
		}

		// 3-5. Call resolvePolicyDecision which handles:
		//   - capability check
		//   - tool allowlist check
		//   - wildcard block
		const decision = resolvePolicyDecision({
			traceId: input.traceId,
			registryEntry: agent,
			requestedScope: input.requestedScope,
			requestedCapability: input.requestedCapability as AgentCapability,
			requestedTool: input.requestedTool,
		});

		// ====================================================================
		// P5 Granular Permission Gate
		// ====================================================================
		// Injects after policy resolution but before fiscal evaluation so that:
		//   - DENY  → short-circuit with explicit denial (never approves)
		//   - ALLOW → skips tool-level approval gate, but fiscal gate still applies
		//   - REQUIRE_APPROVAL → leaves existing behavior unchanged
		//   - no PermissionService → no effect, pure backward compat
		// ====================================================================
		let permissionOverride: "ALLOW" | "DENY" | null = null;

		if (this.permissionService) {
			const permResult = this.permissionService.canExecute(
				input.requestedTool,
				{
					companyId: input.requestedScope.companyId,
					organizationId: input.requestedScope.organizationId,
				},
			);

			if (permResult.effect === "DENY") {
				return this.buildDenied(input, [
					permResult.reason ??
						`Tool "${input.requestedTool}" is denied by permission policy`,
				]);
			}

			if (permResult.effect === "ALLOW") {
				permissionOverride = "ALLOW";
				// Tool-level approval skipped; fiscal gate still evaluated below.
				// `requiresApproval` will be set to fiscalPolicy.requiresApproval only.
			}
			// REQUIRE_APPROVAL: no change — existing behavior preserved.
		}

		const fiscalPolicy = evaluateFiscalPolicy({
			traceId: input.traceId,
			toolName: input.requestedTool,
			action: input.action,
			tenantScope: input.fiscalPolicy?.tenantScope ?? input.requestedScope,
			...input.fiscalPolicy,
		});

		const violations = [...decision.violations, ...fiscalPolicy.violations];
		const allowed = decision.allowed && fiscalPolicy.allowed;

		// When permission ALLOW is active, skip tool-level approval gate.
		// Fiscal policy approval still applies (fiscal safety first).
		const requiresApproval =
			permissionOverride === "ALLOW"
				? fiscalPolicy.requiresApproval
				: tool.requiresApproval || fiscalPolicy.requiresApproval;

		// 8. Save evidence
		await this.persistEvidence(input, decision, fiscalPolicy);

		return {
			traceId: decision.traceId,
			agentId: input.agentId,
			toolName: input.requestedTool,
			allowed,
			riskTier: tool.riskTier,
			requiresApproval,
			approvalState: allowed
				? fiscalPolicy.requiresApproval
					? "proposed"
					: decision.approvalState
				: "rejected",
			violations,
			evidenceRefs: [
				input.traceId,
				...(input.fiscalPolicy?.evidenceRefs ?? []),
			],
			fiscalPolicy,
		};
	}

	private async persistEvidence(
		input: PolicyEvaluationInput,
		decision: Awaited<ReturnType<typeof resolvePolicyDecision>>,
		fiscalPolicy: FiscalPolicyResult,
	): Promise<void> {
		const bundle: EvidenceTraceBundle = {
			traceId: input.traceId,
			tenantScope: input.requestedScope,
			redactionStatus: "redacted",
			toolCalls: [input.requestedTool],
			rationale: this.buildRationale(decision.violations, fiscalPolicy),
			evidence: [],
		};

		this.evidenceStore.save(bundle);
	}

	private buildRationale(
		baseViolations: readonly string[],
		fiscalPolicy: FiscalPolicyResult,
	): string {
		const violations = [...baseViolations, ...fiscalPolicy.violations];
		const status = violations.length > 0 ? "Policy denied" : "Policy approved";
		return `${status}; fiscalPolicy=${JSON.stringify({
			sunatImpact: fiscalPolicy.sunatImpact,
			approvalLevel: fiscalPolicy.approvalLevel,
			violations: fiscalPolicy.violations,
		})}`;
	}

	private buildDenied(
		input: PolicyEvaluationInput,
		reasons: string[],
	): GovernanceBundleResult {
		return {
			traceId: input.traceId,
			agentId: input.agentId,
			toolName: input.requestedTool,
			allowed: false,
			riskTier: "T0",
			requiresApproval: false,
			approvalState: "rejected",
			violations: reasons,
			evidenceRefs: [],
		};
	}
}
