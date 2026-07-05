import {
	AgentCapabilitySchema,
	type AgentRegistryEntry,
	AgentRegistryEntrySchema,
	canHandoffToDeterministicFlow,
	lookupAllowedToolsForCapability,
	resolvePolicyDecision,
} from "@drenyra/ai";
import {
	normalizeLegacyCapabilityToolsLookup,
	normalizeLegacyPolicyPreviewInput,
} from "@drenyra/drenyra-orchestrator";
import { Elysia, t } from "elysia";
import { fail, ok } from "../../shared/api-response";

const agentRegistry: Record<string, AgentRegistryEntry> = {
	"agent-reconciliation": AgentRegistryEntrySchema.parse({
		agentId: "agent-reconciliation",
		purpose: "Reconciliation advisory",
		tenantScope: {
			tenantId: "tenant-1",
			organizationId: "org-1",
			companyId: "company-1",
			ruc: "20123456789",
		},
		capabilities: ["advisory.review", "advisory.explain"],
		allowedTools: ["ledger.read", "sunat.lookup"],
		approvalClass: "financial-controller",
		supportedSurfaces: ["api"],
	}),
};

const policyPreviewBodySchema = t.Object({
	traceId: t.String({ minLength: 1 }),
	agentId: t.String({ minLength: 1 }),
	tenantId: t.String({ minLength: 1 }),
	organizationId: t.String({ minLength: 1 }),
	companyId: t.String({ minLength: 1 }),
	ruc: t.String({ pattern: "^[0-9]{11}$" }),
	requestedCapability: t.String({ minLength: 1 }),
	requestedTool: t.String({ minLength: 1 }),
});

const capabilityLookupBodySchema = t.Object({
	agentId: t.String({ minLength: 1 }),
	requestedCapability: t.String({ minLength: 1 }),
});

export const compatControlPlaneRoute = new Elysia({ prefix: "/compat" })
	.post(
		"/policy/preview",
		({ body, set }) => {
			const registryEntry = agentRegistry[body.agentId];
			if (!registryEntry) {
				set.status = 404;
				return fail("Agent registry entry not found", "AGENT_NOT_FOUND");
			}

			const normalized = normalizeLegacyPolicyPreviewInput({
				traceId: body.traceId,
				registryEntry: { agentId: registryEntry.agentId },
				tenantId: body.tenantId,
				organizationId: body.organizationId,
				companyId: body.companyId,
				ruc: body.ruc,
				requestedCapability: body.requestedCapability,
				requestedTool: body.requestedTool,
			});

			const capability = AgentCapabilitySchema.safeParse(
				normalized.requestedCapability,
			);
			if (!capability.success) {
				set.status = 400;
				return fail("Requested capability is invalid", "VALIDATION_ERROR");
			}

			const decision = resolvePolicyDecision({
				traceId: normalized.traceId,
				registryEntry,
				requestedScope: normalized.requestedScope,
				requestedCapability: capability.data,
				requestedTool: normalized.requestedTool,
			});

			return ok({
				...decision,
				canHandoffToDeterministic: canHandoffToDeterministicFlow({
					approvalState: decision.approvalState,
					decisionAllowed: decision.allowed,
				}),
			});
		},
		{
			body: policyPreviewBodySchema,
			error({ code, set }) {
				if (code === "VALIDATION") {
					set.status = 422;
					return fail(
						"Invalid ai-swarm compatibility request",
						"VALIDATION_ERROR",
					);
				}
				return;
			},
		},
	)
	.post(
		"/capabilities/tools",
		({ body, set }) => {
			const registryEntry = agentRegistry[body.agentId];
			if (!registryEntry) {
				set.status = 404;
				return fail("Agent registry entry not found", "AGENT_NOT_FOUND");
			}

			const normalized = normalizeLegacyCapabilityToolsLookup({
				registryEntry: { agentId: registryEntry.agentId },
				requestedCapability: body.requestedCapability,
			});

			const capability = AgentCapabilitySchema.safeParse(
				normalized.requestedCapability,
			);
			if (!capability.success) {
				set.status = 400;
				return fail("Requested capability is invalid", "VALIDATION_ERROR");
			}

			return ok({
				allowedTools: lookupAllowedToolsForCapability({
					registryEntry,
					requestedCapability: capability.data,
				}),
			});
		},
		{
			body: capabilityLookupBodySchema,
			error({ code, set }) {
				if (code === "VALIDATION") {
					set.status = 422;
					return fail(
						"Invalid ai-swarm compatibility request",
						"VALIDATION_ERROR",
					);
				}
				return;
			},
		},
	);
