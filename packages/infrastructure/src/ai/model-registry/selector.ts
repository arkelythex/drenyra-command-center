import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import type { AIProvider, ModelTier, TaskType, OpenRouterModelTier } from "./types";
import type { ModelDefinition, ModelSelectionConfig, ModelSelection } from "./types";
import { AVAILABLE_MODELS, TASK_TIER_REQUIREMENTS, OPENROUTER_MODEL_TIERS } from "./models";

// ============================================
// CONFIGURATION
// ============================================

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
// OPENROUTER SELECTION
// ============================================

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
    throw new Error(`Unknown OpenRouter tier: ${tierId}. Available: ${Object.keys(OPENROUTER_MODEL_TIERS).join(', ')}`);
  }
  return tier.models[0];  // First in list is preferred
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

export function getOpenRouterTierConfig(tierId: string): OpenRouterModelTier | null {
  return OPENROUTER_MODEL_TIERS[tierId] || null;
}
