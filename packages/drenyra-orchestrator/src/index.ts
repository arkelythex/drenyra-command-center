/**
 * Drenyra Orchestrator — Public API
 *
 * Barrel exports for the orchestrator package.
 */

// Types
export type {
	WorkRoute,
	DelegationTrigger,
	RouteDecision,
	GatekeeperCheck,
	GatekeeperVerdict,
	GatekeeperContext,
	SkillEntry,
	SkillRegistry,
	SkillResolution,
	MemoryContract,
	ReviewLens,
	ReviewLensConfig,
	DeliveryStrategy,
	ChainStrategy,
	ReviewWorkloadForecast,
	HookConfig,
} from "./types";

// Constants
export {
	DRENYRA_SDD_ARTIFACT_KEYS,
	ALL_4R_LENSES,
	DEFAULT_HOOK_CONFIG,
} from "./types";

// Delegation Router
export { determineRoute } from "./delegation-router";
export type {} from "./delegation-router";

// Skills Resolver
export {
	parseSkillRegistry,
	resolveRegistry,
	matchSkills,
} from "./skills-resolver";
export type { TaskContext } from "./skills-resolver";

// Memory Contract
export {
	DEFAULT_MEMORY_CONTRACT,
	buildMemoryInstructions,
	checkMemoryAvailable,
} from "./memory-contract";

// Work Routing
export {
	forecastReviewWorkload,
	getWorkflowInstructions,
} from "./work-routing";
export type { WorkloadInput } from "./work-routing";

// Config
export {
	createDefaultConfig,
	loadConfig,
	mergeConfig,
} from "./config";
export type { DrenyraOrchestratorConfig, HookBehavior } from "./config";

// Review Lenses
export {
	isHotPath,
	selectReviewLenses,
} from "./review-lenses";
