/**
 * Legacy — ported functions from @drenyra/agent-swarm
 *
 * Estas funciones se portearon para romper la dependencia del compat
 * bridge con el paquete agent-swarm. Eventualmente se migrarán a
 * implementaciones Mastra-nativas.
 */
export {
	clearRegisteredAgents,
	getAllRegisteredAgents,
	getRegisteredAgent,
} from "./agent-registry";
export type {
	BusMessage,
	DoraMetricsSnapshot,
	HealthStatus,
	OrchestrationContext,
	OrchestrationStrategy,
	RegistryDiscoveryCriteria,
	WorkerPoolMetrics,
} from "./agent-swarm-types";

export type {
	LegacyCapabilityToolsLookupInput,
	LegacyPolicyPreviewInput,
	NormalizedLegacyCapabilityToolsLookup,
	NormalizedLegacyPolicyPreview,
} from "./control-plane-facade";
export {
	createGovernanceValidator,
	normalizeLegacyCapabilityToolsLookup,
	normalizeLegacyPolicyPreviewInput,
} from "./control-plane-facade";
