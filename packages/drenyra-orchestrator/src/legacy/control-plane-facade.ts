/**
 * Control Plane Facade — ported from @arkelythex/agent-swarm
 *
 * Provides normalizeLegacyCapabilityToolsLookup, normalizeLegacyPolicyPreviewInput,
 * and createGovernanceValidator for legacy consumers migrating from agent-swarm.
 */
import type { AgentContext, GovernanceBundleResult } from "../types/index";

// ─── Types ───────────────────────────────────────────────────────

export interface CompatibilityScope {
	tenantId: string;
	organizationId: string;
	companyId: string;
	ruc: string;
}

export interface CompatibilityRegistryEntry {
	agentId: string;
}

export interface LegacyPolicyPreviewInput {
	traceId: string;
	registryEntry: CompatibilityRegistryEntry;
	tenantId: string;
	organizationId: string;
	companyId: string;
	ruc: string;
	requestedCapability: string;
	requestedTool: string;
}

export interface LegacyCapabilityToolsLookupInput {
	registryEntry: CompatibilityRegistryEntry;
	requestedCapability: string;
}

export interface NormalizedLegacyPolicyPreview {
	traceId: string;
	agentId: string;
	requestedScope: CompatibilityScope;
	requestedCapability: string;
	requestedTool: string;
}

export interface NormalizedLegacyCapabilityToolsLookup {
	agentId: string;
	requestedCapability: string;
}

// ─── Normalize Functions ─────────────────────────────────────────

export const normalizeLegacyPolicyPreviewInput = (
	input: LegacyPolicyPreviewInput,
): NormalizedLegacyPolicyPreview => ({
	traceId: input.traceId,
	agentId: input.registryEntry.agentId,
	requestedScope: {
		tenantId: input.tenantId,
		organizationId: input.organizationId,
		companyId: input.companyId,
		ruc: input.ruc,
	},
	requestedCapability: input.requestedCapability,
	requestedTool: input.requestedTool,
});

export const normalizeLegacyCapabilityToolsLookup = ({
	registryEntry,
	requestedCapability,
}: LegacyCapabilityToolsLookupInput): NormalizedLegacyCapabilityToolsLookup => ({
	agentId: registryEntry.agentId,
	requestedCapability,
});

// ─── Governance Validator ────────────────────────────────────────

/**
 * Create a governance validator function compatible with ApprovalGateEngine.
 *
 * Wraps a PolicyEngine (from @arkelythex/ai/control-plane) into the
 * GovernanceValidatorFn signature expected by ApprovalGateEngine.
 *
 * Fail-closed: any error returns { valid: false }.
 */
import type { PolicyEngine } from "@arkelythex/ai/control-plane";

export function createGovernanceValidator(
	policyEngine: PolicyEngine,
): (
	toolName: string,
	input: unknown,
	context: AgentContext,
) => Promise<GovernanceBundleResult> {
	return async (
		toolName: string,
		input: unknown,
		context: AgentContext,
	): Promise<GovernanceBundleResult> => {
		try {
			const result = await policyEngine.evaluateToolAction({
				traceId: context.traceId ?? `trace-${Date.now()}`,
				agentId: context.userId ?? "unknown",
				toolName,
				input,
				context: {
					tenantId: context.tenantId,
					organizationId: context.organizationId,
					companyId: context.companyId,
					ruc: context.ruc,
					userId: context.userId,
					sessionId: context.sessionId,
					traceId: context.traceId,
				},
				action: "execute",
			});

			return {
				valid: result.allowed,
				reasons: result.violations,
				evidenceRefs: result.evidenceRefs,
			};
		} catch (err) {
			return {
				valid: false,
				reasons: [
					`PolicyEngine error: ${err instanceof Error ? err.message : String(err)}`,
				],
				evidenceRefs: [],
			};
		}
	};
}
