// ─── Barrel Exports — workspace-projections ─────────────────────────────────

// Store
export { type DomainEvent, CURRENT_EVENT_SCHEMA_VERSION } from "./store/types";
export type { EventStore } from "./store/interface";
export { InMemoryEventStore } from "./store/memory";

// Projections
export type { Projection, Checkpoint } from "./projections/types";
export {
	buildExecutionProjection,
	applyEventToProjection,
} from "./projections/execution-projection";
export { buildAttentionProjection } from "./projections/attention-projection";
export { buildPortfolioProjection } from "./projections/portfolio-projection";
export { buildFreshnessProjection } from "./projections/freshness-projection";

// Checkpoint
export {
	type CheckpointStore,
	createCheckpoint,
	shouldCreateCheckpoint,
} from "./checkpoint/manager";
export { replayFromCheckpoint } from "./checkpoint/replay";

// Rollups
export type {
	MaterialityLevel,
	MaterialityInput,
	ExecutionDeadline,
	WeightedRollupReason,
	PortfolioRollupInput,
} from "./rollups/index";
export {
	calculateMateriality,
	findNearestDeadline,
	propagateDeadline,
	generateRollupReasons,
	buildEnhancedPortfolioRollup,
} from "./rollups/index";
