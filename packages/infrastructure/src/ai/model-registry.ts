/**
 * Multi-Provider Model Registry
 *
 * Enables dynamic model selection across providers (Google, Anthropic, OpenAI)
 * to optimize for cost, speed, and capability.
 *
 * Strategy from docs/ai/ai-engine-antigravity.md:
 * - Flash tier: High volume, low cost
 * - Reasoning tier: Business logic, validation
 * - Opus tier: Complex analysis, regulatory interpretation
 *
 * @since December 2025
 */

import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

// ============================================
// PROVIDER TYPES
// ============================================

/**
 * AIProvider type.
 *
 * @example
 * ```ts
 * const value: AIProvider = {} as AIProvider;
 * console.log(value);
 * ```
 */
export type AIProvider = "google" | "anthropic" | "openai";

/**
 * ModelTier type.
 *
 * @example
 * ```ts
 * const value: ModelTier = {} as ModelTier;
 * console.log(value);
 * ```
 */
export type ModelTier = "flash" | "reasoning" | "opus";

/**
 * TaskType type.
 *
 * @example
 * ```ts
 * const value: TaskType = {} as TaskType;
 * console.log(value);
 * ```
 */
export type TaskType =
	| "ocr"
	| "extraction"
	| "classification"
	| "validation"
	| "correction"
	| "analysis"
	| "normative_reasoning"
	| "fraud_detection";

// ============================================
// MODEL DEFINITIONS
// ============================================

interface ModelDefinition {
	id: string;
	provider: AIProvider;
	tier: ModelTier;
	costPer1MInput: number; // USD
	costPer1MOutput: number; // USD
	contextWindow: number;
	available: boolean;
}

/**
 * Available models with pricing (November 2025)
 * @example
 * ```ts
 * console.log(AVAILABLE_MODELS);
 * ```
 */

export const AVAILABLE_MODELS: Record<string, ModelDefinition> = {
	// Google Models
	"gemini-3-flash": {
		id: "gemini-3-flash",
		provider: "google",
		tier: "flash",
		costPer1MInput: 0.1,
		costPer1MOutput: 0.4,
		contextWindow: 1_000_000,
		available: true,
	},
	"gemini-3-pro": {
		id: "gemini-3-pro",
		provider: "google",
		tier: "reasoning",
		costPer1MInput: 2.0,
		costPer1MOutput: 12.0,
		contextWindow: 2_000_000,
		available: true,
	},

	// Anthropic Models
	"claude-haiku-4.5": {
		id: "claude-3-5-haiku-latest",
		provider: "anthropic",
		tier: "flash",
		costPer1MInput: 1.0,
		costPer1MOutput: 5.0,
		contextWindow: 200_000,
		available: true,
	},
	"claude-sonnet-4.5": {
		id: "claude-sonnet-4-20250514",
		provider: "anthropic",
		tier: "reasoning",
		costPer1MInput: 3.0,
		costPer1MOutput: 15.0,
		contextWindow: 200_000,
		available: true,
	},
	"claude-opus-4.5": {
		id: "claude-opus-4-20250514",
		provider: "anthropic",
		tier: "opus",
		costPer1MInput: 5.0,
		costPer1MOutput: 25.0,
		contextWindow: 200_000,
		available: true,
	},

	// OpenAI Models (requires @ai-sdk/openai installation)
	// Uncomment when SDK is installed:
	// 'gpt-5-nano': { ... },
} as const;

// ============================================
// TASK TO TIER MAPPING
// ============================================

/**
 * Maps task types to the minimum required tier
 * @example
 * ```ts
 * console.log(TASK_TIER_REQUIREMENTS);
 * ```
 */

export const TASK_TIER_REQUIREMENTS: Record<TaskType, ModelTier> = {
	ocr: "flash",
	extraction: "flash",
	classification: "flash",
	validation: "reasoning",
	correction: "reasoning",
	analysis: "opus",
	normative_reasoning: "opus",
	fraud_detection: "opus",
};

// ============================================
// CONFIGURATION
// ============================================

interface ModelSelectionConfig {
	preferredProvider: AIProvider;
	fallbackProvider: AIProvider;
	allowCrossProvider: boolean;
	maxCostPerRequest: number | null;
	preferSpeed: boolean;
}

const DEFAULT_CONFIG: ModelSelectionConfig = {
	preferredProvider: "google",
	fallbackProvider: "anthropic",
	allowCrossProvider: true,
	maxCostPerRequest: null,
	preferSpeed: true,
};

