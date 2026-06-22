export type {
	AIProvider,
	ModelTier,
	TaskType,
	OpenRouterModelTier,
} from "./types";

export {
	AVAILABLE_MODELS,
	TASK_TIER_REQUIREMENTS,
	OPENROUTER_MODEL_TIERS,
} from "./models";

export {
	configureModelSelection,
	getModelSelectionConfig,
	selectModelForTask,
	getModel,
	getCheapestFlashModel,
	getComplianceModel,
	estimateCost,
	modelFlash,
	modelReasoning,
	modelOpus,
	getModelForTask,
	getOpenRouterModelForTier,
	getOpenRouterFallbackChain,
	getOpenRouterTierConfig,
} from "./selector";