let currentConfig = { ...DEFAULT_CONFIG };

/**
 * Update model selection configuration
 * @param config - Input for config.
 * @returns Result of configureModelSelection.
 * @example
 * ```ts
 * const result = configureModelSelection({} as Partial);
 * console.log(result);
 * ```
 */

export function configureModelSelection(config: Partial<ModelSelectionConfig>) {
	currentConfig = { ...currentConfig, ...config };
}

/**
 * Get current configuration
 * @returns Result of getModelSelectionConfig.
 * @example
 * ```ts
 * const result = getModelSelectionConfig();
 * console.log(result);
 * ```
 */

export function getModelSelectionConfig(): ModelSelectionConfig {
	return { ...currentConfig };
}

// ============================================
// MODEL INSTANTIATION
// ============================================

/**
 * Create a model instance from its definition
 */
function instantiateModel(modelKey: string): LanguageModel {
	const def = AVAILABLE_MODELS[modelKey];
	if (!def) {
		throw new Error(`Unknown model: ${modelKey}`);
	}

	switch (def.provider) {
		case "google":
			return google(def.id as Parameters<typeof google>[0]);
		case "anthropic":
			return anthropic(def.id as Parameters<typeof anthropic>[0]);
		case "openai":
			// OpenAI SDK not installed - fallback to Google
			console.warn(
				`[ModelRegistry] OpenAI not available, using Google fallback`,
			);
			return google("gemini-3-flash");
		default:
			throw new Error(`Unknown provider: ${def.provider}`);
	}
}

// ============================================
// INTELLIGENT MODEL SELECTION
// ============================================

interface ModelSelection {
	model: LanguageModel;
	modelKey: string;
	definition: ModelDefinition;
	selectionReason: string;
}

/**
 * Select the best model for a task given current configuration
 * @param task - Input for task.
 * @returns Result of selectModelForTask.
 * @throws Error when selectModelForTask cannot complete successfully.
 * @example
 * ```ts
 * const result = selectModelForTask({} as TaskType);
 * console.log(result);
 * ```
 */

export function selectModelForTask(task: TaskType): ModelSelection {
	const requiredTier = TASK_TIER_REQUIREMENTS[task];
	const tierPriority: ModelTier[] =
		requiredTier === "opus"
			? ["opus", "reasoning", "flash"]
			: requiredTier === "reasoning"
				? ["reasoning", "opus", "flash"]
				: ["flash", "reasoning", "opus"];

	// Find best model matching requirements
	const candidates = Object.entries(AVAILABLE_MODELS)
		.filter(([_, def]) => def.available)
		.filter(([_, def]) => {
			if (!currentConfig.allowCrossProvider) {
				return def.provider === currentConfig.preferredProvider;
			}
			return true;
		})
		.map(([key, def]) => ({ key, def }));

	// Sort by: tier priority, then cost (or speed if preferSpeed)
	const sorted = candidates.sort((a, b) => {
		// First by tier priority
		const tierA = tierPriority.indexOf(a.def.tier);
		const tierB = tierPriority.indexOf(b.def.tier);
		if (tierA !== tierB) return tierA - tierB;

		// Then by preferred provider
		if (
			a.def.provider === currentConfig.preferredProvider &&
			b.def.provider !== currentConfig.preferredProvider
		) {
			return -1;
		}
		if (
			b.def.provider === currentConfig.preferredProvider &&
			a.def.provider !== currentConfig.preferredProvider
		) {
			return 1;
		}

		// Finally by cost
		const costA = a.def.costPer1MInput + a.def.costPer1MOutput;
		const costB = b.def.costPer1MInput + b.def.costPer1MOutput;
		return costA - costB;
	});

	const best = sorted[0];
	if (!best) {
		throw new Error(`No available model for task: ${task}`);
	}

	return {
		model: instantiateModel(best.key),
		modelKey: best.key,
		definition: best.def,
		selectionReason: `Selected ${best.key} (${best.def.tier} tier) for ${task}`,
	};
}

// ============================================
// DIRECT MODEL ACCESS (for explicit selection)
// ============================================

/**
 * Get a specific model by key
 * @param modelKey - Input for modelKey.
 * @returns Result of getModel.
 * @example
 * ```ts
 * const result = getModel("");
 * console.log(result);
 * ```
 */

export function getModel(modelKey: string): LanguageModel {
	return instantiateModel(modelKey);
}

/**
 * Get cheapest model for high-volume tasks
 * @returns Result of getCheapestFlashModel.
 * @example
 * ```ts
 * const result = getCheapestFlashModel();
 * console.log(result);
 * ```
 */

export function getCheapestFlashModel(): ModelSelection {
	const flashModels = Object.entries(AVAILABLE_MODELS)
		.filter(([_, def]) => def.tier === "flash" && def.available)
		.sort((a, b) => {
			const costA = a[1].costPer1MInput + a[1].costPer1MOutput;
			const costB = b[1].costPer1MInput + b[1].costPer1MOutput;
			return costA - costB;
		});

	const [key, def] = flashModels[0] ?? [
		"gemini-3-flash",
		AVAILABLE_MODELS["gemini-3-flash"],
	];

	return {
		model: instantiateModel(key),
		modelKey: key,
		definition: def!,
		selectionReason: "Cheapest flash model for high-volume processing",
	};
}

/**
 * Get best model for regulatory/compliance reasoning
 * @returns Result of getComplianceModel.
 * @example
 * ```ts
 * const result = getComplianceModel();
 * console.log(result);
 * ```
 */

export function getComplianceModel(): ModelSelection {
	// Prefer Claude Opus for regulatory interpretation
	if (AVAILABLE_MODELS["claude-opus-4.5"]?.available) {
		return {
			model: instantiateModel("claude-opus-4.5"),
			modelKey: "claude-opus-4.5",
			definition: AVAILABLE_MODELS["claude-opus-4.5"],
			selectionReason: "Claude Opus for regulatory compliance reasoning",
		};
	}

	// Fallback to Gemini Pro
	return {
		model: instantiateModel("gemini-3-pro"),
		modelKey: "gemini-3-pro",
		definition: AVAILABLE_MODELS["gemini-3-pro"]!,
		selectionReason: "Gemini Pro as fallback for compliance reasoning",
	};
}

// ============================================
// COST ESTIMATION
// ============================================

/**
 * Estimate cost for a request
 * @param modelKey - Input for modelKey.
 * @param inputTokens - Input for inputTokens.
 * @param outputTokens - Input for outputTokens.
 * @returns Result of estimateCost.
 * @example
 * ```ts
 * const result = estimateCost("", 0, 0);
 * console.log(result);
 * ```
 */

export function estimateCost(
	modelKey: string,
	inputTokens: number,
	outputTokens: number,
): { inputCost: number; outputCost: number; totalCost: number } {
	const def = AVAILABLE_MODELS[modelKey];
	if (!def) {
		return { inputCost: 0, outputCost: 0, totalCost: 0 };
	}

	const inputCost = (inputTokens / 1_000_000) * def.costPer1MInput;
	const outputCost = (outputTokens / 1_000_000) * def.costPer1MOutput;

	return {
		inputCost: Math.round(inputCost * 10000) / 10000,
		outputCost: Math.round(outputCost * 10000) / 10000,
		totalCost: Math.round((inputCost + outputCost) * 10000) / 10000,
	};
}

// ============================================
// EXPORTS (Backward Compatibility)
// ============================================

// Keep existing model exports for backward compatibility
/**
 * modelFlash const.
 *
 * @example
 * ```ts
 * console.log(modelFlash);
 * ```
 */
export const modelFlash = google("gemini-3-flash");
/**
 * modelReasoning const.
 *
 * @example
 * ```ts
 * console.log(modelReasoning);
 * ```
 */
export const modelReasoning = google("gemini-3-pro");
/**
 * modelOpus const.
 *
 * @example
 * ```ts
 * console.log(modelOpus);
 * ```
 */
export const modelOpus = google("gemini-3-pro");

/**
 * getModelForTask operation.
 *
 * @param task - Input for task.
 * @returns Result of getModelForTask.
 * @example
 * ```ts
 * const result = getModelForTask("OCR");
 * console.log(result);
 * ```
 */
export function getModelForTask(
	task: "OCR" | "EXTRACTION" | "VALIDATION" | "CORRECTION" | "ANALYSIS",
) {
	const taskMap: Record<string, TaskType> = {
		OCR: "ocr",
		EXTRACTION: "extraction",
		VALIDATION: "validation",
		CORRECTION: "correction",
		ANALYSIS: "analysis",
	};
	return selectModelForTask(taskMap[task] ?? "classification").model;
}

// ============================================
// OPENROUTER TIERS (2026+ Future-Proof)
// ============================================

/**
 * OpenRouter model tiers for streaming + tool calling
 * Separated from Vercel AI SDK registry above
 *
 * Future-proof: When Claude Opus 4.6 (1M context) or Gemini 3 Pro drops,
 * update the array here and all endpoints automatically use it.
 *
 * @since Feb 2026
 * @example
 * ```ts
 * const value: OpenRouterModelTier = {} as OpenRouterModelTier;
 * console.log(value);
 * ```
 */

export interface OpenRouterModelTier {
	id: string;
	models: string[]; // Ordered preference, fallback chain
	maxTokens: number;
	temperature: number;
	costLimit: number; // Max USD per request
}

/**
 * Model tiers optimized for different capabilities via OpenRouter
 * @example
 * ```ts
 * console.log(OPENROUTER_MODEL_TIERS);
 * ```
 */

export const OPENROUTER_MODEL_TIERS: Record<string, OpenRouterModelTier> = {
	/**
	 * Reasoning - Complex problem solving, multi-step logic
	 * Use cases: SUNAT compliance, tax optimization, complex refactoring
	 */
	reasoning: {
		id: "reasoning",
		models: [
			"anthropic/claude-opus-4.6", // 2026: 1M context, extended thinking
			"google/gemini-3-pro", // 2026: Multimodal reasoning
			"anthropic/claude-opus-4", // Fallback (current best)
		],
		maxTokens: 8192,
		temperature: 0.3,
		costLimit: 0.5,
	},

	/**
	 * Fast - Quick responses, high throughput
	 * Use cases: Chat, validation, simple queries
	 */
	fast: {
		id: "fast",
		models: [
			"anthropic/claude-sonnet-4.5", // Current production (Feb 2026)
			"google/gemini-3-flash", // 2026: Ultra-fast, cheap
			"deepseek/deepseek-v3", // 2026: Open-source alternative
		],
		maxTokens: 4096,
		temperature: 0.4,
		costLimit: 0.1,
	},

	/**
	 * Code - Code generation, refactoring, reviews
	 * Use cases: Bug fixing, feature implementation, documentation
	 */
	code: {
		id: "code",
		models: [
			"deepseek/deepseek-coder-v3", // 2026: Best code model (open-source)
			"anthropic/claude-opus-4.6", // Fallback for complex refactors
			"anthropic/claude-sonnet-4.5", // Budget fallback
		],
		maxTokens: 16384,
		temperature: 0.1,
		costLimit: 0.3,
	},

	/**
	 * Vision - OCR, image analysis, document processing
	 * Use cases: Invoice OCR, document validation, diagrams
	 */
	vision: {
		id: "vision",
		models: [
			"google/gemini-3-pro", // 2026: Native multimodal
			"anthropic/claude-sonnet-4.5", // Vision support
			"openai/gpt-4o", // Fallback
		],
		maxTokens: 4096,
		temperature: 0.2,
		costLimit: 0.25,
	},
};

/**
 * Get preferred model for a tier (first in fallback chain)
 * @param tierId - Input for tierId.
 * @returns Result of getOpenRouterModelForTier.
 * @throws Error when getOpenRouterModelForTier cannot complete successfully.
 * @example
 * ```ts
 * const result = getOpenRouterModelForTier("");
 * console.log(result);
 * ```
 */

export function getOpenRouterModelForTier(tierId: string): string {
	const tier = OPENROUTER_MODEL_TIERS[tierId];
	if (!tier) {
		throw new Error(
			`Unknown OpenRouter tier: ${tierId}. Available: ${Object.keys(OPENROUTER_MODEL_TIERS).join(", ")}`,
		);
	}
	return tier.models[0]; // First in list is preferred
}

/**
 * Get complete fallback chain for a tier
 * @param tierId - Input for tierId.
 * @returns Result of getOpenRouterFallbackChain.
 * @example
 * ```ts
 * const result = getOpenRouterFallbackChain("");
 * console.log(result);
 * ```
 */

export function getOpenRouterFallbackChain(tierId: string): string[] {
	const tier = OPENROUTER_MODEL_TIERS[tierId];
	if (!tier) return [];
	return tier.models;
}

/**
 * Get tier configuration
 * @param tierId - Input for tierId.
 * @returns Result of getOpenRouterTierConfig.
 * @example
 * ```ts
 * const result = getOpenRouterTierConfig("");
 * console.log(result);
 * ```
 */

export function getOpenRouterTierConfig(
	tierId: string,
): OpenRouterModelTier | null {
	return OPENROUTER_MODEL_TIERS[tierId] || null;
}
